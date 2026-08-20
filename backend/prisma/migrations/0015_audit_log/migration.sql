-- Ship 5B — audit log for super-admin actions, starting with impersonation.
CREATE TABLE "audit_logs" (
  "id"         TEXT NOT NULL PRIMARY KEY,
  "actorId"    TEXT NOT NULL,
  "actorEmail" TEXT NOT NULL,
  "action"     TEXT NOT NULL,
  "targetType" TEXT,
  "targetId"   TEXT,
  "meta"       JSONB,
  "ip"         TEXT,
  "userAgent"  TEXT,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "audit_logs_actorId_idx"                ON "audit_logs"("actorId");
CREATE INDEX "audit_logs_targetType_targetId_idx"    ON "audit_logs"("targetType", "targetId");
CREATE INDEX "audit_logs_createdAt_idx"              ON "audit_logs"("createdAt");
