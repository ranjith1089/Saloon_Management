import { Router } from 'express';
import prisma from '../config/database';
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
import settingsRoutes from './settings.routes';

const router = Router();

router.get('/health', async (_req, res) => {
  // Liveness — always cheap.
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

router.get('/health/ready', async (_req, res) => {
  // Readiness — checks the DB is reachable. Use this for the platform healthcheck.
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'OK', db: 'up', timestamp: new Date().toISOString() });
  } catch (err: any) {
    res.status(503).json({
      status: 'DEGRADED',
      db: 'down',
      error: err?.message || 'Database unreachable',
      timestamp: new Date().toISOString(),
    });
  }
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
router.use('/settings', settingsRoutes);

export default router;
