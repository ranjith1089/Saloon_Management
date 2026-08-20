import { Router } from 'express';
import { MarketingController } from '../controllers/marketing.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { requireFeature } from '../middlewares/feature.middleware';

const router = Router();
router.use(authenticate);
router.use(authorize('ADMIN', 'MANAGER'));
router.use(requireFeature('growthKit'));   // whole Growth toolkit is a paid feature

router.get('/rebook-due', MarketingController.rebookDue);
router.get('/win-back', MarketingController.winBack);
router.get('/birthdays', MarketingController.birthdays);

export default router;
