-- Ship 4B of SaaS conversion — WhatsApp message quota metering.
-- One row per (organization, YYYY-MM). Additional resources (SMS, storage,
-- API calls) can be added as columns here later without another migration.

CREATE TABLE "usage_meters" (
  "id"              TEXT NOT NULL PRIMARY KEY,
  "organizationId"  TEXT NOT NULL,
  "month"           TEXT NOT NULL,
  "waMsgs"          INTEGER NOT NULL DEFAULT 0,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL,
  CONSTRAINT "usage_meters_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "usage_meters_organizationId_month_key" ON "usage_meters"("organizationId", "month");
CREATE INDEX "usage_meters_organizationId_idx" ON "usage_meters"("organizationId");
