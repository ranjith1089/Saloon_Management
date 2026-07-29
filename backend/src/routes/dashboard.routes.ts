import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/stats', DashboardController.getStats);
router.get('/revenue-chart', DashboardController.getRevenueChart);

export default router;
