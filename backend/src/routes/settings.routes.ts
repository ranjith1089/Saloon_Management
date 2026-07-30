import { Router } from 'express';
import { SettingsController, HolidayController, PaymentMethodController } from '../controllers/settings.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

// Branding — GET public to any authenticated user (they need it to render), PUT admin-only
router.get('/branding', SettingsController.getBranding);
router.put('/branding', authorize('ADMIN'), SettingsController.updateBranding);

// Currency — same pattern
router.get('/currency', SettingsController.getCurrency);
router.put('/currency', authorize('ADMIN'), SettingsController.updateCurrency);

// Business
router.get('/business', SettingsController.getBusiness);
router.put('/business', authorize('ADMIN'), SettingsController.updateBusiness);

// Holidays
router.get('/holidays', HolidayController.findAll);
router.post('/holidays', authorize('ADMIN', 'MANAGER'), HolidayController.create);
router.post('/holidays/bulk', authorize('ADMIN'), HolidayController.bulkCreate);
router.get('/holidays/:id', HolidayController.findById);
router.patch('/holidays/:id', authorize('ADMIN', 'MANAGER'), HolidayController.update);
router.delete('/holidays/:id', authorize('ADMIN'), HolidayController.delete);

// Payment methods — enabled ones visible to all authenticated (needed at checkout)
router.get('/payment-methods', PaymentMethodController.findAll);
router.post('/payment-methods', authorize('ADMIN'), PaymentMethodController.create);
router.patch('/payment-methods/reorder', authorize('ADMIN'), PaymentMethodController.reorder);
router.get('/payment-methods/:id', authorize('ADMIN'), PaymentMethodController.findById);
router.patch('/payment-methods/:id', authorize('ADMIN'), PaymentMethodController.update);
router.delete('/payment-methods/:id', authorize('ADMIN'), PaymentMethodController.delete);

export default router;
