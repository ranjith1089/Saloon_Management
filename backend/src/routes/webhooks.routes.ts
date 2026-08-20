/**
 * Webhooks — Ship 3B.
 *
 * Razorpay POSTs subscription + invoice events here. Signature is
 * verified before any DB touch; unknown events are 200-acked so the
 * dashboard doesn't retry them forever.
 *
 * NOTE: Express must NOT have parsed the body before this handler runs —
 * we need the raw string for HMAC verification. We use express.raw() on
 * this router so req.body is a Buffer of the payload bytes.
 */
import { Router, raw } from 'express';
import { BillingService } from '../services/billing.service';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.post(
  '/razorpay',
  raw({ type: 'application/json', limit: '1mb' }),
  asyncHandler(async (req, res) => {
    const signature = String(req.header('x-razorpay-signature') || '');
    const rawBody   = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : String(req.body || '');
    if (!signature || !BillingService.verifyWebhookSignature(rawBody, signature)) {
      // Log but respond 401 so Razorpay marks it as failed and retries.
      // eslint-disable-next-line no-console
      console.warn('Razorpay webhook: invalid signature');
      return res.status(401).json({ received: false, reason: 'invalid_signature' });
    }
    const event = JSON.parse(rawBody);
    const result = await BillingService.handleWebhook(event);
    return res.status(200).json({ received: true, ...result });
  }),
);

export default router;
