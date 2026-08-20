/**
 * Usage / plan-limit enforcement — Ship 4 of SaaS conversion.
 *
 * Every write that can push a tenant over their plan runs one of these
 * asserts before touching Prisma. On over-limit they throw PlanLimitError
 * (HTTP 402) with structured details so the frontend can render an inline
 * upgrade CTA rather than a generic error toast.
 *
 * Reads use the RAW prisma client (basePrisma) to bypass the tenant-scope
 * extension — we want an org-specific count based on the CALLER'S org,
 * regardless of who's asking. The org id comes from the tenant context
 * (Ship 1A), so it's always the caller's own tenant.
 */
import { basePrisma } from '../config/database';
import { getCurrentOrgId } from '../config/tenantContext';
import { PLAN_LIMITS, nextTier } from '../config/plans';
import { PlanLimitError, ForbiddenError, NotFoundError } from '../utils/ApiError';
import { SubscriptionPlan } from '@prisma/client';

async function currentOrg() {
  const orgId = getCurrentOrgId();
  if (!orgId) throw new ForbiddenError('No tenant context');
  const org = await basePrisma.organization.findUnique({ where: { id: orgId } });
  if (!org) throw new NotFoundError('Organization not found');
  return org;
}

export class UsageService {
  /** Block branch creation if the tenant is at their plan's branch cap. */
  static async assertCanAddBranch() {
    const org = await currentOrg();
    const limits = PLAN_LIMITS[org.plan as SubscriptionPlan];
    if (!Number.isFinite(limits.branches)) return;

    const count = await basePrisma.branch.count({ where: { organizationId: org.id } });
    if (count >= limits.branches) {
      throw new PlanLimitError({
        resource:    'branches',
        currentPlan: org.plan,
        limit:       limits.branches,
        current:     count,
        upgradeTo:   nextTier(org.plan as SubscriptionPlan),
      });
    }
  }

  /** Block staff creation if the tenant is at their plan's staff cap. */
  static async assertCanAddStaff() {
    const org = await currentOrg();
    const limits = PLAN_LIMITS[org.plan as SubscriptionPlan];
    if (!Number.isFinite(limits.staff)) return;

    const count = await basePrisma.staff.count({ where: { organizationId: org.id } });
    if (count >= limits.staff) {
      throw new PlanLimitError({
        resource:    'staff',
        currentPlan: org.plan,
        limit:       limits.staff,
        current:     count,
        upgradeTo:   nextTier(org.plan as SubscriptionPlan),
      });
    }
  }

  /**
   * Feature-flag check for the paid gates (memberships / referrals /
   * growth kit / multi-branch reports / API). Throws when the caller's
   * plan doesn't include the feature so route middlewares can gate whole
   * endpoints in one line.
   */
  static async assertFeature(feature: keyof typeof PLAN_LIMITS['TRIAL']) {
    const org = await currentOrg();
    const limits = PLAN_LIMITS[org.plan as SubscriptionPlan];
    const enabled = limits[feature];
    // Booleans → true means unlocked; numbers are quota checks handled above.
    if (enabled === true) return;
    if (enabled === false) {
      throw new PlanLimitError({
        resource:    feature as any,
        currentPlan: org.plan,
        limit:       0,
        current:     0,
        upgradeTo:   nextTier(org.plan as SubscriptionPlan),
      }, `Your ${org.plan} plan does not include ${String(feature)}. Upgrade to ${nextTier(org.plan as SubscriptionPlan)} to unlock.`);
    }
  }
}
