/**
 * Plan definitions — shared between the Billing page, the trial banner
 * upgrade CTA, and any future feature-gate UI. Prices mirror the public
 * marketing site (per-branch, monthly, ex-GST).
 *
 * Ship 3B will move these to the backend so they're a single source of
 * truth for the checkout flow. For now, frontend-only is fine because
 * upgrades go through a WhatsApp conversation, not an automated flow.
 */
export type PlanCode = 'TRIAL' | 'STARTER' | 'GROWTH' | 'PRO';

export interface PlanDef {
  code: PlanCode;
  name: string;
  tag: string;
  desc: string;
  highlight?: boolean;
  price: Record<'INR' | 'USD' | 'GBP' | 'AED', number>;
  limits: { branches: number | 'unlimited'; staff: number | 'unlimited'; waMsgs: number };
  features: string[];
}

export const PLANS: PlanDef[] = [
  {
    code: 'STARTER',
    name: 'Starter',
    tag: 'Solo salons',
    desc: 'Everything you need to run a single salon.',
    price: { INR: 249, USD: 39, GBP: 29, AED: 149 },
    limits: { branches: 1, staff: 3, waMsgs: 100 },
    features: [
      'Bookings + POS',
      'Public booking widget',
      '100 WhatsApp msgs / mo',
      'Up to 3 staff',
      'Custom branding',
    ],
  },
  {
    code: 'GROWTH',
    name: 'Growth',
    tag: 'Most popular',
    desc: 'For salons ready to grow their client base.',
    highlight: true,
    price: { INR: 699, USD: 79, GBP: 59, AED: 349 },
    limits: { branches: 3, staff: 10, waMsgs: 500 },
    features: [
      'Everything in Starter',
      'Memberships & referrals',
      '500 WhatsApp msgs / mo',
      'Up to 10 staff',
      'Growth toolkit',
    ],
  },
  {
    code: 'PRO',
    name: 'Pro',
    tag: 'Chains & spas',
    desc: 'Multi-branch operations with priority support.',
    price: { INR: 1399, USD: 149, GBP: 119, AED: 649 },
    limits: { branches: 'unlimited', staff: 'unlimited', waMsgs: 1000 },
    features: [
      'Everything in Growth',
      'Multi-branch reports',
      'Unlimited staff',
      '1,000 WhatsApp msgs / mo',
      'API access',
      'Priority support',
    ],
  },
];

export const CURRENCY_SYMBOL: Record<'INR' | 'USD' | 'GBP' | 'AED', string> = {
  INR: '₹',
  USD: '$',
  GBP: '£',
  AED: 'AED ',
};

export function planByCode(code: PlanCode): PlanDef | undefined {
  return PLANS.find((p) => p.code === code);
}

// Feature flags per plan — mirror of backend/src/config/plans.ts
// PLAN_LIMITS booleans. Used by the sidebar to render a crown/lock on
// items the current plan can't open, so the click doesn't dead-end at
// a 402 toast.
export type FeatureFlag = 'memberships' | 'referrals' | 'growthKit' | 'multiBranchReports' | 'apiAccess';

export const PLAN_FEATURES: Record<PlanCode, Record<FeatureFlag, boolean>> = {
  TRIAL:   { memberships: true,  referrals: true,  growthKit: true,  multiBranchReports: false, apiAccess: false },
  STARTER: { memberships: false, referrals: false, growthKit: false, multiBranchReports: false, apiAccess: false },
  GROWTH:  { memberships: true,  referrals: true,  growthKit: true,  multiBranchReports: false, apiAccess: false },
  PRO:     { memberships: true,  referrals: true,  growthKit: true,  multiBranchReports: true,  apiAccess: true  },
};

export function planIncludes(plan: PlanCode | undefined, feature: FeatureFlag): boolean {
  if (!plan) return true;   // no plan info yet → don't lock speculatively
  return PLAN_FEATURES[plan]?.[feature] ?? true;
}
