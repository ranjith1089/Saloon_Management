import { Router } from 'express';
import {
  MembershipPlanController,
  MembershipController,
} from '../controllers/membership.controller';
import { authenticate, authorize } from '../middlewares/auth';
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
  r.post('/', authorize('ADMIN', 'MANAGER'), validate(createPlanSchema), MembershipPlanController.create);
  r.get('/', MembershipPlanController.findAll);
  r.get('/:id', MembershipPlanController.findById);
  r.patch('/:id', authorize('ADMIN', 'MANAGER'), validate(updatePlanSchema), MembershipPlanController.update);
  r.delete('/:id', authorize('ADMIN'), MembershipPlanController.delete);
  return r;
})();

// Router B — mounted at /api/v1/memberships
export const membershipsRouter = (() => {
  const r = Router();
  r.use(authenticate);
  // Active lookup (used by booking + POS to preview prices) — all roles.
  r.get('/active/:customerId', MembershipController.active);
  r.post('/', authorize('ADMIN', 'MANAGER'), validate(createMembershipSchema), MembershipController.create);
  r.get('/', authorize('ADMIN', 'MANAGER'), MembershipController.findAll);
  r.get('/:id', authorize('ADMIN', 'MANAGER'), MembershipController.findById);
  r.patch('/:id', authorize('ADMIN', 'MANAGER'), validate(updateMembershipSchema), MembershipController.update);
  r.post('/:id/cancel', authorize('ADMIN', 'MANAGER'), MembershipController.cancel);
  return r;
})();
