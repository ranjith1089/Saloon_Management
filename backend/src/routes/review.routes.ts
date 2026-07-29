import { Router } from 'express';
import { ReviewController } from '../controllers/review.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.post('/', ReviewController.create);
router.get('/', ReviewController.findAll);
router.get('/staff/:staffId/rating', ReviewController.getStaffRating);
router.get('/:id', ReviewController.findById);
router.patch('/:id', authorize('ADMIN', 'MANAGER'), ReviewController.update);
router.delete('/:id', authorize('ADMIN'), ReviewController.delete);

export default router;
