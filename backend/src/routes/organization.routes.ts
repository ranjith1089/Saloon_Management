import { Router } from 'express';
import { z } from 'zod';
import { OrganizationService } from '../services/organization.service';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';

const router = Router();
router.use(authenticate);

// GET /organizations/me — current tenant + trial status
router.get('/me', asyncHandler(async (_req, res) => {
  const org = await OrganizationService.getCurrent();
  return ApiResponse.success(res, 'ok', org);
}));

// GET /organizations/onboarding-status — what's set up, what isn't
router.get('/onboarding-status', asyncHandler(async (_req, res) => {
  const status = await OrganizationService.onboardingStatus();
  return ApiResponse.success(res, 'ok', status);
}));

// GET /organizations/me/export — DPDPA data export (JSON bundle)
router.get(
  '/me/export',
  authorize('OWNER', 'ADMIN'),
  asyncHandler(async (_req, res) => {
    const bundle = await OrganizationService.exportAllData();
    return ApiResponse.success(res, 'ok', bundle);
  }),
);

// POST /organizations/me/request-deletion — soft-delete the tenant
router.post(
  '/me/request-deletion',
  authorize('OWNER'),
  asyncHandler(async (_req, res) => {
    const org = await OrganizationService.requestDeletion();
    return ApiResponse.success(res, 'Organization scheduled for deletion', org);
  }),
);

// PATCH /organizations/me — owner/admin can update tenant settings
const updateSchema = z.object({
  body: z.object({
    name:     z.string().min(2).max(100).optional(),
    slug:     z.string().min(2).max(40).optional(),
    country:  z.string().min(2).max(2).optional(),
    currency: z.string().min(3).max(3).optional(),
  }),
});
router.patch(
  '/me',
  authorize('OWNER', 'ADMIN'),
  validate(updateSchema),
  asyncHandler(async (req, res) => {
    const org = await OrganizationService.updateCurrent(req.body);
    return ApiResponse.success(res, 'Organization updated', org);
  }),
);

export default router;
