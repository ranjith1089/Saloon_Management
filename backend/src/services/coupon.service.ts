import prisma from '../config/database';
import { NotFoundError, BadRequestError } from '../utils/ApiError';

export class CouponService {
  static async create(data: any) {
    const existing = await prisma.coupon.findUnique({ where: { code: data.code.toUpperCase() } });
    if (existing) throw new BadRequestError('Coupon code already exists');

    return prisma.coupon.create({
      data: {
        ...data,
        code: data.code.toUpperCase(),
        validFrom: new Date(data.validFrom),
        validTo: new Date(data.validTo),
      },
    });
  }

  static async findAll(query: any) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.isActive !== undefined) where.isActive = query.isActive === 'true';
    if (query.search) {
      where.OR = [
        { code: { contains: query.search, mode: 'insensitive' } },
        { name: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [coupons, total] = await Promise.all([
      prisma.coupon.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.coupon.count({ where }),
    ]);

    return { coupons, total, page, limit };
  }

  static async findById(id: string) {
    const coupon = await prisma.coupon.findUnique({
      where: { id },
      include: { _count: { select: { bookings: true } } },
    });
    if (!coupon) throw new NotFoundError('Coupon not found');
    return coupon;
  }

  static async findByCode(code: string) {
    return prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
  }

  static async validate(code: string, orderAmount: number, userId?: string) {
    const coupon = await this.findByCode(code);

    if (!coupon) throw new NotFoundError('Coupon not found');
    if (!coupon.isActive) throw new BadRequestError('Coupon is inactive');

    const now = new Date();
    if (now < coupon.validFrom) throw new BadRequestError('Coupon is not yet valid');
    if (now > coupon.validTo) throw new BadRequestError('Coupon has expired');

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      throw new BadRequestError('Coupon usage limit reached');
    }

    if (coupon.minOrderAmount && orderAmount < Number(coupon.minOrderAmount)) {
      throw new BadRequestError(`Minimum order amount is ${coupon.minOrderAmount}`);
    }

    if (coupon.perUserLimit && userId) {
      const userUsage = await prisma.booking.count({
        where: { couponId: coupon.id, customerId: userId },
      });
      if (userUsage >= coupon.perUserLimit) {
        throw new BadRequestError('You have reached the usage limit for this coupon');
      }
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = (orderAmount * Number(coupon.discountValue)) / 100;
      if (coupon.maxDiscount && discountAmount > Number(coupon.maxDiscount)) {
        discountAmount = Number(coupon.maxDiscount);
      }
    } else {
      discountAmount = Number(coupon.discountValue);
    }

    return { coupon, discountAmount };
  }

  static async update(id: string, data: any) {
    await this.findById(id);
    const updateData: any = { ...data };
    if (data.code) updateData.code = data.code.toUpperCase();
    if (data.validFrom) updateData.validFrom = new Date(data.validFrom);
    if (data.validTo) updateData.validTo = new Date(data.validTo);
    return prisma.coupon.update({ where: { id }, data: updateData });
  }

  static async delete(id: string) {
    await this.findById(id);
    return prisma.coupon.delete({ where: { id } });
  }

  static async incrementUsage(id: string) {
    return prisma.coupon.update({
      where: { id },
      data: { usageCount: { increment: 1 } },
    });
  }
}
