import prisma from '../config/database';
import { NotFoundError, BadRequestError } from '../utils/ApiError';
import { PayoutStatus } from '@prisma/client';

// ============ TAX ============
export class TaxService {
  static async create(data: any) {
    if (data.isDefault) {
      await prisma.tax.updateMany({ data: { isDefault: false } });
    }
    return prisma.tax.create({ data });
  }

  static async findAll() {
    return prisma.tax.findMany({ orderBy: { createdAt: 'desc' } });
  }

  static async findById(id: string) {
    const tax = await prisma.tax.findUnique({ where: { id } });
    if (!tax) throw new NotFoundError('Tax not found');
    return tax;
  }

  static async update(id: string, data: any) {
    await this.findById(id);
    if (data.isDefault) {
      await prisma.tax.updateMany({ where: { id: { not: id } }, data: { isDefault: false } });
    }
    return prisma.tax.update({ where: { id }, data });
  }

  static async delete(id: string) {
    await this.findById(id);
    return prisma.tax.delete({ where: { id } });
  }

  static async getDefault() {
    return prisma.tax.findFirst({ where: { isDefault: true, isActive: true } });
  }
}

// ============ EARNINGS ============
export class EarningService {
  static async create(bookingId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { staff: true },
    });
    if (!booking) throw new NotFoundError('Booking not found');
    if (booking.status !== 'COMPLETED') throw new BadRequestError('Booking must be completed');

    const existing = await prisma.staffEarning.findUnique({ where: { bookingId } });
    if (existing) return existing;

    const commissionRate = Number(booking.staff.commissionRate || 0);
    const baseAmount = Number(booking.totalAmount);
    const commissionAmount = (baseAmount * commissionRate) / 100;

    return prisma.staffEarning.create({
      data: {
        staffId: booking.staffId,
        bookingId,
        baseAmount,
        commissionRate,
        commissionAmount,
      },
    });
  }

  static async findAll(query: any) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.staffId) where.staffId = query.staffId;
    if (query.payoutStatus) where.payoutStatus = query.payoutStatus;
    if (query.startDate && query.endDate) {
      where.createdAt = { gte: new Date(query.startDate), lte: new Date(query.endDate) };
    }

    const [earnings, total, summary] = await Promise.all([
      prisma.staffEarning.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          staff: { include: { user: { include: { profile: true } } } },
          booking: { include: { service: true, customer: { include: { profile: true } } } },
        },
      }),
      prisma.staffEarning.count({ where }),
      prisma.staffEarning.aggregate({
        where,
        _sum: { commissionAmount: true, baseAmount: true },
      }),
    ]);

    return {
      earnings,
      total,
      page,
      limit,
      summary: {
        totalBase: summary._sum.baseAmount || 0,
        totalCommission: summary._sum.commissionAmount || 0,
      },
    };
  }

  static async getStaffEarnings(staffId: string, query: any) {
    return this.findAll({ ...query, staffId });
  }
}

// ============ PAYOUTS ============
export class PayoutService {
  static async create(data: any) {
    const staff = await prisma.staff.findUnique({ where: { id: data.staffId } });
    if (!staff) throw new NotFoundError('Staff not found');

    const periodStart = new Date(data.periodStart);
    const periodEnd = new Date(data.periodEnd);

    // Fetch all pending earnings in the period
    const pendingEarnings = await prisma.staffEarning.findMany({
      where: {
        staffId: data.staffId,
        payoutStatus: 'PENDING',
        createdAt: { gte: periodStart, lte: periodEnd },
      },
    });

    if (pendingEarnings.length === 0) {
      throw new BadRequestError('No pending earnings found for this period');
    }

    const totalAmount = pendingEarnings.reduce(
      (sum, e) => sum + Number(e.commissionAmount),
      0
    );

    const payout = await prisma.payout.create({
      data: {
        staffId: data.staffId,
        amount: totalAmount,
        periodStart,
        periodEnd,
        paymentMethod: data.paymentMethod,
        reference: data.reference,
        notes: data.notes,
        status: 'PROCESSING',
      },
    });

    // Link earnings to payout
    await prisma.staffEarning.updateMany({
      where: { id: { in: pendingEarnings.map((e) => e.id) } },
      data: { payoutId: payout.id, payoutStatus: 'PROCESSING' },
    });

    return payout;
  }

  static async findAll(query: any) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.staffId) where.staffId = query.staffId;
    if (query.status) where.status = query.status;

    const [payouts, total] = await Promise.all([
      prisma.payout.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          staff: { include: { user: { include: { profile: true } } } },
          _count: { select: { earnings: true } },
        },
      }),
      prisma.payout.count({ where }),
    ]);

    return { payouts, total, page, limit };
  }

  static async findById(id: string) {
    const payout = await prisma.payout.findUnique({
      where: { id },
      include: {
        staff: { include: { user: { include: { profile: true } } } },
        earnings: {
          include: { booking: { include: { service: true } } },
        },
      },
    });
    if (!payout) throw new NotFoundError('Payout not found');
    return payout;
  }

  static async markAsPaid(id: string, reference?: string) {
    const payout = await this.findById(id);
    if (payout.status === 'PAID') {
      throw new BadRequestError('Payout is already paid');
    }

    const updated = await prisma.payout.update({
      where: { id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        ...(reference && { reference }),
      },
    });

    // Update earnings status
    await prisma.staffEarning.updateMany({
      where: { payoutId: id },
      data: { payoutStatus: 'PAID' },
    });

    return updated;
  }

  static async cancel(id: string) {
    const payout = await this.findById(id);
    if (payout.status === 'PAID') {
      throw new BadRequestError('Cannot cancel a paid payout');
    }

    // Reset earnings to pending
    await prisma.staffEarning.updateMany({
      where: { payoutId: id },
      data: { payoutId: null, payoutStatus: 'PENDING' },
    });

    return prisma.payout.update({
      where: { id },
      data: { status: 'FAILED' as PayoutStatus },
    });
  }
}
