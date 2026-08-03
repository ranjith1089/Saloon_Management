import prisma from '../config/database';
import { CommissionService } from './commission.service';
import { MembershipService } from './membership.service';

export class DashboardService {
  /**
   * Home tiles for a CUSTOMER — their own upcoming bookings, membership,
   * loyalty points, lifetime spend.
   */
  static async getCustomerHome(userId: string) {
    const now = new Date();
    const [upcoming, past, customer, membership] = await Promise.all([
      prisma.booking.findMany({
        where: {
          customerId: userId,
          bookingDate: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) },
          status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
        },
        take: 5,
        orderBy: [{ bookingDate: 'asc' }, { startTime: 'asc' }],
        include: { service: true, staff: { include: { user: { include: { profile: true } } } }, branch: true },
      }),
      prisma.booking.count({
        where: { customerId: userId, status: 'COMPLETED' },
      }),
      prisma.customer.findUnique({ where: { userId } }),
      MembershipService.getActiveForCustomer(userId),
    ]);
    return {
      upcoming,
      metrics: {
        upcomingCount: upcoming.length,
        completedCount: past,
        loyaltyPoints: customer?.loyaltyPoints ?? 0,
        totalSpent: Number(customer?.totalSpent ?? 0),
      },
      membership,
    };
  }

  /**
   * Home tiles for a STAFF member — today's schedule + this month's
   * commission summary.
   */
  static async getStaffHome(staffId: string) {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const [today, upcomingWeek, monthly] = await Promise.all([
      prisma.booking.findMany({
        where: {
          staffId,
          bookingDate: { gte: startOfDay, lt: endOfDay },
          status: { notIn: ['CANCELLED'] },
        },
        orderBy: { startTime: 'asc' },
        include: { service: true, customer: { include: { profile: true } } },
      }),
      prisma.booking.count({
        where: {
          staffId,
          bookingDate: { gte: startOfDay, lt: new Date(startOfDay.getTime() + 7 * 24 * 3600 * 1000) },
          status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
        },
      }),
      CommissionService.monthlySummaryForStaff(staffId, now.getUTCFullYear(), now.getUTCMonth() + 1),
    ]);

    return {
      today,
      metrics: {
        todayCount: today.length,
        upcomingWeekCount: upcomingWeek,
        monthlyAchieved: monthly.achieved,
        monthlyTarget: monthly.monthlyTarget,
        payableCommission: monthly.payableCommission,
        targetMet: monthly.targetMet,
      },
    };
  }
  static async getStats(query: any) {
    const startDate = query.startDate ? new Date(query.startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const endDate = query.endDate ? new Date(query.endDate) : new Date();
    const branchId = query.branchId;

    const bookingWhere: any = {
      bookingDate: { gte: startDate, lte: endDate },
    };
    if (branchId) bookingWhere.branchId = branchId;

    const productSaleWhere: any = {
      createdAt: { gte: startDate, lte: endDate },
      voidedAt: null,
    };
    if (branchId) productSaleWhere.branchId = branchId;

    const [
      totalBookings,
      totalRevenue,
      totalCustomers,
      totalCommissions,
      upcomingBookings,
      topServices,
      productRevenue,
      totalProductSales,
    ] = await Promise.all([
      prisma.booking.count({ where: bookingWhere }),
      prisma.booking.aggregate({
        // Revenue = confirmed booked revenue. `paymentStatus` isn't updated by the app,
        // so any filter on it yields 0. Exclude only cancellations and no-shows.
        where: { ...bookingWhere, status: { notIn: ['CANCELLED', 'NO_SHOW'] } },
        _sum: { totalAmount: true },
      }),
      prisma.customer.count(),
      prisma.booking.aggregate({
        where: { ...bookingWhere, status: 'COMPLETED' },
        _sum: { totalAmount: true },
      }),
      prisma.booking.findMany({
        where: {
          bookingDate: { gte: new Date() },
          status: { in: ['PENDING', 'CONFIRMED'] },
          ...(branchId && { branchId }),
        },
        take: 5,
        orderBy: [{ bookingDate: 'asc' }, { startTime: 'asc' }],
        include: {
          customer: { include: { profile: true } },
          staff: { include: { user: { include: { profile: true } } } },
          service: true,
          branch: true,
        },
      }),
      prisma.booking.groupBy({
        by: ['serviceId'],
        where: bookingWhere,
        _count: true,
        _sum: { totalAmount: true },
        orderBy: { _count: { serviceId: 'desc' } },
        take: 5,
      }),
      prisma.productSale.aggregate({
        where: productSaleWhere,
        _sum: { totalAmount: true },
      }),
      prisma.productSale.count({ where: productSaleWhere }),
    ]);

    // Get service names for top services
    const serviceIds = topServices.map((s) => s.serviceId);
    const services = await prisma.service.findMany({
      where: { id: { in: serviceIds } },
      select: { id: true, name: true },
    });

    const topServicesWithNames = topServices.map((s) => {
      const svc = services.find((sv) => sv.id === s.serviceId);
      return {
        serviceId: s.serviceId,
        name: svc?.name || 'Unknown',
        totalCount: s._count,
        totalAmount: s._sum.totalAmount || 0,
      };
    });

    // Commission calculation (10% of completed bookings by default)
    const commissionAmount = Number(totalCommissions._sum.totalAmount || 0) * 0.1;

    return {
      metrics: {
        totalAppointments: totalBookings,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        salesCommissions: commissionAmount,
        totalCustomers,
        productRevenue: productRevenue._sum.totalAmount || 0,
        productSales: totalProductSales,
      },
      upcomingBookings,
      topServices: topServicesWithNames,
    };
  }

  static async getRevenueChart(query: any) {
    const startDate = query.startDate ? new Date(query.startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const endDate = query.endDate ? new Date(query.endDate) : new Date();

    const bookings = await prisma.booking.findMany({
      where: {
        bookingDate: { gte: startDate, lte: endDate },
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        ...(query.branchId && { branchId: query.branchId }),
      },
      select: {
        bookingDate: true,
        totalAmount: true,
      },
    });

    // Group by date
    const revenueByDate: Record<string, number> = {};
    bookings.forEach((b) => {
      const dateKey = b.bookingDate.toISOString().split('T')[0];
      revenueByDate[dateKey] = (revenueByDate[dateKey] || 0) + Number(b.totalAmount);
    });

    const chartData = Object.entries(revenueByDate)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return chartData;
  }
}
