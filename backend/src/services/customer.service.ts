import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { NotFoundError, BadRequestError } from '../utils/ApiError';

export class CustomerService {
  static async create(data: any) {
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) throw new BadRequestError('Email already registered');

    const passwordHash = await bcrypt.hash(data.password || 'customer123', 10);

    const customer = await prisma.customer.create({
      data: {
        preferences: data.preferences,
        notes: data.notes,
        user: {
          create: {
            email: data.email,
            passwordHash,
            role: 'CUSTOMER',
            profile: {
              create: {
                firstName: data.firstName,
                lastName: data.lastName,
                phone: data.phone,
                gender: data.gender,
                avatar: data.avatar,
                dob: data.dob ? new Date(data.dob) : undefined,
                address: data.address,
                city: data.city,
                state: data.state,
                country: data.country,
                postcode: data.postcode,
              },
            },
          },
        },
      },
      include: {
        user: { include: { profile: true } },
      },
    });

    return customer;
  }

  static async findAll(query: any) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);
    const skip = (page - 1) * limit;
    const search = query.search || '';

    const where: any = {};
    if (search) {
      where.OR = [
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { profile: { firstName: { contains: search, mode: 'insensitive' } } } },
        { user: { profile: { lastName: { contains: search, mode: 'insensitive' } } } },
        { user: { profile: { phone: { contains: search } } } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { include: { profile: true } },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    return { customers, total, page, limit };
  }

  static async findById(id: string) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        user: {
          include: {
            profile: true,
            bookingsAsCustomer: {
              orderBy: { bookingDate: 'desc' },
              take: 10,
              include: {
                service: true,
                staff: { include: { user: { include: { profile: true } } } },
                branch: true,
              },
            },
          },
        },
      },
    });
    if (!customer) throw new NotFoundError('Customer not found');
    return customer;
  }

  static async update(id: string, data: any) {
    const customer = await this.findById(id);
    const { firstName, lastName, phone, gender, avatar, dob, address, city, state, country, postcode, ...customerData } = data;

    // Update customer data
    await prisma.customer.update({
      where: { id },
      data: {
        ...(customerData.preferences !== undefined && { preferences: customerData.preferences }),
        ...(customerData.notes !== undefined && { notes: customerData.notes }),
        ...(customerData.loyaltyPoints !== undefined && { loyaltyPoints: customerData.loyaltyPoints }),
      },
    });

    // Update profile
    if (firstName || lastName || phone || gender || avatar || dob || address || city || state || country || postcode) {
      await prisma.userProfile.update({
        where: { userId: customer.userId },
        data: {
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(phone && { phone }),
          ...(gender && { gender }),
          ...(avatar && { avatar }),
          ...(dob && { dob: new Date(dob) }),
          ...(address && { address }),
          ...(city && { city }),
          ...(state && { state }),
          ...(country && { country }),
          ...(postcode && { postcode }),
        },
      });
    }

    return this.findById(id);
  }

  static async delete(id: string) {
    const customer = await this.findById(id);
    return prisma.user.delete({ where: { id: customer.userId } });
  }

  static async getHistory(id: string) {
    const customer = await this.findById(id);
    const bookings = await prisma.booking.findMany({
      where: { customerId: customer.userId },
      orderBy: { bookingDate: 'desc' },
      include: {
        service: true,
        staff: { include: { user: { include: { profile: true } } } },
        branch: true,
      },
    });
    return { customer, bookings };
  }
}
