/**
 * Prisma client with tenant-aware query extension — Ship 1B of SaaS conversion.
 *
 * Whenever an HTTP request is running inside a tenant frame (Ship 1A's
 * AsyncLocalStorage set by `authenticate` middleware), read-many and create
 * operations against tenant-scoped models get their `where.organizationId`
 * / `data.organizationId` auto-filled with the caller's tenant.
 *
 * SAFETY POSTURE
 *   - If there is no tenant context (bootstrap, cron, /auth/*, /public/*),
 *     the extension PASSES THROUGH unchanged. Existing flows keep working.
 *   - If `ctx.isSystem === true` (superadmin, background jobs), extension
 *     PASSES THROUGH — cross-tenant access on purpose.
 *   - Only these ops are auto-scoped: findFirst / findFirstOrThrow /
 *     findMany / count / aggregate / groupBy / updateMany / deleteMany /
 *     create / createMany. Operations that require a @unique field
 *     (findUnique, update-by-id, delete-by-id, upsert) are NOT auto-scoped
 *     because injecting a non-unique field breaks Prisma's contract.
 *     Services doing findUnique should call `assertCurrentOrg(entity)`
 *     from utils/tenantScope after the read — see that file.
 *   - Global models (Country, City, Organization itself, RefreshToken,
 *     UserProfile, Permission, RolePermission) are always passed through.
 *
 * ROLLOUT
 *   Every existing row is in the Default Organization (Ship 1A migration).
 *   All current users' JWTs point at the Default Organization. Enabling
 *   this extension therefore does not change what any existing user can
 *   see — they still get their own single-tenant view of Default Org.
 *   New signups get their own org and the extension keeps their data
 *   isolated from day one.
 */
import { PrismaClient } from '@prisma/client';
import { getTenantContext } from './tenantContext';

/** Every model that carries an organizationId (see schema Ship 1A). */
const TENANT_MODELS = new Set([
  'User', 'Branch', 'ServiceCategory', 'Service', 'Staff', 'Customer',
  'Booking', 'Notification', 'NotificationTemplate', 'Tax', 'StaffEarning',
  'Payout', 'Coupon', 'Review', 'Setting', 'Holiday', 'PaymentMethod',
  'ProductCategory', 'Product', 'ProductSale', 'MembershipPlan',
  'Referral', 'Inquiry', 'Membership',
]);

/** Auto-add `where.organizationId` for these. Deterministic + safe. */
const SCOPE_WHERE_OPS = new Set([
  'findFirst', 'findFirstOrThrow', 'findMany',
  'count', 'aggregate', 'groupBy',
  'updateMany', 'deleteMany',
]);

/** Auto-add `data.organizationId` for these. */
const SCOPE_DATA_OPS = new Set(['create', 'createMany']);

const base = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

const prisma = base.$extends({
  name: 'tenant-scope',
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const ctx = getTenantContext();

        // No context, system mode, or non-tenant model → pass through.
        if (!ctx || ctx.isSystem || !TENANT_MODELS.has(model)) {
          return query(args);
        }
        const orgId = ctx.organizationId;
        // A logged-in user with no orgId in their token is legacy / invalid.
        // Fail closed: refuse to touch tenant data rather than leak everything.
        if (!orgId) {
          throw new Error(
            `Tenant scope required for ${model}.${operation} but caller has no organizationId. ` +
            `Log out and log in again to refresh the token.`
          );
        }

        // ---- READ / MASS-MUTATE: safe to add organizationId to where ----
        if (SCOPE_WHERE_OPS.has(operation)) {
          const nextArgs: any = { ...(args as any) };
          nextArgs.where = { ...(nextArgs.where || {}), organizationId: orgId };
          return query(nextArgs);
        }

        // ---- CREATE: inject organizationId into data ----
        if (operation === 'create') {
          const nextArgs: any = { ...(args as any) };
          nextArgs.data = { ...(nextArgs.data || {}), organizationId: orgId };
          return query(nextArgs);
        }
        if (operation === 'createMany') {
          const nextArgs: any = { ...(args as any) };
          const data = Array.isArray(nextArgs.data) ? nextArgs.data : [nextArgs.data];
          nextArgs.data = data.map((d: any) => ({ ...d, organizationId: orgId }));
          return query(nextArgs);
        }

        // ---- findUnique / update / delete / upsert by @unique key ----
        // We can't add organizationId to the unique-key where clause. Passing
        // through is safe *provided* the caller either (a) uses assertCurrentOrg()
        // after the read, or (b) only accepts ids it obtained via a scoped read
        // in the same request. All ids the client sends already come from
        // scoped list endpoints, so this is the normal case.
        return query(args);
      },
    },
  },
});

export default prisma;
export { base as basePrisma };
