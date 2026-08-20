/**
 * Billing service — Ship 3B of SaaS conversion.
 *
 * Speaks directly to the Razorpay REST API via fetch (no SDK dep). Every
 * public method fails fast with a 501-flavoured error when Razorpay isn't
 * configured, so the Ship 3A WhatsApp-based fallback keeps working.
 */
import crypto from 'node:crypto';
import { basePrisma } from '../config/database';
import { getCurrentOrgId } from '../config/tenantContext';
import {
  razorpayConfig,
  isRazorpayConfigured,
  isRazorpayWebhookConfigured,
  razorpayPlanIdFor,
} from '../config/razorpay';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/ApiError';
import { SubscriptionPlan } from '@prisma/client';

const RAZORPAY_BASE = 'https://api.razorpay.com/v1';

/** Basic-auth header used on every Razorpay REST call. */
function authHeader() {
  const raw = `${razorpayConfig.keyId}:${razorpayConfig.keySecret}`;
  return 'Basic ' + Buffer.from(raw).toString('base64');
}

async function razorpayFetch(path: string, init: RequestInit = {}) {
  const res = await fetch(`${RAZORPAY_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: authHeader(),
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const body: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = body?.error?.description || `Razorpay ${res.status}`;
    throw new BadRequestError(`Razorpay: ${msg}`);
  }
  return body;
}

export class BillingService {
  /**
   * Public status endpoint — no secrets returned, just the ready/not-ready
   * signal so the frontend Billing page can decide whether to show real
   * "Subscribe" buttons or fall back to the WhatsApp CTA.
   */
  static getStatus() {
    return {
      configured: isRazorpayConfigured,
      webhookConfigured: isRazorpayWebhookConfigured,
      plansConfigured: Object.fromEntries(
        Object.entries(razorpayConfig.planIds).map(([k, v]) => [k, !!v]),
      ),
    };
  }

  /**
   * Create (or return existing) a Razorpay Subscription for the caller's
   * tenant on the requested plan. Returns the short_url the frontend
   * opens for hosted-checkout.
   */
  static async createSubscriptionForCurrentOrg(plan: SubscriptionPlan) {
    if (!isRazorpayConfigured) throw new BadRequestError('Razorpay not configured');
    if (plan === 'TRIAL') throw new BadRequestError('TRIAL is not a purchasable plan');
    const razorpayPlanId = razorpayPlanIdFor(plan);
    if (!razorpayPlanId) throw new BadRequestError(`No Razorpay plan id for ${plan}`);

    const orgId = getCurrentOrgId();
    if (!orgId) throw new ForbiddenError('No tenant context');
    const org = await basePrisma.organization.findUnique({ where: { id: orgId } });
    if (!org) throw new NotFoundError('Organization not found');

    // Reuse an ACTIVE sub for the same plan if one exists — avoids
    // creating duplicate Razorpay subscriptions when a user retries.
    const existing = await basePrisma.subscription.findFirst({
      where: { organizationId: orgId, plan, status: 'ACTIVE' },
    });
    if (existing) {
      // Fetch the current short_url in case the user closed the tab.
      const rp = await razorpayFetch(`/subscriptions/${existing.razorpaySubscriptionId}`);
      return { subscription: existing, shortUrl: rp.short_url };
    }

    const rp = await razorpayFetch('/subscriptions', {
      method: 'POST',
      body: JSON.stringify({
        plan_id: razorpayPlanId,
        total_count: 12,               // 12 monthly cycles then auto-renew logic re-quotes
        customer_notify: 1,
        notes: { organizationId: orgId, orgSlug: org.slug, plan },
      }),
    });

    const sub = await basePrisma.subscription.create({
      data: {
        organizationId:         orgId,
        plan,
        status:                 'ACTIVE',
        razorpaySubscriptionId: rp.id,
        razorpayPlanId,
      },
    });
    return { subscription: sub, shortUrl: rp.short_url };
  }

  /** Cancel at current period end so the customer keeps access they've paid for. */
  static async cancelCurrent() {
    if (!isRazorpayConfigured) throw new BadRequestError('Razorpay not configured');
    const orgId = getCurrentOrgId();
    if (!orgId) throw new ForbiddenError('No tenant context');

    const sub = await basePrisma.subscription.findFirst({
      where: { organizationId: orgId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });
    if (!sub) throw new NotFoundError('No active subscription');

    await razorpayFetch(`/subscriptions/${sub.razorpaySubscriptionId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ cancel_at_cycle_end: 1 }),
    });
    return basePrisma.subscription.update({
      where: { id: sub.id },
      data:  { cancelledAt: new Date() },
    });
  }

  /** Invoice history for the Billing page. */
  static async listInvoices() {
    const orgId = getCurrentOrgId();
    if (!orgId) throw new ForbiddenError('No tenant context');
    return basePrisma.invoice.findMany({
      where: { organizationId: orgId },
      orderBy: { issuedAt: 'desc' },
      take: 100,
    });
  }

  // -------------------------------------------------------------------
  // Webhook handling — Razorpay POSTs subscription + invoice events here
  // -------------------------------------------------------------------

  /**
   * Verify the HMAC-SHA256 signature Razorpay sends on every webhook.
   * The raw body (before JSON.parse) is required for the HMAC to match,
   * so the caller passes the raw string.
   */
  static verifyWebhookSignature(rawBody: string, signature: string): boolean {
    if (!isRazorpayWebhookConfigured) return false;
    const expected = crypto
      .createHmac('sha256', razorpayConfig.webhookSecret)
      .update(rawBody)
      .digest('hex');
    // Timing-safe compare
    try {
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    } catch {
      return false;
    }
  }

  /**
   * Route a verified webhook to the right handler. Returns quickly and
   * never throws so Razorpay marks the delivery as successful — we log
   * unknown events but ack them.
   */
  static async handleWebhook(event: any): Promise<{ handled: boolean; type: string }> {
    const type = String(event?.event || '');
    try {
      switch (type) {
        case 'subscription.activated':
        case 'subscription.charged':
        case 'subscription.updated': {
          const sub = event.payload?.subscription?.entity;
          if (!sub?.id) break;
          const row = await basePrisma.subscription.findUnique({
            where: { razorpaySubscriptionId: sub.id },
          });
          if (!row) break;
          const orgId = sub.notes?.organizationId || row.organizationId;
          const plan  = (sub.notes?.plan as SubscriptionPlan) || row.plan;
          await basePrisma.$transaction([
            basePrisma.subscription.update({
              where: { id: row.id },
              data: {
                status: 'ACTIVE',
                currentPeriodStart: sub.current_start ? new Date(sub.current_start * 1000) : null,
                currentPeriodEnd:   sub.current_end   ? new Date(sub.current_end * 1000)   : null,
              },
            }),
            // Flip org's plan on the first successful charge.
            basePrisma.organization.update({
              where: { id: orgId },
              data:  { plan },
            }),
          ]);
          break;
        }
        case 'subscription.completed':
        case 'subscription.cancelled': {
          const sub = event.payload?.subscription?.entity;
          if (!sub?.id) break;
          await basePrisma.subscription.updateMany({
            where: { razorpaySubscriptionId: sub.id },
            data:  { status: 'CANCELLED', cancelledAt: new Date() },
          });
          break;
        }
        case 'subscription.pending':
        case 'subscription.halted': {
          const sub = event.payload?.subscription?.entity;
          if (!sub?.id) break;
          await basePrisma.subscription.updateMany({
            where: { razorpaySubscriptionId: sub.id },
            data:  { status: 'PAST_DUE' },
          });
          break;
        }
        case 'invoice.paid':
        case 'invoice.payment_failed': {
          const inv = event.payload?.invoice?.entity;
          if (!inv?.id) break;
          const sub = inv.subscription_id
            ? await basePrisma.subscription.findUnique({ where: { razorpaySubscriptionId: inv.subscription_id } })
            : null;
          const orgId = sub?.organizationId || inv.notes?.organizationId;
          if (!orgId) break;
          await basePrisma.invoice.upsert({
            where:  { razorpayInvoiceId: inv.id },
            update: {
              status:  type === 'invoice.paid' ? 'PAID' : 'FAILED',
              paidAt:  type === 'invoice.paid' && inv.paid_at ? new Date(inv.paid_at * 1000) : null,
              pdfUrl:  inv.short_url || undefined,
              razorpayPaymentId: inv.payment_id || undefined,
            },
            create: {
              organizationId:    orgId,
              subscriptionId:    sub?.id,
              amount:            Number((inv.amount || 0) / 100).toFixed(2),
              currency:          (inv.currency || 'INR').toUpperCase(),
              status:            type === 'invoice.paid' ? 'PAID' : 'FAILED',
              razorpayInvoiceId: inv.id,
              razorpayPaymentId: inv.payment_id || null,
              issuedAt:          inv.issued_at ? new Date(inv.issued_at * 1000) : new Date(),
              paidAt:            type === 'invoice.paid' && inv.paid_at ? new Date(inv.paid_at * 1000) : null,
              pdfUrl:            inv.short_url || null,
            },
          });
          break;
        }
        default:
          return { handled: false, type };
      }
      return { handled: true, type };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('BillingService.handleWebhook error', { type, err });
      return { handled: false, type };
    }
  }
}
