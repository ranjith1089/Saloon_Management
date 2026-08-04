import prisma from '../config/database';
import { WhatsAppService } from './whatsapp.service';
import { NotificationService } from './notification.service';
import logger from '../utils/logger';

/**
 * Substitute {{key}} placeholders in a template body.
 * Missing values render as empty string (never leak "{{name}}" literals).
 */
function interpolate(tpl: string, vars: Record<string, string | number | undefined | null>) {
  return tpl.replace(/{{\s*(\w+)\s*}}/g, (_, k) => {
    const v = vars[k];
    return v === undefined || v === null ? '' : String(v);
  });
}

interface SendPayload {
  templateName: string;                 // NotificationTemplate.name
  userId?: string | null;               // Registered customer — receives in-app notification
  phone?: string | null;                // Falls back if userId has no profile phone
  vars: Record<string, any>;            // Placeholder values
  waTemplateName?: string;              // Overrides Meta-side template name if different
  waLanguage?: string;                  // e.g. 'en_US', 'en'
}

/**
 * Single entry point every "send a message about X" flow should use.
 *
 *  1. Loads the DB template (skips if template missing or inactive).
 *  2. Interpolates the body with `vars`.
 *  3. Creates an IN_APP Notification row for the recipient (if userId).
 *  4. If WhatsApp is configured AND a phone is available, best-effort sends
 *     via WhatsApp Cloud API. A WA-side template name may differ from our
 *     local one (Meta approval names have their own rules) so we accept an
 *     override.
 *
 * Never throws — the caller doesn't need to try/catch. Returns a small
 * report the caller may inspect if it cares.
 */
export class MessagingService {
  static async sendFromTemplate(payload: SendPayload) {
    const report = {
      templateFound: false,
      inAppCreated: false,
      whatsappAttempted: false,
      whatsappOk: false,
      whatsappError: undefined as string | undefined,
    };

    try {
      const template = await prisma.notificationTemplate.findUnique({
        where: { name: payload.templateName },
      });
      if (!template || !template.isActive) return report;
      report.templateFound = true;

      const subject = interpolate(template.subject || '', payload.vars);
      const body = interpolate(template.body, payload.vars);

      // 1. Always create the in-app record when we have a user.
      if (payload.userId) {
        try {
          await NotificationService.create({
            userId: payload.userId,
            title: subject || template.name,
            message: body,
            type: template.type,
            channel: template.channel,
          });
          report.inAppCreated = true;
        } catch (err) {
          logger.error('In-app notification create failed', { err });
        }
      }

      // 2. Try WhatsApp if a phone is resolvable and channel makes sense.
      const wantsWhatsApp = template.channel === 'IN_APP' || template.channel === 'PUSH'
        // WA supplements IN_APP/PUSH by default — you rarely want to opt OUT
        ? true
        : template.channel === 'EMAIL' || template.channel === 'SMS'
          ? false
          : true;

      if (!wantsWhatsApp || !WhatsAppService.isConfigured()) return report;

      // Resolve the phone number: explicit param wins, else user profile.
      let phone = payload.phone || null;
      if (!phone && payload.userId) {
        const u = await prisma.user.findUnique({
          where: { id: payload.userId },
          include: { profile: true },
        });
        phone = u?.profile?.phone || null;
      }
      if (!phone) return report;

      report.whatsappAttempted = true;
      const waName = payload.waTemplateName || template.name;
      const lang = payload.waLanguage || 'en_US';

      // Ordered variable list: WA template positional params ({{1}}, {{2}}…)
      // are populated in the same order as `template.variables`.
      const orderedVars = (template.variables as string[] || []).map((k) => {
        const v = payload.vars[k];
        return v === undefined || v === null ? '' : String(v);
      });

      const result = await WhatsAppService.sendTemplate(phone, waName, lang, orderedVars);
      report.whatsappOk = result.ok;
      report.whatsappError = result.error;
      if (!result.ok && !result.skipped) {
        // Fallback to plain text within an active session — cheap belt-and-braces.
        const fallback = await WhatsAppService.sendText(phone, body);
        if (fallback.ok) {
          report.whatsappOk = true;
          report.whatsappError = undefined;
        }
      }
    } catch (err: any) {
      logger.error('MessagingService.sendFromTemplate threw', { err: err?.message || err });
    }
    return report;
  }

  /**
   * WhatsApp-only best-effort send. Callers that already create their own
   * in-app Notification row should use this to avoid duplicates. Silently
   * no-ops if WA isn't configured or the phone can't be resolved.
   */
  static async sendWhatsAppOnly(opts: {
    userId?: string | null;
    phone?: string | null;
    text: string;
  }) {
    try {
      if (!WhatsAppService.isConfigured()) return { skipped: true };
      let phone = opts.phone || null;
      if (!phone && opts.userId) {
        const u = await prisma.user.findUnique({
          where: { id: opts.userId },
          include: { profile: true },
        });
        phone = u?.profile?.phone || null;
      }
      if (!phone) return { skipped: true };
      return WhatsAppService.sendText(phone, opts.text);
    } catch (err: any) {
      logger.error('sendWhatsAppOnly threw', { err: err?.message || err });
      return { ok: false, error: err?.message || 'threw' };
    }
  }
}
