import prisma from '../config/database';
import { NotFoundError, BadRequestError, ConflictError } from '../utils/ApiError';
import { BookingStatus, Prisma } from '@prisma/client';
import { NotificationService } from './notification.service';
import { CouponService } from './coupon.service';
import { MembershipService } from './membership.service';

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

const BOOKING_INCLUDE = {
  customer: { include: { profile: true } },
  staff: { include: { user: { include: { profile: true } } } },
  branch: true,
  service: { include: { category: true } },
} as const;

export class BookingService {
  static async create(data: any) {
    // Validate service exists and get duration
    const service = await prisma.service.findUnique({ where: { id: data.serviceId } });
    if (!service) throw new NotFoundError('Service not found');

    // Validate customer & staff & branch
    const [customer, staff, branch] = await Promise.all([
      prisma.user.findUnique({ where: { id: data.customerId } }),
      prisma.staff.findUnique({ where: { id: data.staffId } }),
      prisma.branch.findUnique({ where: { id: data.branchId } }),
    ]);

    if (!customer) throw new NotFoundError('Customer not found');
    if (!staff) throw new NotFoundError('Staff not found');
    if (!branch) throw new NotFoundError('Branch not found');

    // Calculate end time
    const [startHour, startMin] = data.startTime.split(':').map(Number);
    const totalMinutes = startHour * 60 + startMin + service.duration;
    const endHour = Math.floor(totalMinutes / 60);
    const endMin = totalMinutes % 60;
    const endTime = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;

    const bookingDate = new Date(data.bookingDate);

    // Member pricing — if the customer has an active membership AND the service
    // has a memberPrice, use it. Otherwise fall back to the regular price.
    const activeMembership = await MembershipService.getActiveForCustomer(data.customerId);
    const useMemberPrice =
      !!activeMembership && service.memberPrice !== null && service.memberPrice !== undefined;
    const subtotal = Number(useMemberPrice ? service.memberPrice! : service.price);

    // Validate coupon (outside transaction to keep it short; final usage check is inside)
    let couponApplied: { id: string; discount: number } | null = null;
    if (data.couponCode) {
      const { coupon, discountAmount } = await CouponService.validate(
        data.couponCode,
        subtotal,
        data.customerId
      );
      couponApplied = { id: coupon.id, discount: discountAmount };
    }

    const discountAmount = couponApplied?.discount ?? 0;
    const totalAmount = Math.max(0, subtotal - discountAmount);
    const bookingNumber = `BK${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // Serializable transaction: conflict check + create + coupon usage bump
    // must happen atomically or two racing requests can double-book the slot.
    const booking = await prisma.$transaction(
      async (tx) => {
        const conflicts = await this.checkConflicts(
          data.staffId,
          bookingDate,
          data.startTime,
          endTime,
          undefined,
          tx
        );
        if (conflicts.length > 0) {
          throw new ConflictError('Staff is already booked for this time slot');
        }

        // Re-check coupon usage limit inside the transaction so it can't be over-consumed.
        if (couponApplied) {
          const c = await tx.coupon.findUnique({ where: { id: couponApplied.id } });
          if (!c) throw new BadRequestError('Coupon disappeared');
          if (c.usageLimit && c.usageCount >= c.usageLimit) {
            throw new BadRequestError('Coupon usage limit reached');
          }
          await tx.coupon.update({
            where: { id: couponApplied.id },
            data: { usageCount: { increment: 1 } },
          });
        }

        return tx.booking.create({
          data: {
            bookingNumber,
            customerId: data.customerId,
            staffId: data.staffId,
            branchId: data.branchId,
            serviceId: data.serviceId,
            bookingDate,
            startTime: data.startTime,
            endTime,
            status: (data.status as BookingStatus) || 'PENDING',
            subtotal,
            discountAmount,
            totalAmount,
            couponId: couponApplied?.id,
            notes: data.notes,
          },
          include: BOOKING_INCLUDE,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

    // Notifications are best-effort — a failed notification must not roll back the booking.
    await Promise.all([
      NotificationService.create({
        userId: booking.customerId,
        title: 'Booking Confirmed',
        message: `Your booking for ${service.name} on ${bookingDate.toDateString()} at ${data.startTime} has been created.`,
        type: 'BOOKING_CREATED',
        data: { bookingId: booking.id },
      }),
      NotificationService.create({
        userId: booking.staff.userId,
        title: 'New Booking Assigned',
        message: `You have a new booking for ${service.name} on ${bookingDate.toDateString()} at ${data.startTime}.`,
        type: 'BOOKING_CREATED',
        data: { bookingId: booking.id },
      }),
    ]).catch((err) => console.error('Notification error:', err));

    return booking;
  }

  static async checkConflicts(
    staffId: string,
    date: Date,
    startTime: string,
    endTime: string,
    excludeId?: string,
    client: Prisma.TransactionClient | typeof prisma = prisma
  ) {
    return client.booking.findMany({
      where: {
        staffId,
        bookingDate: date,
        status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
        ...(excludeId && { id: { not: excludeId } }),
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } },
            ],
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } },
            ],
          },
          {
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } },
            ],
          },
        ],
      },
    });
  }

  static async findAll(query: any, scope: Record<string, any> = {}) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);
    const skip = (page - 1) * limit;

    const where: any = { ...scope };
    if (query.status) where.status = query.status;
    if (query.branchId) where.branchId = query.branchId;
    if (query.staffId && !scope.staffId) where.staffId = query.staffId;
    if (query.customerId && !scope.customerId) where.customerId = query.customerId;
    if (query.paymentStatus) where.paymentStatus = query.paymentStatus;
    if (query.startDate && query.endDate) {
      where.bookingDate = {
        gte: new Date(query.startDate),
        lte: new Date(query.endDate),
      };
    } else if (query.date) {
      const date = new Date(query.date);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      where.bookingDate = { gte: date, lt: nextDate };
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { bookingDate: 'desc' },
        include: {
          customer: { include: { profile: true } },
          staff: { include: { user: { include: { profile: true } } } },
          branch: true,
          service: { include: { category: true } },
        },
      }),
      prisma.booking.count({ where }),
    ]);

    return { bookings, total, page, limit };
  }

  static async findById(id: string) {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        customer: { include: { profile: true, customer: true } },
        staff: { include: { user: { include: { profile: true } } } },
        branch: { include: { city: true } },
        service: { include: { category: true } },
      },
    });
    if (!booking) throw new NotFoundError('Booking not found');
    return booking;
  }

  static async update(id: string, data: any) {
    const existing = await this.findById(id);

    // Pre-compute endTime outside the transaction if scheduling fields changed.
    let endTime = existing.endTime;
    const needsConflictCheck = !!(data.startTime || data.staffId || data.bookingDate);
    const staffId = data.staffId || existing.staffId;
    const bookingDate = data.bookingDate ? new Date(data.bookingDate) : existing.bookingDate;
    const startTime = data.startTime || existing.startTime;

    if (data.startTime || data.serviceId) {
      const service = await prisma.service.findUnique({
        where: { id: data.serviceId || existing.serviceId },
      });
      const [sh, sm] = startTime.split(':').map(Number);
      const total = sh * 60 + sm + (service?.duration || 60);
      const eh = Math.floor(total / 60);
      const em = total % 60;
      endTime = `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
      data.endTime = endTime;
    }

    if (!needsConflictCheck) {
      return prisma.booking.update({ where: { id }, data, include: BOOKING_INCLUDE });
    }

    return prisma.$transaction(
      async (tx) => {
        const conflicts = await this.checkConflicts(staffId, bookingDate, startTime, endTime, id, tx);
        if (conflicts.length > 0) {
          throw new ConflictError('Staff has a conflicting booking');
        }
        return tx.booking.update({ where: { id }, data, include: BOOKING_INCLUDE });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
  }

  static async updateStatus(id: string, status: BookingStatus, cancelReason?: string) {
    const booking = await this.findById(id);

    if (booking.status === 'COMPLETED' || booking.status === 'CANCELLED') {
      throw new BadRequestError(`Cannot change status of ${booking.status.toLowerCase()} booking`);
    }

    // Status flip + downstream financial writes (earnings, customer stats) must be atomic.
    // Notifications stay outside — a mail/SMS failure must never roll back the completion.
    const updated = await prisma.$transaction(async (tx) => {
      const upd = await tx.booking.update({
        where: { id },
        data: {
          status,
          ...(status === 'CANCELLED' && cancelReason && { cancelReason }),
        },
        include: BOOKING_INCLUDE,
      });

      if (status === 'COMPLETED') {
        await tx.customer.updateMany({
          where: { userId: booking.customerId },
          data: {
            totalVisits: { increment: 1 },
            totalSpent: { increment: booking.totalAmount },
            loyaltyPoints: { increment: Math.floor(Number(booking.totalAmount) / 10) },
          },
        });

        // Idempotent earning creation (unique on bookingId).
        const existing = await tx.staffEarning.findUnique({ where: { bookingId: id } });
        if (!existing) {
          const commissionRate = Number(upd.staff.commissionRate || 0);
          const baseAmount = Number(upd.totalAmount);
          const commissionAmount = (baseAmount * commissionRate) / 100;
          await tx.staffEarning.create({
            data: {
              staffId: upd.staffId,
              bookingId: id,
              baseAmount,
              commissionRate,
              commissionAmount,
            },
          });
        }
      }

      return upd;
    });

    // Best-effort notifications after the transaction commits.
    if (status === 'COMPLETED') {
      await NotificationService.create({
        userId: booking.customerId,
        title: 'Service Completed',
        message: `Your booking has been completed. Thank you for visiting! Please leave a review.`,
        type: 'BOOKING_COMPLETED',
        data: { bookingId: id },
      }).catch((err) => console.error('Notification error:', err));
    }
    if (status === 'CANCELLED') {
      await NotificationService.create({
        userId: booking.customerId,
        title: 'Booking Cancelled',
        message: `Your booking has been cancelled. ${cancelReason ? 'Reason: ' + cancelReason : ''}`,
        type: 'BOOKING_CANCELLED',
        data: { bookingId: id },
      }).catch((err) => console.error('Notification error:', err));
    }

    return updated;
  }

  static async delete(id: string) {
    await this.findById(id);
    return prisma.booking.delete({ where: { id } });
  }

  static async collectPayment(
    id: string,
    payload: {
      method: string;
      reference?: string;
      amount?: number;
      taxRate?: number;      // e.g. 18 for 18% GST, 0 or undefined for no tax
      alsoComplete?: boolean;
    }
  ) {
    const booking = await this.findById(id);

    if (booking.paymentStatus === 'PAID') {
      throw new BadRequestError('Booking is already paid');
    }
    if (booking.paymentStatus === 'REFUNDED') {
      throw new BadRequestError('Booking has been refunded');
    }
    if (booking.status === 'CANCELLED') {
      throw new BadRequestError('Cannot collect payment for a cancelled booking');
    }

    // Do the payment flip (+ optional completion) atomically so a failure
    // between the two writes can't leave the booking half-updated.
    return prisma.$transaction(async (tx) => {
      // Pre-tax subtotal — either the caller's amount (tip / adjustment) or
      // the original booking total. Tax is always computed by the server.
      const subtotal =
        payload.amount !== undefined && payload.amount !== null && payload.amount >= 0
          ? payload.amount
          : Number(booking.totalAmount);
      const taxRate = payload.taxRate && payload.taxRate > 0 ? payload.taxRate : 0;
      const taxAmount = round2((subtotal * taxRate) / 100);
      const totalAmount = round2(subtotal + taxAmount);

      const paid = await tx.booking.update({
        where: { id },
        data: {
          paymentStatus: 'PAID',
          paymentMethod: payload.method,
          paymentRef: payload.reference || null,
          paidAt: new Date(),
          subtotal,
          taxAmount,
          totalAmount,
        },
        include: BOOKING_INCLUDE,
      });

      // Optional: flip to COMPLETED in the same transaction. Reuses the same
      // effects as updateStatus (customer stats + staff earning creation).
      if (payload.alsoComplete && booking.status !== 'COMPLETED' && booking.status !== 'CANCELLED') {
        await tx.customer.updateMany({
          where: { userId: booking.customerId },
          data: {
            totalVisits: { increment: 1 },
            totalSpent: { increment: paid.totalAmount },
            loyaltyPoints: { increment: Math.floor(Number(paid.totalAmount) / 10) },
          },
        });

        const existing = await tx.staffEarning.findUnique({ where: { bookingId: id } });
        if (!existing) {
          const commissionRate = Number(paid.staff.commissionRate || 0);
          const baseAmount = Number(paid.totalAmount);
          const commissionAmount = (baseAmount * commissionRate) / 100;
          await tx.staffEarning.create({
            data: {
              staffId: paid.staffId,
              bookingId: id,
              baseAmount,
              commissionRate,
              commissionAmount,
            },
          });
        }

        return tx.booking.update({
          where: { id },
          data: { status: 'COMPLETED' },
          include: BOOKING_INCLUDE,
        });
      }

      return paid;
    });
  }

  static async getCalendar(query: any, scope: Record<string, any> = {}) {
    const startDate = new Date(query.startDate);
    const endDate = new Date(query.endDate);

    const where: any = {
      ...scope,
      bookingDate: { gte: startDate, lte: endDate },
    };
    if (query.branchId) where.branchId = query.branchId;
    if (query.staffId && !scope.staffId) where.staffId = query.staffId;

    return prisma.booking.findMany({
      where,
      orderBy: [{ bookingDate: 'asc' }, { startTime: 'asc' }],
      include: {
        customer: { include: { profile: true } },
        staff: { include: { user: { include: { profile: true } } } },
        service: true,
        branch: true,
      },
    });
  }

  static async getAvailableSlots(staffId: string, date: string, serviceId: string) {
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) throw new NotFoundError('Service not found');

    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay();

    const schedule = await prisma.staffSchedule.findUnique({
      where: { staffId_dayOfWeek: { staffId, dayOfWeek } },
    });

    if (!schedule || schedule.isOff) {
      return { slots: [], message: 'Staff not available on this day' };
    }

    const bookings = await prisma.booking.findMany({
      where: {
        staffId,
        bookingDate: targetDate,
        status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
      },
      orderBy: { startTime: 'asc' },
    });

    // Generate 30-min slots between start & end times
    const slots: { startTime: string; endTime: string; available: boolean }[] = [];
    const [startH, startM] = schedule.startTime.split(':').map(Number);
    const [endH, endM] = schedule.endTime.split(':').map(Number);
    const workStart = startH * 60 + startM;
    const workEnd = endH * 60 + endM;

    for (let mins = workStart; mins + service.duration <= workEnd; mins += 30) {
      const sh = Math.floor(mins / 60);
      const sm = mins % 60;
      const startTime = `${String(sh).padStart(2, '0')}:${String(sm).padStart(2, '0')}`;
      const endMins = mins + service.duration;
      const eh = Math.floor(endMins / 60);
      const em = endMins % 60;
      const endTime = `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;

      const conflict = bookings.some((b) => {
        return (
          (startTime >= b.startTime && startTime < b.endTime) ||
          (endTime > b.startTime && endTime <= b.endTime) ||
          (startTime <= b.startTime && endTime >= b.endTime)
        );
      });

      slots.push({ startTime, endTime, available: !conflict });
    }

    return { slots };
  }
}
