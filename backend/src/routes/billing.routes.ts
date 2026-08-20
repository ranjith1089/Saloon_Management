import { Router } from 'express';
import { z } from 'zod';
import { BillingService } from '../services/billing.service';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { SubscriptionPlan } from '@prisma/client';

const router = Router();
router.use(authenticate);

// GET /billing/status — is Razorpay wired?
router.get('/status', asyncHandler(async (_req, res) => {
  return ApiResponse.success(res, 'ok', BillingService.getStatus());
}));

// POST /billing/subscribe — kicks off hosted checkout for a plan
const subscribeSchema = z.object({
  body: z.object({
    plan: z.enum(['STARTER', 'GROWTH', 'PRO']),
  }),
});
router.post(
  '/subscribe',
  authorize('OWNER', 'ADMIN'),
  validate(subscribeSchema),
  asyncHandler(async (req, res) => {
    const { subscription, shortUrl } = await BillingService.createSubscriptionForCurrentOrg(
      req.body.plan as SubscriptionPlan,
    );
    return ApiResponse.success(res, 'Subscription created', { subscription, shortUrl });
  }),
);

// POST /billing/cancel — cancel current subscription at period end
router.post(
  '/cancel',
  authorize('OWNER', 'ADMIN'),
  asyncHandler(async (_req, res) => {
    const sub = await BillingService.cancelCurrent();
    return ApiResponse.success(res, 'Subscription cancelled', sub);
  }),
);

// GET /billing/invoices — payment history
router.get(
  '/invoices',
  authorize('OWNER', 'ADMIN'),
  asyncHandler(async (_req, res) => {
    const invoices = await BillingService.listInvoices();
    return ApiResponse.success(res, 'ok', invoices);
  }),
);

export default router;
