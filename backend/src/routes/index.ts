import { Router } from 'express';
import authRoutes from './auth.routes';
import branchRoutes from './branch.routes';
import serviceRoutes from './service.routes';
import staffRoutes from './staff.routes';
import customerRoutes from './customer.routes';
import bookingRoutes from './booking.routes';
import dashboardRoutes from './dashboard.routes';
import locationRoutes from './location.routes';
import financeRoutes from './finance.routes';
import couponRoutes from './coupon.routes';
import reviewRoutes from './review.routes';
import reportRoutes from './report.routes';
import notificationRoutes from './notification.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/branches', branchRoutes);
router.use('/services', serviceRoutes);
router.use('/staff', staffRoutes);
router.use('/customers', customerRoutes);
router.use('/bookings', bookingRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/locations', locationRoutes);
router.use('/finance', financeRoutes);
router.use('/coupons', couponRoutes);
router.use('/reviews', reviewRoutes);
router.use('/reports', reportRoutes);
router.use('/notifications', notificationRoutes);

export default router;
