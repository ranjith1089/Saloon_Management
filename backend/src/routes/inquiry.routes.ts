import { Router } from 'express';
import { InquiryController } from '../controllers/inquiry.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { createInquirySchema, updateInquirySchema } from '../validators/inquiry.validator';

const router = Router();

// PUBLIC endpoint — anyone (embedded contact form, future landing page) can
// submit an inquiry. The global rate limiter already caps IP abuse.
router.post('/', validate(createInquirySchema), InquiryController.create);

// Admin surface — everything else requires auth.
router.use(authenticate);
router.get('/', authorize('ADMIN', 'MANAGER'), InquiryController.findAll);
router.get('/:id', authorize('ADMIN', 'MANAGER'), InquiryController.findById);
router.patch('/:id', authorize('ADMIN', 'MANAGER'), validate(updateInquirySchema), InquiryController.update);
router.delete('/:id', authorize('ADMIN'), InquiryController.delete);

export default router;
