import prisma from '../config/database';
import { NotFoundError, BadRequestError } from '../utils/ApiError';

export class ReviewService {
  static async create(customerId: string, data: any) {
    const booking = await prisma.booking.findUnique({ where: { id: data.bookingId } });
    if (!booking) throw new NotFoundError('Booking not found');
    if (booking.customerId !== customerId) throw new BadRequestError('You can only review your own bookings');
    if (booking.status !== 'COMPLETED') throw new BadRequestError('Booking must be completed to review');

    const existing = await prisma.review.findUnique({ where: { bookingId: data.bookingId } });
    if (existing) throw new BadRequestError('Review already exists for this booking');

    if (data.rating < 1 || data.rating > 5) throw new BadRequestError('Rating must be between 1 and 5');

    return prisma.review.create({
      data: {
        bookingId: data.bookingId,
        customerId,
        staffId: booking.staffId,
        serviceId: booking.serviceId,
        rating: data.rating,
        comment: data.comment,
      },
      include: {
        booking: {
          include: {
            service: true,
            staff: { include: { user: { include: { profile: true } } } },
            customer: { include: { profile: true } },
          },
        },
      },
    });
  }

  static async findAll(query: any) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.staffId) where.staffId = query.staffId;
    if (query.serviceId) where.serviceId = query.serviceId;
    if (query.rating) where.rating = parseInt(query.rating, 10);
    if (query.isApproved !== undefined) where.isApproved = query.isApproved === 'true';

    const [reviews, total, avg] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          booking: {
            include: {
              service: true,
              staff: { include: { user: { include: { profile: true } } } },
              customer: { include: { profile: true } },
            },
          },
        },
      }),
      prisma.review.count({ where }),
      prisma.review.aggregate({ where, _avg: { rating: true } }),
    ]);

    return {
      reviews,
      total,
      page,
      limit,
      averageRating: avg._avg.rating || 0,
    };
  }

  static async findById(id: string) {
    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            service: true,
            staff: { include: { user: { include: { profile: true } } } },
            customer: { include: { profile: true } },
          },
        },
      },
    });
    if (!review) throw new NotFoundError('Review not found');
    return review;
  }

  static async update(id: string, data: any) {
    await this.findById(id);
    return prisma.review.update({
      where: { id },
      data: {
        ...(data.rating && { rating: data.rating }),
        ...(data.comment !== undefined && { comment: data.comment }),
        ...(data.isApproved !== undefined && { isApproved: data.isApproved }),
      },
    });
  }

  static async delete(id: string) {
    await this.findById(id);
    return prisma.review.delete({ where: { id } });
  }

  static async getStaffRating(staffId: string) {
    const [avg, distribution, total] = await Promise.all([
      prisma.review.aggregate({
        where: { staffId, isApproved: true },
        _avg: { rating: true },
      }),
      prisma.review.groupBy({
        by: ['rating'],
        where: { staffId, isApproved: true },
        _count: true,
      }),
      prisma.review.count({ where: { staffId, isApproved: true } }),
    ]);

    return {
      averageRating: avg._avg.rating || 0,
      totalReviews: total,
      distribution: distribution.reduce((acc: any, d) => {
        acc[d.rating] = d._count;
        return acc;
      }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }),
    };
  }
}
