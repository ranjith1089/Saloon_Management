import { Router } from 'express';
import { ServiceController, ServiceCategoryController } from '../controllers/service.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { createCategorySchema, createServiceSchema, updateServiceSchema } from '../validators/service.validator';

const router = Router();

router.use(authenticate);

// Category routes
router.post('/categories', authorize('ADMIN'), validate(createCategorySchema), ServiceCategoryController.create);
router.get('/categories', ServiceCategoryController.findAll);
router.get('/categories/:id', ServiceCategoryController.findById);
router.patch('/categories/:id', authorize('ADMIN'), ServiceCategoryController.update);
router.delete('/categories/:id', authorize('ADMIN'), ServiceCategoryController.delete);

// Service routes
router.post('/', authorize('ADMIN', 'MANAGER'), validate(createServiceSchema), ServiceController.create);
router.get('/', ServiceController.findAll);
router.get('/:id', ServiceController.findById);
router.patch('/:id', authorize('ADMIN', 'MANAGER'), validate(updateServiceSchema), ServiceController.update);
router.delete('/:id', authorize('ADMIN'), ServiceController.delete);

export default router;
