import { Router } from 'express';
import {
  ProductCategoryController,
  ProductController,
  ProductSaleController,
} from '../controllers/product.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import {
  createCategorySchema,
  updateCategorySchema,
  createProductSchema,
  updateProductSchema,
  createProductSaleSchema,
  voidSaleSchema,
} from '../validators/product.validator';

const router = Router();
router.use(authenticate);

// ---- Categories (nested under /products/categories) ----
router.post('/categories', authorize('ADMIN', 'MANAGER'), validate(createCategorySchema), ProductCategoryController.create);
router.get('/categories', ProductCategoryController.findAll);
router.get('/categories/:id', ProductCategoryController.findById);
router.patch('/categories/:id', authorize('ADMIN', 'MANAGER'), validate(updateCategorySchema), ProductCategoryController.update);
router.delete('/categories/:id', authorize('ADMIN'), ProductCategoryController.delete);

// ---- Alerts (must come before /:id) ----
router.get('/alerts/low-stock', authorize('ADMIN', 'MANAGER'), ProductController.lowStock);
router.get('/alerts/expiring', authorize('ADMIN', 'MANAGER'), ProductController.expiring);

// ---- Products ----
router.post('/', authorize('ADMIN', 'MANAGER'), validate(createProductSchema), ProductController.create);
router.get('/', ProductController.findAll);
router.get('/:id', ProductController.findById);
router.patch('/:id', authorize('ADMIN', 'MANAGER'), validate(updateProductSchema), ProductController.update);
router.delete('/:id', authorize('ADMIN'), ProductController.delete);

export default router;

// ---- Separate router for product sales (mounted at /product-sales) ----
export const productSalesRouter = (() => {
  const r = Router();
  r.use(authenticate);
  r.post('/', authorize('ADMIN', 'MANAGER', 'STAFF'), validate(createProductSaleSchema), ProductSaleController.create);
  r.get('/', authorize('ADMIN', 'MANAGER', 'STAFF'), ProductSaleController.findAll);
  r.get('/:id', authorize('ADMIN', 'MANAGER', 'STAFF'), ProductSaleController.findById);
  r.post('/:id/void', authorize('ADMIN', 'MANAGER'), validate(voidSaleSchema), ProductSaleController.void);
  return r;
})();
