/**
 * Feature-flag gate — Ship 4C of SaaS conversion.
 *
 * Wraps UsageService.assertFeature() as an Express middleware so a whole
 * router (or single route) can be locked behind a plan tier in one line:
 *
 *   r.use(requireFeature('memberships'));       // whole router
 *   r.post('/', requireFeature('growthKit'), h) // just this route
 *
 * On over-limit throws PlanLimitError (HTTP 402) with the same
 * { code: 'PLAN_LIMIT', details } payload the frontend interceptor
 * already knows how to render.
 */
import { Request, Response, NextFunction } from 'express';
import { UsageService } from '../services/usage.service';
import { PLAN_LIMITS } from '../config/plans';

type Feature = keyof typeof PLAN_LIMITS['TRIAL'];

export const requireFeature = (feature: Feature) => {
  return async (_req: Request, _res: Response, next: NextFunction) => {
    try {
      await UsageService.assertFeature(feature);
      next();
    } catch (err) {
      next(err);
    }
  };
};
