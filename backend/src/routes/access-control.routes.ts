import { Router } from 'express';
import { AccessControlController } from '../controllers/access-control.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();
router.use(authenticate);

// Any authenticated user can fetch their own effective permissions.
router.get('/me', AccessControlController.me);

// Only ADMIN can view or edit the matrix.
router.get('/matrix', authorize('ADMIN'), AccessControlController.matrix);
router.put('/matrix', authorize('ADMIN'), AccessControlController.setMatrix);

export default router;
