/**
 * Server-side plan config — Ship 4 of SaaS conversion.
 * Mirrors frontend/src/config/plans.ts but this is the AUTHORITATIVE
 * source: the frontend copy is only used for display. Server-side limits
 * are always enforced through this file so a client can't lie its way
 * past a limit by tampering with the UI.
 *
 * When Ship 3B ships Razorpay, we'll add plan.razorpayPlanId here so the
 * checkout knows which plan to create in Razorpay's dashboard.
 */
import { SubscriptionPlan } from '@prisma/client';

export interface PlanLimits {
  branches:   number;   // Number.POSITIVE_INFINITY == unlimited
  staff:      number;
  waMsgs:     number;   // per calendar month
  memberships: boolean; // feature gate
  referrals:   boolean;
  growthKit:   boolean;
  multiBranchReports: boolean;
  apiAccess:   boolean;
}

const UNLIMITED = Number.POSITIVE_INFINITY;

export const PLAN_LIMITS: Record<SubscriptionPlan, PlanLimits> = {
  TRIAL: {
    // Trials get Growth-tier features so owners can evaluate everything
    // before deciding what to buy.
    branches: 3,
    staff:    10,
    waMsgs:   500,
    memberships: true,
    referrals:   true,
    growthKit:   true,
    multiBranchReports: false,
    apiAccess:   false,
  },
  STARTER: {
    branches: 1,
    staff:    3,
    waMsgs:   100,
    memberships: false,
    referrals:   false,
    growthKit:   false,
    multiBranchReports: false,
    apiAccess:   false,
  },
  GROWTH: {
    branches: 3,
    staff:    10,
    waMsgs:   500,
    memberships: true,
    referrals:   true,
    growthKit:   true,
    multiBranchReports: false,
    apiAccess:   false,
  },
  PRO: {
    branches: UNLIMITED,
    staff:    UNLIMITED,
    waMsgs:   1000,
    memberships: true,
    referrals:   true,
    growthKit:   true,
    multiBranchReports: true,
    apiAccess:   true,
  },
};

/** Suggest the next tier up for the "upgrade to X" copy in the 402 payload. */
export function nextTier(plan: SubscriptionPlan): SubscriptionPlan {
  if (plan === 'TRIAL')   return 'GROWTH';
  if (plan === 'STARTER') return 'GROWTH';
  if (plan === 'GROWTH')  return 'PRO';
  return 'PRO';
}

/** Convenience — turn Infinity into a friendly label for API responses. */
export function limitLabel(n: number): string {
  return Number.isFinite(n) ? String(n) : 'Unlimited';
}
