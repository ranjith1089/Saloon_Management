import { whatsappConfig, isWhatsAppConfigured } from '../config/whatsapp';
import logger from '../utils/logger';

/**
 * Normalise an Indian-first phone number to the E.164 digits string
 * WhatsApp Cloud expects (no +, no spaces, no dashes).
 * - "+91 98765 43210"  → "919876543210"
 * - "9876543210"       → "919876543210"
 * - "919876543210"     → "919876543210"
 */
export function normaliseMsisdn(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = String(raw).replace(/[^\d]/g, '');
  if (!digits) return null;
  if (digits.length === 10) return '91' + digits;
  if (digits.length >= 11 && digits.length <= 15) return digits;
  return null;
}

const baseUrl = () =>
  `https://graph.facebook.com/${whatsappConfig.apiVersion}/${whatsappConfig.phoneNumberId}/messages`;

export interface SendResult {
  ok: boolean;
  messageId?: string;
  error?: string;
  skipped?: boolean;      // true when WA isn't configured — caller can log & move on
}

async function postJson(body: any): Promise<SendResult> {
  try {
    const res = await fetch(baseUrl(), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${whatsappConfig.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = json?.error?.message || `HTTP ${res.status}`;
      logger.error(`WhatsApp send failed: ${msg}`, { body, response: json });
      return { ok: false, error: msg };
    }
    const messageId = json?.messages?.[0]?.id;
    return { ok: true, messageId };
  } catch (err: any) {
    logger.error(`WhatsApp send threw: ${err?.message || err}`);
    return { ok: false, error: err?.message || 'Network error' };
  }
}

export class WhatsAppService {
  static isConfigured() {
    return isWhatsAppConfigured;
  }

  /**
   * Free-form text — only works within a 24h reply window from the customer.
   * Use this for the "test send" flow and for replies.
   */
  static async sendText(to: string, body: string): Promise<SendResult> {
    if (!isWhatsAppConfigured) return { ok: false, skipped: true, error: 'not configured' };
    const msisdn = normaliseMsisdn(to);
    if (!msisdn) return { ok: false, error: 'invalid phone number' };
    return postJson({
      messaging_product: 'whatsapp',
      to: msisdn,
      type: 'text',
      text: { body },
    });
  }

  /**
   * Template message — for outbound to customers outside a reply window.
   * `templateName` and `languageCode` must match a template APPROVED by Meta
   * in Business Manager. `variables` is the ordered list of body-parameter
   * values (positional {{1}}, {{2}} etc.).
   */
  static async sendTemplate(
    to: string,
    templateName: string,
    languageCode: string,
    variables: string[] = []
  ): Promise<SendResult> {
    if (!isWhatsAppConfigured) return { ok: false, skipped: true, error: 'not configured' };
    const msisdn = normaliseMsisdn(to);
    if (!msisdn) return { ok: false, error: 'invalid phone number' };
    return postJson({
      messaging_product: 'whatsapp',
      to: msisdn,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
        components: variables.length
          ? [
              {
                type: 'body',
                parameters: variables.map((v) => ({ type: 'text', text: v })),
              },
            ]
          : [],
      },
    });
  }
}
