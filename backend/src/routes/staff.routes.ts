import { Router } from 'express';
import { StaffController } from '../controllers/staff.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.post('/', authorize('ADMIN', 'MANAGER'), StaffController.create);
router.get('/', StaffController.findAll);
router.get('/:id', StaffController.findById);
router.patch('/:id', authorize('ADMIN', 'MANAGER'), StaffController.update);
router.delete('/:id', authorize('ADMIN'), StaffController.delete);
router.patch('/:id/verify', authorize('ADMIN', 'MANAGER'), StaffController.verify);
router.put('/:id/schedule', authorize('ADMIN', 'MANAGER'), StaffController.setSchedule);

export default router;
