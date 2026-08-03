import { Router } from 'express';
import { TaxController, EarningController, PayoutController, CommissionController } from '../controllers/finance.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

// Tax routes
router.post('/taxes', authorize('ADMIN'), TaxController.create);
router.get('/taxes', TaxController.findAll);
router.get('/taxes/default', TaxController.getDefault);
router.get('/taxes/:id', TaxController.findById);
router.patch('/taxes/:id', authorize('ADMIN'), TaxController.update);
router.delete('/taxes/:id', authorize('ADMIN'), TaxController.delete);

// Earnings routes
router.post('/earnings', authorize('ADMIN', 'MANAGER'), EarningController.create);
router.get('/earnings', authorize('ADMIN', 'MANAGER'), EarningController.findAll);
router.get('/earnings/staff/:staffId', EarningController.getStaffEarnings);

// Payouts routes
router.post('/payouts', authorize('ADMIN', 'MANAGER'), PayoutController.create);
router.get('/payouts', authorize('ADMIN', 'MANAGER'), PayoutController.findAll);
router.get('/payouts/:id', PayoutController.findById);
router.patch('/payouts/:id/pay', authorize('ADMIN'), PayoutController.markAsPaid);
router.patch('/payouts/:id/cancel', authorize('ADMIN'), PayoutController.cancel);

// Commissions (target-aware)
router.get('/commissions/summary', authorize('ADMIN', 'MANAGER'), CommissionController.summary);
router.get('/commissions/staff/:staffId', CommissionController.staffSummary);

export default router;
