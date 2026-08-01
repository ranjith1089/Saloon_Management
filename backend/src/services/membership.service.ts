import prisma from '../config/database';
import { NotFoundError, BadRequestError } from '../utils/ApiError';

// ============ PLANS ============
export class MembershipPlanService {
  static async create(data: any) {
    return prisma.membershipPlan.create({ data });
  }

  static async findAll(query: any = {}) {
    const where: any = {};
    if (query.isActive !== undefined) where.isActive = query.isActive === 'true';
    return prisma.membershipPlan.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { price: 'asc' }],
      include: { _count: { select: { memberships: true } } },
    });
  }

  static async findById(id: string) {
    const p = await prisma.membershipPlan.findUnique({ where: { id } });
    if (!p) throw new NotFoundError('Plan not found');
    return p;
  }

  static async update(id: string, data: any) {
    await this.findById(id);
    return prisma.membershipPlan.update({ where: { id }, data });
  }

  static async delete(id: string) {
    await this.findById(id);
    // Soft-delete so historical memberships stay linked.
    return prisma.membershipPlan.update({ where: { id }, data: { isActive: false } });
  }
}

// ============ MEMBERSHIPS ============
export class MembershipService {
  static async create(data: any) {
    const plan = await prisma.membershipPlan.findUnique({ where: { id: data.planId } });
    if (!plan) throw new NotFoundError('Plan not found');
    if (!plan.isActive) throw new BadRequestError('Plan is inactive');

    const startDate = new Date(data.startDate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.durationDays);

    return prisma.membership.create({
      data: {
        customerId: data.customerId,
        planId: data.planId,
        startDate,
        endDate,
        paidAmount: data.paidAmount,
        paymentMethod: data.paymentMethod || null,
        notes: data.notes || null,
      },
      include: {
        plan: true,
        customer: { include: { profile: true } },
      },
    });
  }

  static async findAll(query: any) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '20', 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.customerId) where.customerId = query.customerId;
    if (query.planId) where.planId = query.planId;

    // "active" filter takes both status = ACTIVE and endDate > now.
    if (query.active === 'true') {
      where.status = 'ACTIVE';
      where.endDate = { gt: new Date() };
    } else if (query.active === 'false') {
      where.OR = [{ status: { not: 'ACTIVE' } }, { endDate: { lte: new Date() } }];
    }

    const [memberships, total, paidAgg] = await Promise.all([
      prisma.membership.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          plan: true,
          customer: { include: { profile: true } },
        },
      }),
      prisma.membership.count({ where }),
      prisma.membership.aggregate({ where, _sum: { paidAmount: true } }),
    ]);

    return { memberships, total, page, limit, totalRevenue: Number(paidAgg._sum.paidAmount || 0) };
  }

  static async findById(id: string) {
    const m = await prisma.membership.findUnique({
      where: { id },
      include: { plan: true, customer: { include: { profile: true } } },
    });
    if (!m) throw new NotFoundError('Membership not found');
    return m;
  }

  static async update(id: string, data: any) {
    await this.findById(id);
    const updateData: any = { ...data };
    if (data.endDate) updateData.endDate = new Date(data.endDate);
    return prisma.membership.update({
      where: { id },
      data: updateData,
      include: { plan: true, customer: { include: { profile: true } } },
    });
  }

  static async cancel(id: string) {
    await this.findById(id);
    return prisma.membership.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: { plan: true, customer: { include: { profile: true } } },
    });
  }

  /**
   * Returns the currently-active membership for a customer, or null.
   * "Active" means status = ACTIVE AND endDate > now.
   */
  static async getActiveForCustomer(customerId: string) {
    if (!customerId) return null;
    return prisma.membership.findFirst({
      where: {
        customerId,
        status: 'ACTIVE',
        endDate: { gt: new Date() },
      },
      orderBy: { endDate: 'desc' },
      include: { plan: true },
    });
  }
}
