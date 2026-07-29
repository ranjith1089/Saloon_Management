import prisma from '../config/database';
import { NotFoundError, BadRequestError, ConflictError } from '../utils/ApiError';
import { BookingStatus } from '@prisma/client';
import { NotificationService } from './notification.service';
import { EarningService } from './finance.service';

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

    // Check for conflicts
    const bookingDate = new Date(data.bookingDate);
    const conflicts = await this.checkConflicts(data.staffId, bookingDate, data.startTime, endTime);
    if (conflicts.length > 0) {
      throw new ConflictError('Staff is already booked for this time slot');
    }

    const bookingNumber = `BK${Date.now()}${Math.floor(Math.random() * 1000)}`;

    const booking = await prisma.booking.create({
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
        subtotal: service.price,
        totalAmount: service.price,
        notes: data.notes,
      },
      include: {
        customer: { include: { profile: true } },
        staff: { include: { user: { include: { profile: true } } } },
        branch: true,
        service: { include: { category: true } },
      },
    });

    // Notify customer & staff
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

  static async checkConflicts(staffId: string, date: Date, startTime: string, endTime: string, excludeId?: string) {
    return prisma.booking.findMany({
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

  static async findAll(query: any) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.branchId) where.branchId = query.branchId;
    if (query.staffId) where.staffId = query.staffId;
    if (query.customerId) where.customerId = query.customerId;
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

    // If updating time/date/staff, check for conflicts
    if (data.startTime || data.staffId || data.bookingDate) {
      const staffId = data.staffId || existing.staffId;
      const bookingDate = data.bookingDate ? new Date(data.bookingDate) : existing.bookingDate;
      const startTime = data.startTime || existing.startTime;

      let endTime = existing.endTime;
      if (data.startTime || data.serviceId) {
        const service = await prisma.service.findUnique({
          where: { id: data.serviceId || existing.serviceId },
        });
        const [sh, sm] = startTime.split(':').map(Number);
        const total = sh * 60 + sm + (service?.duration || 60);
        const eh = Math.floor(total / 60);
        const em = total % 60;
        endTime = `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
      }

      const conflicts = await this.checkConflicts(staffId, bookingDate, startTime, endTime, id);
      if (conflicts.length > 0) {
        throw new ConflictError('Staff has a conflicting booking');
      }

      data.endTime = endTime;
    }

    return prisma.booking.update({
      where: { id },
      data,
      include: {
        customer: { include: { profile: true } },
        staff: { include: { user: { include: { profile: true } } } },
        branch: true,
        service: true,
      },
    });
  }

  static async updateStatus(id: string, status: BookingStatus, cancelReason?: string) {
    const booking = await this.findById(id);

    if (booking.status === 'COMPLETED' || booking.status === 'CANCELLED') {
      throw new BadRequestError(`Cannot change status of ${booking.status.toLowerCase()} booking`);
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        status,
        ...(status === 'CANCELLED' && cancelReason && { cancelReason }),
      },
      include: {
        customer: { include: { profile: true } },
        staff: { include: { user: { include: { profile: true } } } },
        branch: true,
        service: true,
      },
    });

    // Update customer stats & create earnings when completed
    if (status === 'COMPLETED') {
      await prisma.customer.updateMany({
        where: { userId: booking.customerId },
        data: {
          totalVisits: { increment: 1 },
          totalSpent: { increment: booking.totalAmount },
          loyaltyPoints: { increment: Math.floor(Number(booking.totalAmount) / 10) },
        },
      });

      // Auto-create staff earning
      await EarningService.create(id).catch((err) => console.error('Earning creation error:', err));

      // Notify customer
      await NotificationService.create({
        userId: booking.customerId,
        title: 'Service Completed',
        message: `Your booking has been completed. Thank you for visiting! Please leave a review.`,
        type: 'BOOKING_COMPLETED',
        data: { bookingId: id },
      }).catch((err) => console.error('Notification error:', err));
    }

    // Notify on cancellation
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

  static async getCalendar(query: any) {
    const startDate = new Date(query.startDate);
    const endDate = new Date(query.endDate);

    const where: any = {
      bookingDate: { gte: startDate, lte: endDate },
    };
    if (query.branchId) where.branchId = query.branchId;
    if (query.staffId) where.staffId = query.staffId;

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
