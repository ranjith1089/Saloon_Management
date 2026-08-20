import { Router } from 'express';
import { ReferralController } from '../controllers/referral.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { requireFeature } from '../middlewares/feature.middleware';

const router = Router();
router.use(authenticate);

// GET /referrals/me — a customer's own referral code. Available on every
// plan (customers of a downgraded org still deserve their existing code).
router.get('/me', ReferralController.me);

// GET /referrals — admin listing of every referral in the org. Paid
// Growth feature.
router.get('/', authorize('ADMIN', 'MANAGER'), requireFeature('referrals'), ReferralController.list);

export default router;
