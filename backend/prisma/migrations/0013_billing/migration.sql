-- Ship 3B of SaaS conversion — Razorpay-backed billing.
-- Adds subscription + invoice history tables. Nothing here activates a
-- charge; that happens when Razorpay env vars land and the app posts to
-- their Subscriptions API.

CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'PAUSED', 'CANCELLED');
CREATE TYPE "InvoiceStatus"      AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

CREATE TABLE "subscriptions" (
  "id"                     TEXT NOT NULL PRIMARY KEY,
  "organizationId"         TEXT NOT NULL,
  "plan"                   "SubscriptionPlan"   NOT NULL,
  "status"                 "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
  "razorpaySubscriptionId" TEXT NOT NULL,
  "razorpayPlanId"         TEXT NOT NULL,
  "currentPeriodStart"     TIMESTAMP(3),
  "currentPeriodEnd"       TIMESTAMP(3),
  "cancelledAt"            TIMESTAMP(3),
  "createdAt"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"              TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "subscriptions_razorpaySubscriptionId_key" ON "subscriptions"("razorpaySubscriptionId");
CREATE INDEX "subscriptions_organizationId_idx"                 ON "subscriptions"("organizationId");
CREATE INDEX "subscriptions_razorpaySubscriptionId_idx"         ON "subscriptions"("razorpaySubscriptionId");

CREATE TABLE "invoices" (
  "id"                TEXT NOT NULL PRIMARY KEY,
  "organizationId"    TEXT NOT NULL,
  "subscriptionId"    TEXT,
  "amount"            DECIMAL(10, 2) NOT NULL,
  "currency"          TEXT NOT NULL DEFAULT 'INR',
  "status"            "InvoiceStatus" NOT NULL DEFAULT 'PENDING',
  "razorpayInvoiceId" TEXT,
  "razorpayPaymentId" TEXT,
  "issuedAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "paidAt"            TIMESTAMP(3),
  "pdfUrl"            TEXT,
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3) NOT NULL,
  CONSTRAINT "invoices_subscriptionId_fkey"
    FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "invoices_razorpayInvoiceId_key" ON "invoices"("razorpayInvoiceId");
CREATE INDEX "invoices_organizationId_idx"           ON "invoices"("organizationId");
CREATE INDEX "invoices_subscriptionId_idx"           ON "invoices"("subscriptionId");
