/**
 * Razorpay Subscriptions config — Ship 3B.
 *
 * All four env vars are OPTIONAL. If key + secret are missing, the app
 * still boots and every billing endpoint returns 501 with a "not
 * configured" message so the Ship 3A WhatsApp-based fallback keeps
 * working. When ops add these to Railway, real checkout activates
 * without a code change.
 *
 * SETUP GUIDE (points at Razorpay dashboard)
 *   1. Dashboard → Account & Settings → API Keys → Generate Key
 *      → set RAZORPAY_KEY_ID  and  RAZORPAY_KEY_SECRET on Railway
 *   2. Products → Subscriptions → Create 3 plans (Monthly recurring):
 *        Starter    ₹249  → copy the plan_id → RAZORPAY_PLAN_ID_STARTER
 *        Growth     ₹699  → copy the plan_id → RAZORPAY_PLAN_ID_GROWTH
 *        Pro        ₹1399 → copy the plan_id → RAZORPAY_PLAN_ID_PRO
 *   3. Settings → Webhooks → New Webhook
 *        URL:     https://<railway-domain>/api/v1/webhooks/razorpay
 *        Secret:  generate + copy → RAZORPAY_WEBHOOK_SECRET
 *        Events:  subscription.activated, subscription.charged,
 *                 subscription.completed, subscription.cancelled,
 *                 subscription.paused, subscription.pending
 *   4. Redeploy Railway — GET /billing/status flips to "configured".
 */
import { SubscriptionPlan } from '@prisma/client';

export const razorpayConfig = {
  keyId:         process.env.RAZORPAY_KEY_ID || '',
  keySecret:     process.env.RAZORPAY_KEY_SECRET || '',
  webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  planIds: {
    STARTER: process.env.RAZORPAY_PLAN_ID_STARTER || '',
    GROWTH:  process.env.RAZORPAY_PLAN_ID_GROWTH  || '',
    PRO:     process.env.RAZORPAY_PLAN_ID_PRO     || '',
  } as Partial<Record<SubscriptionPlan, string>>,
};

/** Ready to charge cards? Both an API key and a webhook secret are needed. */
export const isRazorpayConfigured = !!(razorpayConfig.keyId && razorpayConfig.keySecret);

/** Ready to accept webhook callbacks? */
export const isRazorpayWebhookConfigured = !!razorpayConfig.webhookSecret;

/** Map an internal plan tier to the Razorpay plan_id, or null if not wired. */
export function razorpayPlanIdFor(plan: SubscriptionPlan): string | null {
  return razorpayConfig.planIds[plan] || null;
}
