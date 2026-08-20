import { Router } from 'express';
import { z } from 'zod';
import { AdminService } from '../services/admin.service';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { SubscriptionPlan, OrganizationStatus } from '@prisma/client';

const router = Router();
router.use(authenticate);
router.use(authorize('SUPERADMIN'));   // no other guard needed — routes below are cross-tenant

// GET /super-admin/summary — dashboard header numbers
router.get('/summary', asyncHandler(async (_req, res) => {
  return ApiResponse.success(res, 'ok', await AdminService.summary());
}));

// GET /super-admin/organizations — list + filter + paginate
router.get('/organizations', asyncHandler(async (req, res) => {
  const { search, plan, status, limit, offset } = req.query;
  const rows = await AdminService.listOrganizations({
    search: search as string | undefined,
    plan:   plan   as SubscriptionPlan | undefined,
    status: status as OrganizationStatus | undefined,
    limit:  limit  ? Number(limit)  : undefined,
    offset: offset ? Number(offset) : undefined,
  });
  return ApiResponse.success(res, 'ok', rows);
}));

// GET /super-admin/organizations/:id
router.get('/organizations/:id', asyncHandler(async (req, res) => {
  const org = await AdminService.getOrganization(req.params.id);
  return ApiResponse.success(res, 'ok', org);
}));

// PATCH /super-admin/organizations/:id/plan
const planSchema = z.object({
  body: z.object({ plan: z.enum(['TRIAL', 'STARTER', 'GROWTH', 'PRO']) }),
});
router.patch('/organizations/:id/plan', validate(planSchema), asyncHandler(async (req, res) => {
  const org = await AdminService.changePlan(req.params.id, req.body.plan as SubscriptionPlan);
  return ApiResponse.success(res, 'Plan updated', org);
}));

// POST /super-admin/organizations/:id/extend-trial
const extendSchema = z.object({
  body: z.object({ days: z.number().int().min(1).max(365) }),
});
router.post('/organizations/:id/extend-trial', validate(extendSchema), asyncHandler(async (req, res) => {
  const org = await AdminService.extendTrial(req.params.id, req.body.days);
  return ApiResponse.success(res, 'Trial extended', org);
}));

// PATCH /super-admin/organizations/:id/status
const statusSchema = z.object({
  body: z.object({ status: z.enum(['ACTIVE', 'SUSPENDED', 'DELETED']) }),
});
router.patch('/organizations/:id/status', validate(statusSchema), asyncHandler(async (req, res) => {
  const org = await AdminService.setStatus(req.params.id, req.body.status as OrganizationStatus);
  return ApiResponse.success(res, 'Status updated', org);
}));

export default router;
