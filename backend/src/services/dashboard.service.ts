import prisma from '../config/database';

export class DashboardService {
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
