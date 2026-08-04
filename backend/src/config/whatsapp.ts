/**
 * WhatsApp Cloud API config. Read from env vars; three of them are required
 * for outbound to work. Missing values simply disable the WhatsApp channel —
 * booking flows keep working, they just don't message the customer over WA.
 *
 * How to fill these in (Meta Business):
 *   1. https://developers.facebook.com/apps → Create App → Business
 *   2. Add product: WhatsApp
 *   3. From the WhatsApp panel copy:
 *      - Phone number ID   → WHATSAPP_PHONE_NUMBER_ID
 *      - Temporary token   → WHATSAPP_ACCESS_TOKEN     (rotate to permanent later)
 *   4. Optional but recommended:
 *      - Business Account ID → WHATSAPP_BUSINESS_ACCOUNT_ID
 *
 * The API version can be pinned via WHATSAPP_API_VERSION (defaults to v20.0).
 */
export const whatsappConfig = {
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
  businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',
  apiVersion: process.env.WHATSAPP_API_VERSION || 'v20.0',
};

export const isWhatsAppConfigured = !!(whatsappConfig.phoneNumberId && whatsappConfig.accessToken);
