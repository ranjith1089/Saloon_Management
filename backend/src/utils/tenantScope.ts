/**
 * Helper for the ops the Prisma extension can't auto-scope (findUnique /
 * update / delete / upsert by @unique key). Call this right after a
 * findUnique to verify the row belongs to the caller's tenant.
 *
 *   const booking = await prisma.booking.findUnique({ where: { id } });
 *   if (!booking) throw new NotFoundError('Booking not found');
 *   assertCurrentOrg(booking);           // throws ForbiddenError on cross-tenant
 *
 * Safe to call in system mode / when no tenant frame is active — it just
 * no-ops so background jobs and bootstrap don't fail.
 */
import { getTenantContext } from '../config/tenantContext';
import { ForbiddenError } from './ApiError';

export function assertCurrentOrg<T extends { organizationId?: string | null }>(entity: T): T {
  const ctx = getTenantContext();
  if (!ctx || ctx.isSystem) return entity;
  const callerOrg = ctx.organizationId;
  if (!callerOrg) return entity;             // no scope set → nothing to enforce
  // Legacy rows may still be nullable during Ship 1B rollout; treat null as
  // Default Organization (matches the backfill).
  const rowOrg = entity.organizationId ?? '00000000-0000-0000-0000-000000000001';
  if (rowOrg !== callerOrg) {
    throw new ForbiddenError('Cross-tenant access blocked');
  }
  return entity;
}
