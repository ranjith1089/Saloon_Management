import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JwtPayload } from '../utils/jwt';
import { UnauthorizedError, ForbiddenError } from '../utils/ApiError';
import { runInTenant } from '../config/tenantContext';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    // Ship 1A: run the rest of the request inside a tenant frame so
    // downstream code (services, Prisma extension in Ship 1B) can read
    // the caller's organizationId via getCurrentOrgId().
    runInTenant(
      {
        organizationId: decoded.organizationId ?? null,
        userId:         decoded.userId,
        role:           decoded.role,
      },
      () => next(),
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Role gate. Passes if the caller's role is in the allow-list.
 *
 * Role hierarchy (Ship 2): OWNER ⊃ ADMIN. Whenever a route accepts ADMIN,
 * OWNER is implicitly allowed too — the org creator can never lose access
 * to their own tenant. We avoid editing 89 routes by expanding the list
 * here instead.
 */
export const authorize = (...roles: string[]) => {
  const expanded = roles.includes('ADMIN') && !roles.includes('OWNER')
    ? [...roles, 'OWNER']
    : roles;
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('User not authenticated'));
    }
    if (!expanded.includes(req.user.role)) {
      return next(new ForbiddenError('You do not have permission to access this resource'));
    }
    next();
  };
};

/**
 * Fine-grained permission gate. Reads the role→permission matrix (cached ~60s)
 * and allows the request only if the user's role has the given permission key.
 * Use for actions where roles alone are too coarse.
 *
 *   router.delete('/:id', authenticate, requirePermission('bookings.delete'), handler)
 */
export const requirePermission = (key: string) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new UnauthorizedError('User not authenticated');
      // Lazy import to avoid circular dependency (service imports prisma).
      const { AccessControlService } = await import('../services/access-control.service');
      const ok = await AccessControlService.hasPermission(req.user.role as any, key);
      if (!ok) throw new ForbiddenError(`Missing permission: ${key}`);
      next();
    } catch (err) {
      next(err);
    }
  };
};
