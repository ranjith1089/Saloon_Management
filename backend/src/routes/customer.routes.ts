import { Router } from 'express';
import { CustomerController } from '../controllers/customer.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.post('/', authorize('ADMIN', 'MANAGER', 'STAFF'), CustomerController.create);
router.get('/', authorize('ADMIN', 'MANAGER', 'STAFF'), CustomerController.findAll);
router.get('/:id', CustomerController.findById);
router.get('/:id/history', CustomerController.getHistory);
router.patch('/:id', authorize('ADMIN', 'MANAGER'), CustomerController.update);
router.delete('/:id', authorize('ADMIN'), CustomerController.delete);

export default router;
