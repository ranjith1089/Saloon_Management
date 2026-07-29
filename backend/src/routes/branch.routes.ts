import { Router } from 'express';
import { BranchController } from '../controllers/branch.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { createBranchSchema, updateBranchSchema } from '../validators/branch.validator';

const router = Router();

router.use(authenticate);

router.post('/', authorize('ADMIN'), validate(createBranchSchema), BranchController.create);
router.get('/', BranchController.findAll);
router.get('/:id', BranchController.findById);
router.get('/:id/stats', authorize('ADMIN', 'MANAGER'), BranchController.getStats);
router.patch('/:id', authorize('ADMIN'), validate(updateBranchSchema), BranchController.update);
router.delete('/:id', authorize('ADMIN'), BranchController.delete);

export default router;
