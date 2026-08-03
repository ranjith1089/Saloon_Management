import { Router } from 'express';
import { MarketingController } from '../controllers/marketing.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();
router.use(authenticate);
router.use(authorize('ADMIN', 'MANAGER'));

router.get('/rebook-due', MarketingController.rebookDue);
router.get('/win-back', MarketingController.winBack);
router.get('/birthdays', MarketingController.birthdays);

export default router;
