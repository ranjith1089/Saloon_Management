import { Router } from 'express';
import { BookingController } from '../controllers/booking.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { collectPaymentSchema } from '../validators/booking.validator';

const router = Router();

router.use(authenticate);

router.post('/', BookingController.create);
router.get('/', BookingController.findAll);
router.get('/calendar', BookingController.getCalendar);
router.get('/available-slots', BookingController.getAvailableSlots);
router.get('/:id', BookingController.findById);
router.patch('/:id', authorize('ADMIN', 'MANAGER', 'STAFF'), BookingController.update);
router.patch('/:id/status', authorize('ADMIN', 'MANAGER', 'STAFF'), BookingController.updateStatus);
router.post(
  '/:id/collect-payment',
  authorize('ADMIN', 'MANAGER', 'STAFF'),
  validate(collectPaymentSchema),
  BookingController.collectPayment
);
router.delete('/:id', authorize('ADMIN', 'MANAGER'), BookingController.delete);

export default router;
