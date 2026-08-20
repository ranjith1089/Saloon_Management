/**
 * Organization service — Ship 2 of SaaS conversion.
 *
 * Owner-facing operations on the caller's own tenant. Reads and writes are
 * strictly scoped to `getCurrentOrgId()` — no cross-org access.
 */
import prisma from '../config/database';
import { getCurrentOrgId } from '../config/tenantContext';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/ApiError';
import { isReserved, normaliseSlug } from '../utils/slug';
import { UsageService } from './usage.service';
import { PLAN_LIMITS } from '../config/plans';
import { SubscriptionPlan } from '@prisma/client';
import { basePrisma } from '../config/database';
import { runAsSystem } from '../config/tenantContext';

export class OrganizationService {
  /** Return the current tenant + owner + counts. Used by the wizard + billing UI. */
  static async getCurrent() {
    const orgId = getCurrentOrgId();
    if (!orgId) throw new ForbiddenError('No tenant context');

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        _count: { select: { users: true, branches: true } },
      },
    });
    if (!org) throw new NotFoundError('Organization not found');

    // Trial state — computed here so the client doesn't have to.
    const now = Date.now();
    const trialDaysRemaining =
      org.plan === 'TRIAL' && org.trialEndsAt
        ? Math.max(0, Math.ceil((org.trialEndsAt.getTime() - now) / (24 * 60 * 60 * 1000)))
        : null;
    const trialExpired = org.plan === 'TRIAL' && org.trialEndsAt !== null && org.trialEndsAt.getTime() < now;

    // Current-month usage + this plan's caps so the Billing page can
    // draw progress bars without another round trip.
    const usage  = await UsageService.getCurrentUsage();
    const limits = PLAN_LIMITS[org.plan as SubscriptionPlan];

    return {
      ...org,
      trialDaysRemaining,
      trialExpired,
      usage: {
        waMsgsThisMonth: usage.waMsgs,
        waMsgsCap:       Number.isFinite(limits.waMsgs) ? limits.waMsgs : null,
        branchesCap:     Number.isFinite(limits.branches) ? limits.branches : null,
        staffCap:        Number.isFinite(limits.staff) ? limits.staff : null,
      },
    };
  }

  /**
   * Owner-only update of tenant settings (name, slug, country, currency).
   * Slug changes go through the reserved-name filter + collision check.
   */
  static async updateCurrent(patch: {
    name?: string;
    slug?: string;
    country?: string;
    currency?: string;
  }) {
    const orgId = getCurrentOrgId();
    if (!orgId) throw new ForbiddenError('No tenant context');

    const data: any = {};
    if (patch.name)     data.name = patch.name.trim();
    if (patch.country)  data.country = patch.country.trim().toUpperCase().slice(0, 2);
    if (patch.currency) data.currency = patch.currency.trim().toUpperCase().slice(0, 3);

    if (patch.slug) {
      const clean = normaliseSlug(patch.slug);
      if (!clean) throw new BadRequestError('Slug is empty after normalisation');
      if (isReserved(clean)) throw new BadRequestError(`"${clean}" is a reserved name — pick another`);
      // Collision check — allow no-op update on same org
      const existing = await prisma.organization.findUnique({ where: { slug: clean } });
      if (existing && existing.id !== orgId) throw new BadRequestError(`"${clean}" is already taken`);
      data.slug = clean;
    }

    return prisma.organization.update({ where: { id: orgId }, data });
  }

  /**
   * DPDPA / GDPR data export — returns every row this tenant owns as one
   * JSON bundle. Uses the raw client so we can bypass the tenant scope
   * extension (we filter by orgId manually) and pull related child rows
   * that don't carry organizationId on their own.
   */
  static async exportAllData() {
    const orgId = getCurrentOrgId();
    if (!orgId) throw new ForbiddenError('No tenant context');

    return runAsSystem(async () => {
      const [
        organization, users, branches, services, staff, customers, bookings,
        products, productSales, coupons, membershipPlans, memberships, reviews,
        payouts, staffEarnings, notifications, subscriptions, invoices,
      ] = await Promise.all([
        basePrisma.organization.findUnique({ where: { id: orgId } }),
        basePrisma.user.findMany({ where: { organizationId: orgId }, include: { profile: true } }),
        basePrisma.branch.findMany({ where: { organizationId: orgId } }),
        basePrisma.service.findMany({ where: { organizationId: orgId } }),
        basePrisma.staff.findMany({ where: { organizationId: orgId } }),
        basePrisma.customer.findMany({ where: { organizationId: orgId } }),
        basePrisma.booking.findMany({ where: { organizationId: orgId } }),
        basePrisma.product.findMany({ where: { organizationId: orgId } }),
        basePrisma.productSale.findMany({ where: { organizationId: orgId }, include: { items: true } }),
        basePrisma.coupon.findMany({ where: { organizationId: orgId } }),
        basePrisma.membershipPlan.findMany({ where: { organizationId: orgId } }),
        basePrisma.membership.findMany({ where: { organizationId: orgId } }),
        basePrisma.review.findMany({ where: { organizationId: orgId } }),
        basePrisma.payout.findMany({ where: { organizationId: orgId } }),
        basePrisma.staffEarning.findMany({ where: { organizationId: orgId } }),
        basePrisma.notification.findMany({ where: { organizationId: orgId } }),
        basePrisma.subscription.findMany({ where: { organizationId: orgId } }),
        basePrisma.invoice.findMany({ where: { organizationId: orgId } }),
      ]);

      // Scrub secret material before shipping to the client.
      const safeUsers = users.map((u) => ({ ...u, passwordHash: undefined }));

      return {
        exportedAt: new Date().toISOString(),
        organization,
        counts: {
          users: users.length, branches: branches.length, services: services.length,
          staff: staff.length, customers: customers.length, bookings: bookings.length,
          products: products.length, productSales: productSales.length,
          coupons: coupons.length, membershipPlans: membershipPlans.length,
          memberships: memberships.length, reviews: reviews.length,
          payouts: payouts.length, staffEarnings: staffEarnings.length,
          notifications: notifications.length, subscriptions: subscriptions.length,
          invoices: invoices.length,
        },
        data: {
          users: safeUsers, branches, services, staff, customers, bookings,
          products, productSales, coupons, membershipPlans, memberships,
          reviews, payouts, staffEarnings, notifications, subscriptions, invoices,
        },
      };
    });
  }

  /**
   * Soft-delete the tenant. Sets status=DELETED so login is refused; the
   * actual row purge happens later via a super-admin action. Cheap for
   * the customer to change their mind.
   */
  static async requestDeletion() {
    const orgId = getCurrentOrgId();
    if (!orgId) throw new ForbiddenError('No tenant context');
    if (orgId === '00000000-0000-0000-0000-000000000001') {
      throw new BadRequestError('The Default Organization cannot be deleted');
    }
    return runAsSystem(() =>
      basePrisma.organization.update({
        where: { id: orgId },
        data:  { status: 'DELETED' },
      }),
    );
  }

  /**
   * Onboarding progress signal — the wizard checks each step and can decide
   * whether to show itself. Cheap read, safe to call on every dashboard load.
   */
  static async onboardingStatus() {
    const orgId = getCurrentOrgId();
    if (!orgId) throw new ForbiddenError('No tenant context');

    const [org, branches, services, staff] = await Promise.all([
      prisma.organization.findUnique({ where: { id: orgId } }),
      prisma.branch.count({ where: { organizationId: orgId } }),
      prisma.service.count({ where: { organizationId: orgId } }),
      prisma.staff.count({ where: { organizationId: orgId } }),
    ]);
    if (!org) throw new NotFoundError('Organization not found');

    return {
      orgSet:      !!org.name && org.name !== 'Default Organization',
      countrySet:  !!org.country,
      hasBranch:   branches > 0,
      hasService:  services > 0,
      hasStaff:    staff > 0,
      complete:    branches > 0 && services > 0,   // minimal "ready to book" bar
    };
  }
}
