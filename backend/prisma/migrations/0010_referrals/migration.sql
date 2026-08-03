-- Referral tracking + user share codes.

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('PENDING', 'COMPLETED', 'EXPIRED');

-- Add sharable code to users (lazy-created on first request).
ALTER TABLE "users" ADD COLUMN "referralCode" TEXT;
CREATE UNIQUE INDEX "users_referralCode_key" ON "users"("referralCode");

-- CreateTable
CREATE TABLE "referrals" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "refereeId" TEXT,
    "status" "ReferralStatus" NOT NULL DEFAULT 'PENDING',
    "rewardOwner" INTEGER NOT NULL DEFAULT 0,
    "rewardReferee" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "referrals_refereeId_key" ON "referrals"("refereeId");
CREATE INDEX "referrals_ownerId_idx"  ON "referrals"("ownerId");
CREATE INDEX "referrals_status_idx"   ON "referrals"("status");
CREATE INDEX "referrals_code_idx"     ON "referrals"("code");

ALTER TABLE "referrals" ADD CONSTRAINT "referrals_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_refereeId_fkey"
    FOREIGN KEY ("refereeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
