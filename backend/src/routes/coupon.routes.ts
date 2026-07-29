import { Router } from 'express';
import { CouponController } from '../controllers/coupon.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.post('/', authorize('ADMIN', 'MANAGER'), CouponController.create);
router.get('/', CouponController.findAll);
router.post('/validate', CouponController.validate);
router.get('/:id', CouponController.findById);
router.patch('/:id', authorize('ADMIN', 'MANAGER'), CouponController.update);
router.delete('/:id', authorize('ADMIN'), CouponController.delete);

export default router;
