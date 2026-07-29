import { Router } from 'express';
import { NotificationController, NotificationTemplateController } from '../controllers/notification.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

// User notifications
router.get('/', NotificationController.findMine);
router.patch('/read-all', NotificationController.markAllAsRead);
router.patch('/:id/read', NotificationController.markAsRead);
router.delete('/:id', NotificationController.delete);

// Templates (admin only)
router.post('/templates', authorize('ADMIN'), NotificationTemplateController.create);
router.get('/templates/all', authorize('ADMIN', 'MANAGER'), NotificationTemplateController.findAll);
router.get('/templates/:id', authorize('ADMIN', 'MANAGER'), NotificationTemplateController.findById);
router.patch('/templates/:id', authorize('ADMIN'), NotificationTemplateController.update);
router.delete('/templates/:id', authorize('ADMIN'), NotificationTemplateController.delete);

export default router;
