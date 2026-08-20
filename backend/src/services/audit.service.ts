/**
 * Minimal audit logger — Ship 5B.
 * Records super-admin actions (impersonate, plan change, extend trial,
 * suspend) so they're accountable after the fact. Always best-effort:
 * a logging failure never blocks the business action.
 */
import { basePrisma } from '../config/database';
import { runAsSystem } from '../config/tenantContext';

interface WriteArgs {
  actorId:    string;
  actorEmail: string;
  action:     string;
  targetType?: string;
  targetId?:   string;
  meta?:       any;
  ip?:         string;
  userAgent?:  string;
}

export class AuditService {
  static async write(args: WriteArgs) {
    try {
      await runAsSystem(() =>
        basePrisma.auditLog.create({ data: {
          actorId:    args.actorId,
          actorEmail: args.actorEmail,
          action:     args.action,
          targetType: args.targetType,
          targetId:   args.targetId,
          meta:       args.meta ?? undefined,
          ip:         args.ip,
          userAgent:  args.userAgent,
        }}),
      );
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('AuditService.write failed', err);
    }
  }
}
