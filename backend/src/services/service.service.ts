import prisma from '../config/database';
import { NotFoundError } from '../utils/ApiError';

export class ServiceCategoryService {
  static async create(data: any) {
    return prisma.serviceCategory.create({ data });
  }

  static async findAll() {
    return prisma.serviceCategory.findMany({
      include: {
        children: true,
        _count: { select: { services: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  static async findById(id: string) {
    const category = await prisma.serviceCategory.findUnique({
      where: { id },
      include: { children: true, services: true },
    });
    if (!category) throw new NotFoundError('Category not found');
    return category;
  }

  static async update(id: string, data: any) {
    await this.findById(id);
    return prisma.serviceCategory.update({ where: { id }, data });
  }

  static async delete(id: string) {
    await this.findById(id);
    return prisma.serviceCategory.delete({ where: { id } });
  }
}

export class ServiceService {
  static async create(data: any) {
    const { branchIds, ...serviceData } = data;

    const service = await prisma.service.create({
      data: {
        ...serviceData,
        ...(branchIds && branchIds.length > 0 && {
          branches: {
            create: branchIds.map((branchId: string) => ({ branchId })),
          },
        }),
      },
      include: {
        category: true,
        branches: { include: { branch: true } },
      },
    });

    return service;
  }

  static async findAll(query: any) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);
    const skip = (page - 1) * limit;
    const search = query.search || '';
    const categoryId = query.categoryId;
    const branchId = query.branchId;
    const status = query.status;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (categoryId) where.categoryId = categoryId;
    if (status !== undefined) where.status = status === 'true';
    if (branchId) {
      where.branches = { some: { branchId } };
    }

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: { include: { parent: true } },
          branches: { include: { branch: true } },
          _count: { select: { staff: true, bookings: true } },
        },
      }),
      prisma.service.count({ where }),
    ]);

    return { services, total, page, limit };
  }

  static async findById(id: string) {
    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        category: { include: { parent: true } },
        branches: { include: { branch: true } },
        staff: { include: { staff: { include: { user: { include: { profile: true } } } } } },
      },
    });
    if (!service) throw new NotFoundError('Service not found');
    return service;
  }

  static async update(id: string, data: any) {
    await this.findById(id);
    const { branchIds, ...serviceData } = data;

    if (branchIds !== undefined) {
      // Reset branch associations
      await prisma.branchService.deleteMany({ where: { serviceId: id } });
      if (branchIds.length > 0) {
        await prisma.branchService.createMany({
          data: branchIds.map((branchId: string) => ({ branchId, serviceId: id })),
        });
      }
    }

    return prisma.service.update({
      where: { id },
      data: serviceData,
      include: {
        category: true,
        branches: { include: { branch: true } },
      },
    });
  }

  static async delete(id: string) {
    await this.findById(id);
    return prisma.service.delete({ where: { id } });
  }
}
