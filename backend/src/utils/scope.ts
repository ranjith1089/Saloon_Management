import prisma from '../config/database';
import { ForbiddenError } from './ApiError';
import { JwtPayload } from './jwt';

/**
 * Resolves the Staff.id for a user (if any). Cached on the request object so
 * repeated calls within one request don't hit the DB.
 */
export async function getStaffIdForUser(req: any): Promise<string | null> {
  if (!req.user?.userId) return null;
  if (req._resolvedStaffId !== undefined) return req._resolvedStaffId;
  const staff = await prisma.staff.findUnique({
    where: { userId: req.user.userId },
    select: { id: true },
  });
  req._resolvedStaffId = staff?.id || null;
  return req._resolvedStaffId;
}

type Role = 'ADMIN' | 'MANAGER' | 'STAFF' | 'CUSTOMER';

function role(req: any): Role | null {
  return (req.user?.role as Role) || null;
}

/**
 * Compute the auto-injected filters for a list endpoint based on the caller's
 * role. Throws ForbiddenError if the caller has no business calling the list at
 * all (e.g. CUSTOMER hitting /customers).
 *
 * Returns an object safe to spread into a Prisma `where` clause.
 */
export async function bookingListScope(req: any): Promise<Record<string, any>> {
  const r = role(req);
  if (r === 'ADMIN' || r === 'MANAGER') return {};
  if (r === 'CUSTOMER') return { customerId: req.user.userId };
  if (r === 'STAFF') {
    const staffId = await getStaffIdForUser(req);
    if (!staffId) throw new ForbiddenError('No staff profile linked to this account');
    return { staffId };
  }
  throw new ForbiddenError('Not allowed');
}

export async function earningListScope(req: any): Promise<Record<string, any>> {
  const r = role(req);
  if (r === 'ADMIN' || r === 'MANAGER') return {};
  if (r === 'STAFF') {
    const staffId = await getStaffIdForUser(req);
    if (!staffId) throw new ForbiddenError('No staff profile linked to this account');
    return { staffId };
  }
  throw new ForbiddenError('Not allowed');
}

export async function payoutListScope(req: any): Promise<Record<string, any>> {
  return earningListScope(req);
}

export async function membershipListScope(req: any): Promise<Record<string, any>> {
  const r = role(req);
  if (r === 'ADMIN' || r === 'MANAGER') return {};
  if (r === 'CUSTOMER') return { customerId: req.user.userId };
  throw new ForbiddenError('Not allowed');
}

export function requireAdminManager(req: any) {
  const r = role(req);
  if (r !== 'ADMIN' && r !== 'MANAGER') throw new ForbiddenError('Not allowed');
}

export function requireNotCustomer(req: any) {
  const r = role(req);
  if (!r || r === 'CUSTOMER') throw new ForbiddenError('Not allowed');
}

export function isCustomer(req: any) {
  return role(req) === 'CUSTOMER';
}
export function isStaff(req: any) {
  return role(req) === 'STAFF';
}
export function isAdminOrManager(req: any) {
  const r = role(req);
  return r === 'ADMIN' || r === 'MANAGER';
}

/**
 * Assert that a specific record's owner matches the caller's role expectations.
 * For CUSTOMER: they can only touch bookings where they are the customer.
 * For STAFF: they can only touch bookings assigned to them.
 * ADMIN/MANAGER: pass.
 */
export async function assertBookingAccess(req: any, booking: { customerId: string; staffId: string }) {
  const r = role(req);
  if (r === 'ADMIN' || r === 'MANAGER') return;
  if (r === 'CUSTOMER') {
    if (booking.customerId !== req.user.userId) throw new ForbiddenError('Not your booking');
    return;
  }
  if (r === 'STAFF') {
    const staffId = await getStaffIdForUser(req);
    if (booking.staffId !== staffId) throw new ForbiddenError('Not your booking');
    return;
  }
  throw new ForbiddenError('Not allowed');
}
