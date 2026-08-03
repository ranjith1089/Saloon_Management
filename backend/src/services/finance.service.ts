import prisma from '../config/database';
import { NotFoundError, BadRequestError } from '../utils/ApiError';
import { PayoutStatus } from '@prisma/client';
import { CommissionService } from './commission.service';

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

  static async findAll(query: any, scope: Record<string, any> = {}) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);
    const skip = (page - 1) * limit;

    const where: any = { ...scope };
    if (query.staffId && !scope.staffId) where.staffId = query.staffId;
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

    // Target-aware payout amount. If staff has a monthly target and the period
    // aligns to a single month, use excess * rate. Otherwise fall back to summing
    // the raw StaffEarning rows in the period (existing flat behavior).
    const calc = await CommissionService.payableForPeriod(data.staffId, periodStart, periodEnd);

    // Still link the underlying StaffEarning rows so they can't be double-paid.
    const pendingEarnings = await prisma.staffEarning.findMany({
      where: {
        staffId: data.staffId,
        payoutStatus: 'PENDING',
        createdAt: { gte: periodStart, lte: periodEnd },
      },
    });

    if (calc.payable <= 0) {
      const reason =
        calc.method === 'target-aware'
          ? `Staff has not met the monthly target of ₹${calc.target.toLocaleString()} (achieved ₹${calc.achieved.toLocaleString()})`
          : 'No pending commission for this period';
      throw new BadRequestError(reason);
    }

    return prisma.$transaction(async (tx) => {
      const payout = await tx.payout.create({
        data: {
          staffId: data.staffId,
          amount: calc.payable,
          periodStart,
          periodEnd,
          paymentMethod: data.paymentMethod,
          reference: data.reference,
          notes: buildPayoutNotes(data.notes, calc),
          status: 'PROCESSING',
        },
      });

      if (pendingEarnings.length > 0) {
        await tx.staffEarning.updateMany({
          where: { id: { in: pendingEarnings.map((e) => e.id) } },
          data: { payoutId: payout.id, payoutStatus: 'PROCESSING' },
        });
      }

      return payout;
    });
  }

  static async findAll(query: any, scope: Record<string, any> = {}) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);
    const skip = (page - 1) * limit;

    const where: any = { ...scope };
    if (query.staffId && !scope.staffId) where.staffId = query.staffId;
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

function buildPayoutNotes(userNotes: string | undefined, calc: { method: string; target: number; excess: number; achieved: number }) {
  const parts: string[] = [];
  if (userNotes) parts.push(userNotes);
  if (calc.method === 'target-aware') {
    parts.push(
      `[target-aware] achieved ₹${calc.achieved.toLocaleString()}, target ₹${calc.target.toLocaleString()}, excess ₹${calc.excess.toLocaleString()}`
    );
  } else {
    parts.push('[flat] sum of pending earnings in period');
  }
  return parts.join(' · ');
}
