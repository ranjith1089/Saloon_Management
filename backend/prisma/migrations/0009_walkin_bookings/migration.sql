-- Walk-in service sales: bookings without a registered customer.

-- Allow bookings that have no registered customer (a walk-in sale).
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_customerId_fkey";
ALTER TABLE "bookings" ALTER COLUMN "customerId" DROP NOT NULL;
ALTER TABLE "bookings" ADD COLUMN "walkInName"  TEXT;
ALTER TABLE "bookings" ADD COLUMN "walkInPhone" TEXT;

-- Re-add the FK as nullable (SET NULL on delete so removing a customer
-- keeps the historical booking as a walk-in placeholder).
ALTER TABLE "bookings"
  ADD CONSTRAINT "bookings_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
