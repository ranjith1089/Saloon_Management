import prisma from '../config/database';
import { NotFoundError } from '../utils/ApiError';
import { InquiryStatus } from '@prisma/client';

export class InquiryService {
  static async create(data: any) {
    return prisma.inquiry.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        subject: data.subject || null,
        message: data.message,
        source: data.source || 'website',
      },
    });
  }

  static async findAll(query: any) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '25', 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status as InquiryStatus;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { subject: { contains: query.search, mode: 'insensitive' } },
        { message: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [inquiries, total, newCount] = await Promise.all([
      prisma.inquiry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.inquiry.count({ where }),
      prisma.inquiry.count({ where: { status: 'NEW' } }),
    ]);

    return { inquiries, total, page, limit, newCount };
  }

  static async findById(id: string) {
    const i = await prisma.inquiry.findUnique({ where: { id } });
    if (!i) throw new NotFoundError('Inquiry not found');
    return i;
  }

  static async update(id: string, data: any, respondedById?: string) {
    await this.findById(id);
    const patch: any = {};
    if (data.status !== undefined) patch.status = data.status;
    if (data.internalNote !== undefined) patch.internalNote = data.internalNote;

    // Auto-stamp responder + timestamp when the note or status changes.
    const isSubstantiveEdit = data.internalNote !== undefined || (data.status && data.status !== 'NEW');
    if (isSubstantiveEdit && respondedById) {
      patch.respondedById = respondedById;
      patch.respondedAt = new Date();
    }

    return prisma.inquiry.update({ where: { id }, data: patch });
  }

  static async delete(id: string) {
    await this.findById(id);
    return prisma.inquiry.delete({ where: { id } });
  }
}
