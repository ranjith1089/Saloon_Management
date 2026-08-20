import { Router } from 'express';
import {
  MembershipPlanController,
  MembershipController,
} from '../controllers/membership.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { requireFeature } from '../middlewares/feature.middleware';
import { validate } from '../middlewares/validate';
import {
  createPlanSchema,
  updatePlanSchema,
  createMembershipSchema,
  updateMembershipSchema,
} from '../validators/membership.validator';

// Router A — mounted at /api/v1/membership-plans
export const plansRouter = (() => {
  const r = Router();
  r.use(authenticate);
  // Writes gated behind the memberships feature flag; reads pass so a
  // downgraded org can still see (and archive) what they already sold.
  r.post('/', authorize('ADMIN', 'MANAGER'), requireFeature('memberships'), validate(createPlanSchema), MembershipPlanController.create);
  r.get('/', MembershipPlanController.findAll);
  r.get('/:id', MembershipPlanController.findById);
  r.patch('/:id', authorize('ADMIN', 'MANAGER'), requireFeature('memberships'), validate(updatePlanSchema), MembershipPlanController.update);
  r.delete('/:id', authorize('ADMIN'), MembershipPlanController.delete);
  return r;
})();

// Router B — mounted at /api/v1/memberships
export const membershipsRouter = (() => {
  const r = Router();
  r.use(authenticate);
  // Active lookup (used by booking + POS to preview prices) — all roles.
  r.get('/active/:customerId', MembershipController.active);
  r.post('/', authorize('ADMIN', 'MANAGER'), requireFeature('memberships'), validate(createMembershipSchema), MembershipController.create);
  // List + detail are scoped in the controller — CUSTOMER sees only their own.
  r.get('/', MembershipController.findAll);
  r.get('/:id', MembershipController.findById);
  r.patch('/:id', authorize('ADMIN', 'MANAGER'), requireFeature('memberships'), validate(updateMembershipSchema), MembershipController.update);
  r.post('/:id/cancel', authorize('ADMIN', 'MANAGER'), MembershipController.cancel);
  return r;
})();
