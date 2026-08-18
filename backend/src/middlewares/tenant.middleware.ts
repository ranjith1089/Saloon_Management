/**
 * Tenant middleware — mounts an AsyncLocalStorage frame carrying the
 * caller's organizationId for the lifetime of the request.
 *
 * Must run AFTER `authenticate` so req.user is populated. On public /auth
 * routes it's a no-op (no user → no frame).
 */
import { Request, Response, NextFunction } from 'express';
import { runInTenant } from '../config/tenantContext';

export function tenantContext(req: Request, res: Response, next: NextFunction) {
  const user = req.user;
  if (!user) return next();
  runInTenant(
    {
      organizationId: (user as any).organizationId ?? null,
      userId:         user.userId,
      role:           user.role,
    },
    () => next(),
  );
}
