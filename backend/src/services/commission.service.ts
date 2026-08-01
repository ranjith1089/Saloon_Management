import prisma from '../config/database';
import { NotFoundError } from '../utils/ApiError';

interface MonthlySummary {
  staffId: string;
  staffName: string;
  employeeCode: string;
  branch: string | null;
  commissionRate: number;
  monthlyTarget: number;
  serviceRevenue: number;
  productRevenue: number;
  achieved: number;
  targetMet: boolean;
  excess: number;
  payableCommission: number;
  rawCommission: number; // What flat-rate would pay — for comparison
}

function monthBounds(year: number, month: number) {
  // month is 1-12
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1)); // exclusive
  return { start, end };
}

export class CommissionService {
  /**
   * Compute a staff member's monthly commission summary.
   * Formula:
   *   achieved   = service revenue (non-cancelled bookings) + product revenue (non-voided sales)
   *   excess     = max(0, achieved - monthlyTarget)
   *   payable    = excess * commissionRate / 100          when a target is set
   *              = achieved * commissionRate / 100        when no target (flat)
   */
  static async monthlySummaryForStaff(
    staffId: string,
    year: number,
    month: number
  ): Promise<MonthlySummary> {
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      include: { user: { include: { profile: true } }, branch: true },
    });
    if (!staff) throw new NotFoundError('Staff not found');

    const { start, end } = monthBounds(year, month);

    const [bookingAgg, productAgg] = await Promise.all([
      prisma.booking.aggregate({
        where: {
          staffId,
          bookingDate: { gte: start, lt: end },
          status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        },
        _sum: { totalAmount: true },
      }),
      prisma.productSale.aggregate({
        where: {
          staffId,
          createdAt: { gte: start, lt: end },
          voidedAt: null,
        },
        _sum: { totalAmount: true },
      }),
    ]);

    const commissionRate = Number(staff.commissionRate || 0);
    const monthlyTarget = Number(staff.monthlyTarget || 0);
    const serviceRevenue = Number(bookingAgg._sum.totalAmount || 0);
    const productRevenue = Number(productAgg._sum.totalAmount || 0);
    const achieved = serviceRevenue + productRevenue;
    const hasTarget = monthlyTarget > 0;

    const excess = hasTarget ? Math.max(0, achieved - monthlyTarget) : achieved;
    const payableCommission = round2((excess * commissionRate) / 100);
    const rawCommission = round2((achieved * commissionRate) / 100);
    const targetMet = hasTarget ? achieved >= monthlyTarget : true;

    return {
      staffId: staff.id,
      staffName: `${staff.user.profile?.firstName || ''} ${staff.user.profile?.lastName || ''}`.trim(),
      employeeCode: staff.employeeCode,
      branch: staff.branch?.name || null,
      commissionRate,
      monthlyTarget,
      serviceRevenue,
      productRevenue,
      achieved,
      targetMet,
      excess: round2(excess),
      payableCommission,
      rawCommission,
    };
  }

  /**
   * Same computation for all active staff (optionally filtered by branch).
   * Used by the Earnings page's "Monthly Commissions" section and Payouts UI.
   */
  static async monthlySummaryForAll(year: number, month: number, branchId?: string) {
    const where: any = {};
    if (branchId) where.branchId = branchId;
    const staff = await prisma.staff.findMany({
      where,
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });
    const summaries = await Promise.all(
      staff.map((s) => this.monthlySummaryForStaff(s.id, year, month))
    );
    return summaries;
  }

  /**
   * Compute payable commission for a staff over an arbitrary period.
   * If the period aligns to a single calendar month AND the staff has a
   * target, use target-aware payable. Otherwise fall back to raw flat rate.
   *
   * Returns { payable, achieved, method } where method describes which
   * calculation was applied so the UI can explain it.
   */
  static async payableForPeriod(staffId: string, periodStart: Date, periodEnd: Date) {
    const staff = await prisma.staff.findUnique({ where: { id: staffId } });
    if (!staff) throw new NotFoundError('Staff not found');

    const commissionRate = Number(staff.commissionRate || 0);
    const monthlyTarget = Number(staff.monthlyTarget || 0);

    // Detect a single-calendar-month range (whole month, or leading window inside a month).
    const sameMonth =
      periodStart.getUTCFullYear() === periodEnd.getUTCFullYear() &&
      periodStart.getUTCMonth() === periodEnd.getUTCMonth();

    if (sameMonth && monthlyTarget > 0) {
      const summary = await this.monthlySummaryForStaff(
        staffId,
        periodStart.getUTCFullYear(),
        periodStart.getUTCMonth() + 1
      );
      return {
        payable: summary.payableCommission,
        achieved: summary.achieved,
        method: 'target-aware' as const,
        target: summary.monthlyTarget,
        excess: summary.excess,
      };
    }

    // Fallback — sum StaffEarning rows in the period (existing behavior).
    const agg = await prisma.staffEarning.aggregate({
      where: {
        staffId,
        createdAt: { gte: periodStart, lte: periodEnd },
        payoutStatus: 'PENDING',
      },
      _sum: { commissionAmount: true, baseAmount: true },
    });
    return {
      payable: Number(agg._sum.commissionAmount || 0),
      achieved: Number(agg._sum.baseAmount || 0),
      method: 'flat' as const,
      target: 0,
      excess: 0,
    };
  }
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
