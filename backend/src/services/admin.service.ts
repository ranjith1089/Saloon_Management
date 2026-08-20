/**
 * Super-admin service — Ship 5A of SaaS conversion.
 *
 * The only place in the app that reads / writes ACROSS tenants. Every
 * public method wraps its work in `runAsSystem()` so the Ship 1B tenant
 * scope extension does not filter anything out.
 *
 * Route middleware in super-admin.routes.ts locks these to SUPERADMIN
 * users only; there is no other guard on the queries.
 */
import { basePrisma } from '../config/database';
import { runAsSystem } from '../config/tenantContext';
import { NotFoundError, BadRequestError } from '../utils/ApiError';
import { SubscriptionPlan, OrganizationStatus } from '@prisma/client';
import { PLAN_LIMITS } from '../config/plans';
import { generateAccessToken, generateRefreshToken, JwtPayload } from '../utils/jwt';

const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000001';

export class AdminService {
  /** List every organization for the /admin dashboard. */
  static async listOrganizations(opts: { search?: string; plan?: SubscriptionPlan; status?: OrganizationStatus; limit?: number; offset?: number } = {}) {
    return runAsSystem(async () => {
      const where: any = {};
      if (opts.search) {
        where.OR = [
          { name: { contains: opts.search, mode: 'insensitive' } },
          { slug: { contains: opts.search, mode: 'insensitive' } },
        ];
      }
      if (opts.plan)   where.plan   = opts.plan;
      if (opts.status) where.status = opts.status;

      const [rows, total] = await Promise.all([
        basePrisma.organization.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take:  opts.limit ?? 50,
          skip:  opts.offset ?? 0,
          include: {
            _count: { select: { users: true, branches: true } },
          },
        }),
        basePrisma.organization.count({ where }),
      ]);

      // Owner email + last-active per org — separate query to keep
      // include shape simple (owner is not a Prisma relation).
      const ownerIds = rows.map((r) => r.ownerUserId).filter(Boolean) as string[];
      const owners = ownerIds.length
        ? await basePrisma.user.findMany({
            where: { id: { in: ownerIds } },
            select: { id: true, email: true, profile: { select: { firstName: true, lastName: true, phone: true } } },
          })
        : [];
      const byId = new Map(owners.map((o) => [o.id, o]));

      return {
        total,
        rows: rows.map((r) => ({
          ...r,
          isDefault: r.id === DEFAULT_ORG_ID,
          owner: r.ownerUserId ? byId.get(r.ownerUserId) : null,
        })),
      };
    });
  }

  /** Detailed view for a single org — used by the drawer / modal. */
  static async getOrganization(orgId: string) {
    return runAsSystem(async () => {
      const org = await basePrisma.organization.findUnique({
        where: { id: orgId },
        include: {
          _count: { select: { users: true, branches: true } },
        },
      });
      if (!org) throw new NotFoundError('Organization not found');

      const [owner, subs, invoices, thisMonthMeter] = await Promise.all([
        org.ownerUserId ? basePrisma.user.findUnique({
          where: { id: org.ownerUserId },
          select: { id: true, email: true, profile: { select: { firstName: true, lastName: true, phone: true } } },
        }) : null,
        basePrisma.subscription.findMany({
          where: { organizationId: orgId },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
        basePrisma.invoice.findMany({
          where: { organizationId: orgId },
          orderBy: { issuedAt: 'desc' },
          take: 12,
        }),
        (() => {
          const d = new Date();
          const month = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
          return basePrisma.usageMeter.findUnique({
            where: { organizationId_month: { organizationId: orgId, month } },
          });
        })(),
      ]);

      const limits = PLAN_LIMITS[org.plan];
      return {
        ...org,
        isDefault: org.id === DEFAULT_ORG_ID,
        owner,
        subscriptions: subs,
        invoices,
        usage: {
          waMsgsThisMonth: thisMonthMeter?.waMsgs ?? 0,
          waMsgsCap:       Number.isFinite(limits.waMsgs)   ? limits.waMsgs   : null,
          branchesCap:     Number.isFinite(limits.branches) ? limits.branches : null,
          staffCap:        Number.isFinite(limits.staff)    ? limits.staff    : null,
        },
      };
    });
  }

  /** Aggregate stats for the header row of /admin. */
  static async summary() {
    return runAsSystem(async () => {
      const [total, byPlan, trialActive, trialExpired, invoicesPaidMonth] = await Promise.all([
        basePrisma.organization.count(),
        basePrisma.organization.groupBy({ by: ['plan'], _count: { _all: true } }),
        basePrisma.organization.count({ where: { plan: 'TRIAL', trialEndsAt: { gt: new Date() } } }),
        basePrisma.organization.count({ where: { plan: 'TRIAL', trialEndsAt: { lt: new Date() } } }),
        (() => {
          const start = new Date();
          start.setUTCDate(1);
          start.setUTCHours(0, 0, 0, 0);
          return basePrisma.invoice.aggregate({
            where: { status: 'PAID', paidAt: { gte: start } },
            _sum:  { amount: true },
            _count: { _all: true },
          });
        })(),
      ]);
      const plans: Record<string, number> = {};
      for (const row of byPlan) plans[row.plan] = row._count._all;
      return {
        totalOrgs: total,
        plans,
        trialActive,
        trialExpired,
        mrrThisMonth: Number(invoicesPaidMonth._sum.amount || 0),
        invoicesThisMonth: invoicesPaidMonth._count._all,
      };
    });
  }

  /** Recent super-admin actions across the platform. */
  static async recentAuditLog(limit = 100) {
    return runAsSystem(() =>
      basePrisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take:    limit,
      }),
    );
  }

  /** Manually change a tenant's plan. Bypasses Razorpay — use for support / comps. */
  static async changePlan(orgId: string, plan: SubscriptionPlan) {
    return runAsSystem(async () => {
      const org = await basePrisma.organization.findUnique({ where: { id: orgId } });
      if (!org) throw new NotFoundError('Organization not found');
      return basePrisma.organization.update({
        where: { id: orgId },
        data:  {
          plan,
          // Leaving a TRIAL org gets its trialEndsAt cleared so the banner disappears.
          trialEndsAt: plan === 'TRIAL' ? org.trialEndsAt : null,
        },
      });
    });
  }

  /** Push the trial end date out by N days. Useful for support extensions. */
  static async extendTrial(orgId: string, days: number) {
    if (!Number.isFinite(days) || days < 1 || days > 365) {
      throw new BadRequestError('days must be between 1 and 365');
    }
    return runAsSystem(async () => {
      const org = await basePrisma.organization.findUnique({ where: { id: orgId } });
      if (!org) throw new NotFoundError('Organization not found');
      const from = org.trialEndsAt && org.trialEndsAt > new Date() ? org.trialEndsAt : new Date();
      const next = new Date(from.getTime() + days * 24 * 60 * 60 * 1000);
      return basePrisma.organization.update({
        where: { id: orgId },
        data:  { plan: 'TRIAL', trialEndsAt: next },
      });
    });
  }

  /**
   * Issue an impersonation token pair for the owner of the target org.
   * The JWTs carry the target user's identity + role so the whole app
   * treats them as if they logged in, plus an `act` claim so the frontend
   * (and future backend audit checks) can see who's actually driving.
   * Caller is expected to be SUPERADMIN — enforced by the route guard.
   */
  static async impersonateOrgOwner(orgId: string, actor: { userId: string; email: string }) {
    return runAsSystem(async () => {
      const org = await basePrisma.organization.findUnique({ where: { id: orgId } });
      if (!org) throw new NotFoundError('Organization not found');
      if (!org.ownerUserId) {
        // Fall back to the first non-customer user in the org so support
        // works even for orgs whose owner row was somehow orphaned.
        const anyStaff = await basePrisma.user.findFirst({
          where: { organizationId: org.id, role: { in: ['OWNER', 'ADMIN', 'MANAGER', 'STAFF'] } },
          orderBy: { createdAt: 'asc' },
        });
        if (!anyStaff) throw new NotFoundError('No team user found in this organization');
        org.ownerUserId = anyStaff.id;
      }
      const target = await basePrisma.user.findUnique({
        where:   { id: org.ownerUserId },
        include: { profile: true },
      });
      if (!target) throw new NotFoundError('Owner user not found');

      const payload: JwtPayload = {
        userId:         target.id,
        email:          target.email,
        role:           target.role,
        organizationId: target.organizationId,
        act:            { userId: actor.userId, email: actor.email },
      };
      const accessToken  = generateAccessToken(payload);
      const refreshToken = generateRefreshToken(payload);
      return { user: { ...target, passwordHash: undefined }, accessToken, refreshToken, organization: org };
    });
  }

  /** Suspend / reactivate a tenant. */
  static async setStatus(orgId: string, status: OrganizationStatus) {
    if (orgId === DEFAULT_ORG_ID && status !== 'ACTIVE') {
      throw new BadRequestError('The Default Organization cannot be suspended');
    }
    return runAsSystem(async () => {
      const org = await basePrisma.organization.findUnique({ where: { id: orgId } });
      if (!org) throw new NotFoundError('Organization not found');
      return basePrisma.organization.update({ where: { id: orgId }, data: { status } });
    });
  }
}
