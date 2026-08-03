-- Record how payment was collected for each booking.
ALTER TABLE "bookings" ADD COLUMN "paymentMethod" TEXT;
ALTER TABLE "bookings" ADD COLUMN "paymentRef" TEXT;
ALTER TABLE "bookings" ADD COLUMN "paidAt" TIMESTAMP(3);
