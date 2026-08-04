import { Router } from 'express';
import { z } from 'zod';
import { WhatsAppService } from '../services/whatsapp.service';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { isWhatsAppConfigured, whatsappConfig } from '../config/whatsapp';

const router = Router();
router.use(authenticate);

// GET /messaging/status — no secrets, just the ready/not-ready signal
router.get('/status', authorize('ADMIN', 'MANAGER'), asyncHandler(async (_req, res) => {
  return ApiResponse.success(res, 'Messaging status', {
    whatsapp: {
      configured: isWhatsAppConfigured,
      phoneNumberId: whatsappConfig.phoneNumberId
        ? whatsappConfig.phoneNumberId.slice(0, 4) + '…' + whatsappConfig.phoneNumberId.slice(-4)
        : null,
      apiVersion: whatsappConfig.apiVersion,
    },
  });
}));

// POST /messaging/test — send a plain-text WA message to a phone number
const testSchema = z.object({
  body: z.object({
    to: z.string().min(6),
    text: z.string().min(1).max(1000),
  }),
});
router.post('/test', authorize('ADMIN'), validate(testSchema), asyncHandler(async (req, res) => {
  if (!isWhatsAppConfigured) {
    return res.status(501).json({
      success: false,
      message: 'WhatsApp is not configured. Set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN in Railway env vars.',
    });
  }
  const { to, text } = req.body;
  const result = await WhatsAppService.sendText(to, text);
  if (!result.ok) {
    return res.status(400).json({
      success: false,
      message: result.error || 'Send failed',
      hint: 'Check that the recipient number is opted in / is a verified test number on your WhatsApp app during the free tier.',
    });
  }
  return ApiResponse.success(res, 'Sent', { messageId: result.messageId });
}));

export default router;
