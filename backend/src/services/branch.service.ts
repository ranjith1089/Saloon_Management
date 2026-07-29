import prisma from '../config/database';
import { NotFoundError } from '../utils/ApiError';

export class BranchService {
  static async create(data: any) {
    return prisma.branch.create({
      data,
      include: {
        city: {
          include: { state: { include: { country: true } } },
        },
      },
    });
  }

  static async findAll(query: any) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);
    const skip = (page - 1) * limit;
    const search = query.search || '';
    const status = query.status;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status !== undefined) {
      where.status = status === 'true';
    }

    const [branches, total] = await Promise.all([
      prisma.branch.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          city: {
            include: { state: true },
          },
          _count: {
            select: { staff: true, bookings: true },
          },
        },
      }),
      prisma.branch.count({ where }),
    ]);

    return { branches, total, page, limit };
  }

  static async findById(id: string) {
    const branch = await prisma.branch.findUnique({
      where: { id },
      include: {
        city: {
          include: { state: { include: { country: true } } },
        },
        services: {
          include: { service: { include: { category: true } } },
        },
        staff: {
          include: { user: { include: { profile: true } } },
        },
        _count: {
          select: { bookings: true },
        },
      },
    });

    if (!branch) {
      throw new NotFoundError('Branch not found');
    }

    return branch;
  }

  static async update(id: string, data: any) {
    await this.findById(id);
    return prisma.branch.update({
      where: { id },
      data,
      include: {
        city: {
          include: { state: { include: { country: true } } },
        },
      },
    });
  }

  static async delete(id: string) {
    await this.findById(id);
    return prisma.branch.delete({ where: { id } });
  }

  static async getStats(id: string) {
    const branch = await this.findById(id);
    const [totalBookings, completedBookings, totalRevenue, totalStaff] = await Promise.all([
      prisma.booking.count({ where: { branchId: id } }),
      prisma.booking.count({ where: { branchId: id, status: 'COMPLETED' } }),
      prisma.booking.aggregate({
        where: { branchId: id, paymentStatus: 'PAID' },
        _sum: { totalAmount: true },
      }),
      prisma.staff.count({ where: { branchId: id } }),
    ]);

    return {
      branch,
      stats: {
        totalBookings,
        completedBookings,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        totalStaff,
      },
    };
  }
}
