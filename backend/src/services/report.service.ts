import prisma from '../config/database';

export class ReportService {
  static async dailyBookings(query: any) {
    const date = query.date ? new Date(query.date) : new Date();
    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + 1);

    const where: any = { bookingDate: { gte: date, lt: nextDay } };
    if (query.branchId) where.branchId = query.branchId;

    const [bookings, statusCounts, revenue] = await Promise.all([
      prisma.booking.findMany({
        where,
        orderBy: { startTime: 'asc' },
        include: {
          customer: { include: { profile: true } },
          staff: { include: { user: { include: { profile: true } } } },
          service: true,
          branch: true,
        },
      }),
      prisma.booking.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      prisma.booking.aggregate({
        // Revenue = confirmed booked revenue (everything except cancellations/no-shows).
        // `paymentStatus` isn't maintained by the booking flow, so filtering by it always yields 0.
        where: { ...where, status: { notIn: ['CANCELLED', 'NO_SHOW'] } },
        _sum: { totalAmount: true, taxAmount: true, discountAmount: true },
      }),
    ]);

    return {
      date,
      totalBookings: bookings.length,
      revenue: {
        total: revenue._sum.totalAmount || 0,
        tax: revenue._sum.taxAmount || 0,
        discount: revenue._sum.discountAmount || 0,
      },
      statusBreakdown: statusCounts.reduce((acc: any, s) => {
        acc[s.status] = s._count;
        return acc;
      }, {}),
      bookings,
    };
  }

  static async overallBookings(query: any) {
    const startDate = query.startDate ? new Date(query.startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const endDate = query.endDate ? new Date(query.endDate) : new Date();

    const where: any = { bookingDate: { gte: startDate, lte: endDate } };
    if (query.branchId) where.branchId = query.branchId;

    const [totalBookings, statusCounts, revenue, byBranch] = await Promise.all([
      prisma.booking.count({ where }),
      prisma.booking.groupBy({ by: ['status'], where, _count: true }),
      prisma.booking.aggregate({
        where: { ...where, status: { notIn: ['CANCELLED', 'NO_SHOW'] } },
        _sum: { totalAmount: true, taxAmount: true, discountAmount: true },
      }),
      prisma.booking.groupBy({
        by: ['branchId'],
        where,
        _count: true,
        _sum: { totalAmount: true },
      }),
    ]);

    const branches = await prisma.branch.findMany({
      where: { id: { in: byBranch.map((b) => b.branchId) } },
      select: { id: true, name: true },
    });

    const branchStats = byBranch.map((b) => ({
      branchId: b.branchId,
      branchName: branches.find((br) => br.id === b.branchId)?.name || 'Unknown',
      totalBookings: b._count,
      totalRevenue: b._sum.totalAmount || 0,
    }));

    return {
      period: { startDate, endDate },
      totalBookings,
      revenue: {
        total: revenue._sum.totalAmount || 0,
        tax: revenue._sum.taxAmount || 0,
        discount: revenue._sum.discountAmount || 0,
      },
      statusBreakdown: statusCounts.reduce((acc: any, s) => {
        acc[s.status] = s._count;
        return acc;
      }, {}),
      branchStats,
    };
  }

  static async staffPayoutReport(query: any) {
    const startDate = query.startDate ? new Date(query.startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const endDate = query.endDate ? new Date(query.endDate) : new Date();

    const where: any = { createdAt: { gte: startDate, lte: endDate } };
    if (query.staffId) where.staffId = query.staffId;

    const earnings = await prisma.staffEarning.groupBy({
      by: ['staffId', 'payoutStatus'],
      where,
      _sum: { commissionAmount: true, baseAmount: true },
      _count: true,
    });

    const staffIds = [...new Set(earnings.map((e) => e.staffId))];
    const staff = await prisma.staff.findMany({
      where: { id: { in: staffIds } },
      include: { user: { include: { profile: true } }, branch: true },
    });

    const report = staff.map((s) => {
      const staffEarnings = earnings.filter((e) => e.staffId === s.id);
      const totalEarned = staffEarnings.reduce((sum, e) => sum + Number(e._sum.commissionAmount || 0), 0);
      const paidAmount = staffEarnings.filter((e) => e.payoutStatus === 'PAID').reduce((sum, e) => sum + Number(e._sum.commissionAmount || 0), 0);
      const pendingAmount = staffEarnings.filter((e) => e.payoutStatus === 'PENDING').reduce((sum, e) => sum + Number(e._sum.commissionAmount || 0), 0);
      const totalBookings = staffEarnings.reduce((sum, e) => sum + e._count, 0);

      return {
        staffId: s.id,
        staffName: `${s.user.profile?.firstName} ${s.user.profile?.lastName}`,
        employeeCode: s.employeeCode,
        branch: s.branch.name,
        totalBookings,
        totalEarned,
        paidAmount,
        pendingAmount,
      };
    });

    return {
      period: { startDate, endDate },
      report,
      summary: {
        totalStaff: staff.length,
        totalEarnings: report.reduce((sum, r) => sum + r.totalEarned, 0),
        totalPaid: report.reduce((sum, r) => sum + r.paidAmount, 0),
        totalPending: report.reduce((sum, r) => sum + r.pendingAmount, 0),
      },
    };
  }

  static async productSalesReport(query: any) {
    const startDate = query.startDate
      ? new Date(query.startDate)
      : new Date(new Date().setDate(new Date().getDate() - 30));
    const endDate = query.endDate ? new Date(query.endDate) : new Date();

    const where: any = {
      createdAt: { gte: startDate, lte: endDate },
      voidedAt: null,
    };
    if (query.branchId) where.branchId = query.branchId;

    const [totals, byProduct, byStaff, expiringCount, lowStockCount] = await Promise.all([
      prisma.productSale.aggregate({
        where,
        _sum: { totalAmount: true, subtotal: true, discountAmount: true },
        _count: true,
      }),
      prisma.productSaleItem.groupBy({
        by: ['productId'],
        where: { sale: where },
        _sum: { quantity: true, subtotal: true },
        _count: true,
        orderBy: { _sum: { subtotal: 'desc' } },
        take: 10,
      }),
      prisma.productSale.groupBy({
        by: ['staffId'],
        where: { ...where, staffId: { not: null } },
        _sum: { totalAmount: true },
        _count: true,
      }),
      prisma.product.count({
        where: {
          isActive: true,
          expiryDate: { not: null, lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
          ...(query.branchId && { branchId: query.branchId }),
        },
      }),
      prisma.product.count({
        where: {
          isActive: true,
          ...(query.branchId && { branchId: query.branchId }),
        },
      }),
    ]);

    const productIds = byProduct.map((p) => p.productId);
    const staffIds = byStaff.map((s) => s.staffId).filter(Boolean) as string[];
    const [productMeta, staffMeta] = await Promise.all([
      prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true, brand: true },
      }),
      prisma.staff.findMany({
        where: { id: { in: staffIds } },
        include: { user: { include: { profile: true } } },
      }),
    ]);

    return {
      period: { startDate, endDate },
      summary: {
        totalSales: totals._count,
        totalRevenue: totals._sum.totalAmount || 0,
        totalDiscount: totals._sum.discountAmount || 0,
        expiringSoonCount: expiringCount,
        activeProductsCount: lowStockCount,
      },
      topProducts: byProduct.map((p) => {
        const m = productMeta.find((x) => x.id === p.productId);
        return {
          productId: p.productId,
          name: m?.name || 'Unknown',
          brand: m?.brand || null,
          quantitySold: p._sum.quantity || 0,
          revenue: p._sum.subtotal || 0,
          salesCount: p._count,
        };
      }),
      byStaff: byStaff.map((s) => {
        const st = staffMeta.find((x) => x.id === s.staffId);
        return {
          staffId: s.staffId,
          staffName: st ? `${st.user.profile?.firstName || ''} ${st.user.profile?.lastName || ''}`.trim() : 'Unknown',
          revenue: s._sum.totalAmount || 0,
          salesCount: s._count,
        };
      }),
    };
  }

  static async staffServiceReport(query: any) {
    const startDate = query.startDate ? new Date(query.startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const endDate = query.endDate ? new Date(query.endDate) : new Date();

    const where: any = { bookingDate: { gte: startDate, lte: endDate }, status: 'COMPLETED' };
    if (query.staffId) where.staffId = query.staffId;
    if (query.branchId) where.branchId = query.branchId;

    const byStaff = await prisma.booking.groupBy({
      by: ['staffId', 'serviceId'],
      where,
      _count: true,
      _sum: { totalAmount: true },
    });

    const [staffIds, serviceIds] = [
      [...new Set(byStaff.map((b) => b.staffId))],
      [...new Set(byStaff.map((b) => b.serviceId))],
    ];

    const [staff, services] = await Promise.all([
      prisma.staff.findMany({
        where: { id: { in: staffIds } },
        include: { user: { include: { profile: true } } },
      }),
      prisma.service.findMany({
        where: { id: { in: serviceIds } },
      }),
    ]);

    const report = byStaff.map((b) => {
      const s = staff.find((st) => st.id === b.staffId);
      const sv = services.find((ss) => ss.id === b.serviceId);
      return {
        staffId: b.staffId,
        staffName: `${s?.user.profile?.firstName || ''} ${s?.user.profile?.lastName || ''}`,
        serviceId: b.serviceId,
        serviceName: sv?.name || 'Unknown',
        totalBookings: b._count,
        totalRevenue: b._sum.totalAmount || 0,
      };
    });

    return {
      period: { startDate, endDate },
      report,
    };
  }
}
