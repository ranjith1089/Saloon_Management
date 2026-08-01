-- Add monthly revenue target on Staff. Null (or 0) means no target — commission
-- stays as flat-rate on every transaction. When set, commission is only paid on
-- the portion of monthly revenue that exceeds the target.
ALTER TABLE "staff" ADD COLUMN "monthlyTarget" DECIMAL(10,2);
