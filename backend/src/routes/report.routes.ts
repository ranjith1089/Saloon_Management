import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN', 'MANAGER'));

router.get('/daily-bookings', ReportController.dailyBookings);
router.get('/overall-bookings', ReportController.overallBookings);
router.get('/staff-payouts', ReportController.staffPayoutReport);
router.get('/staff-services', ReportController.staffServiceReport);
router.get('/product-sales', ReportController.productSalesReport);

export default router;
