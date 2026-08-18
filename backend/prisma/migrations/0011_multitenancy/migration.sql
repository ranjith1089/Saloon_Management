-- Ship 1A of SaaS conversion — multi-tenancy foundation.
-- Adds `organizations` root table, a nullable `organizationId` column on
-- every tenant-scoped table, backfills all existing rows into a single
-- "Default Organization", and adds supporting indexes.
--
-- SAFE-BY-DESIGN: every organizationId is nullable in this migration, so
-- code that hasn't yet been updated to filter by tenant keeps working
-- unchanged. Ship 1B will (a) enable auto-filtering via a Prisma
-- extension and (b) make these columns NOT NULL once soak-tested.

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------
CREATE TYPE "SubscriptionPlan" AS ENUM ('TRIAL', 'STARTER', 'GROWTH', 'PRO');
CREATE TYPE "OrganizationStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED');

-- Add OWNER role to the existing UserRole enum (no-op if it already exists)
DO $$ BEGIN
  ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'OWNER' BEFORE 'ADMIN';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------
-- Organizations root
-- ---------------------------------------------------------------------
CREATE TABLE "organizations" (
  "id"          TEXT NOT NULL PRIMARY KEY,
  "slug"        TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "ownerUserId" TEXT,
  "plan"        "SubscriptionPlan"   NOT NULL DEFAULT 'TRIAL',
  "status"      "OrganizationStatus" NOT NULL DEFAULT 'ACTIVE',
  "trialEndsAt" TIMESTAMP(3),
  "country"     TEXT,
  "currency"    TEXT NOT NULL DEFAULT 'INR',
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");
CREATE INDEX "organizations_slug_idx"        ON "organizations"("slug");

-- Seed a stable default organization to grandfather existing data.
-- The id is deterministic so multiple deploys converge on the same row.
INSERT INTO "organizations" ("id", "slug", "name", "plan", "status", "currency", "createdAt", "updatedAt")
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'default',
  'Default Organization',
  'PRO',
  'ACTIVE',
  'INR',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- Add nullable organizationId to every tenant table
-- ---------------------------------------------------------------------
ALTER TABLE "users"                   ADD COLUMN "organizationId" TEXT;
ALTER TABLE "branches"                ADD COLUMN "organizationId" TEXT;
ALTER TABLE "service_categories"      ADD COLUMN "organizationId" TEXT;
ALTER TABLE "services"                ADD COLUMN "organizationId" TEXT;
ALTER TABLE "staff"                   ADD COLUMN "organizationId" TEXT;
ALTER TABLE "customers"               ADD COLUMN "organizationId" TEXT;
ALTER TABLE "bookings"                ADD COLUMN "organizationId" TEXT;
ALTER TABLE "notifications"           ADD COLUMN "organizationId" TEXT;
ALTER TABLE "notification_templates"  ADD COLUMN "organizationId" TEXT;
ALTER TABLE "taxes"                   ADD COLUMN "organizationId" TEXT;
ALTER TABLE "staff_earnings"          ADD COLUMN "organizationId" TEXT;
ALTER TABLE "payouts"                 ADD COLUMN "organizationId" TEXT;
ALTER TABLE "coupons"                 ADD COLUMN "organizationId" TEXT;
ALTER TABLE "reviews"                 ADD COLUMN "organizationId" TEXT;
ALTER TABLE "settings"                ADD COLUMN "organizationId" TEXT;
ALTER TABLE "holidays"                ADD COLUMN "organizationId" TEXT;
ALTER TABLE "payment_methods"         ADD COLUMN "organizationId" TEXT;
ALTER TABLE "product_categories"      ADD COLUMN "organizationId" TEXT;
ALTER TABLE "products"                ADD COLUMN "organizationId" TEXT;
ALTER TABLE "product_sales"           ADD COLUMN "organizationId" TEXT;
ALTER TABLE "membership_plans"        ADD COLUMN "organizationId" TEXT;
ALTER TABLE "referrals"               ADD COLUMN "organizationId" TEXT;
ALTER TABLE "inquiries"               ADD COLUMN "organizationId" TEXT;
ALTER TABLE "memberships"             ADD COLUMN "organizationId" TEXT;

-- ---------------------------------------------------------------------
-- Backfill every existing row with the default organization
-- ---------------------------------------------------------------------
UPDATE "users"                  SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
UPDATE "branches"               SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
UPDATE "service_categories"     SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
UPDATE "services"               SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
UPDATE "staff"                  SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
UPDATE "customers"              SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
UPDATE "bookings"               SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
UPDATE "notifications"          SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
UPDATE "notification_templates" SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
UPDATE "taxes"                  SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
UPDATE "staff_earnings"         SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
UPDATE "payouts"                SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
UPDATE "coupons"                SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
UPDATE "reviews"                SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
UPDATE "settings"               SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
UPDATE "holidays"               SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
UPDATE "payment_methods"        SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
UPDATE "product_categories"     SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
UPDATE "products"               SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
UPDATE "product_sales"          SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
UPDATE "membership_plans"       SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
UPDATE "referrals"              SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
UPDATE "inquiries"              SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
UPDATE "memberships"            SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;

-- Point the default org at the first ADMIN user so it has an owner to display
UPDATE "organizations"
SET "ownerUserId" = (SELECT "id" FROM "users" WHERE "role" = 'ADMIN' ORDER BY "createdAt" ASC LIMIT 1)
WHERE "id" = '00000000-0000-0000-0000-000000000001'
  AND "ownerUserId" IS NULL;

-- ---------------------------------------------------------------------
-- Foreign keys (User + Branch have full relations, others carry just the column)
-- ---------------------------------------------------------------------
ALTER TABLE "users"    ADD CONSTRAINT "users_organizationId_fkey"    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "branches" ADD CONSTRAINT "branches_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ---------------------------------------------------------------------
-- Indexes for tenant-scoped lookups
-- ---------------------------------------------------------------------
CREATE INDEX "users_organizationId_idx"                 ON "users"("organizationId");
CREATE INDEX "branches_organizationId_idx"              ON "branches"("organizationId");
CREATE INDEX "service_categories_organizationId_idx"    ON "service_categories"("organizationId");
CREATE INDEX "services_organizationId_idx"              ON "services"("organizationId");
CREATE INDEX "staff_organizationId_idx"                 ON "staff"("organizationId");
CREATE INDEX "customers_organizationId_idx"             ON "customers"("organizationId");
CREATE INDEX "bookings_organizationId_idx"              ON "bookings"("organizationId");
CREATE INDEX "notifications_organizationId_idx"         ON "notifications"("organizationId");
CREATE INDEX "notification_templates_organizationId_idx" ON "notification_templates"("organizationId");
CREATE INDEX "taxes_organizationId_idx"                 ON "taxes"("organizationId");
CREATE INDEX "staff_earnings_organizationId_idx"        ON "staff_earnings"("organizationId");
CREATE INDEX "payouts_organizationId_idx"               ON "payouts"("organizationId");
CREATE INDEX "coupons_organizationId_idx"               ON "coupons"("organizationId");
CREATE INDEX "reviews_organizationId_idx"               ON "reviews"("organizationId");
CREATE INDEX "settings_organizationId_idx"              ON "settings"("organizationId");
CREATE INDEX "holidays_organizationId_idx"              ON "holidays"("organizationId");
CREATE INDEX "payment_methods_organizationId_idx"       ON "payment_methods"("organizationId");
CREATE INDEX "product_categories_organizationId_idx"    ON "product_categories"("organizationId");
CREATE INDEX "products_organizationId_idx"              ON "products"("organizationId");
CREATE INDEX "product_sales_organizationId_idx"         ON "product_sales"("organizationId");
CREATE INDEX "membership_plans_organizationId_idx"      ON "membership_plans"("organizationId");
CREATE INDEX "referrals_organizationId_idx"             ON "referrals"("organizationId");
CREATE INDEX "inquiries_organizationId_idx"             ON "inquiries"("organizationId");
CREATE INDEX "memberships_organizationId_idx"           ON "memberships"("organizationId");
