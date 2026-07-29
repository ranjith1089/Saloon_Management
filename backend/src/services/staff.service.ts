import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { NotFoundError, BadRequestError } from '../utils/ApiError';

export class StaffService {
  static async create(data: any) {
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) throw new BadRequestError('Email already registered');

    const passwordHash = await bcrypt.hash(data.password || 'staff123', 10);
    const employeeCode = data.employeeCode || `EMP${Date.now()}`;

    const staff = await prisma.staff.create({
      data: {
        employeeCode,
        branchId: data.branchId,
        designation: data.designation,
        salary: data.salary,
        commissionRate: data.commissionRate,
        bio: data.bio,
        experience: data.experience,
        isVerified: data.isVerified ?? false,
        user: {
          create: {
            email: data.email,
            passwordHash,
            role: 'STAFF',
            profile: {
              create: {
                firstName: data.firstName,
                lastName: data.lastName,
                phone: data.phone,
                gender: data.gender,
                avatar: data.avatar,
              },
            },
          },
        },
        ...(data.serviceIds && data.serviceIds.length > 0 && {
          services: {
            create: data.serviceIds.map((serviceId: string) => ({ serviceId })),
          },
        }),
      },
      include: {
        user: { include: { profile: true } },
        branch: true,
        services: { include: { service: true } },
      },
    });

    return staff;
  }

  static async findAll(query: any) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);
    const skip = (page - 1) * limit;
    const search = query.search || '';
    const branchId = query.branchId;
    const isVerified = query.isVerified;

    const where: any = {};
    if (branchId) where.branchId = branchId;
    if (isVerified !== undefined) where.isVerified = isVerified === 'true';
    if (search) {
      where.OR = [
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { profile: { firstName: { contains: search, mode: 'insensitive' } } } },
        { user: { profile: { lastName: { contains: search, mode: 'insensitive' } } } },
        { employeeCode: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [staff, total] = await Promise.all([
      prisma.staff.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { include: { profile: true } },
          branch: true,
          services: { include: { service: true } },
          _count: { select: { bookings: true } },
        },
      }),
      prisma.staff.count({ where }),
    ]);

    return { staff, total, page, limit };
  }

  static async findById(id: string) {
    const staff = await prisma.staff.findUnique({
      where: { id },
      include: {
        user: { include: { profile: true } },
        branch: { include: { city: true } },
        services: { include: { service: { include: { category: true } } } },
        schedules: true,
      },
    });
    if (!staff) throw new NotFoundError('Staff not found');
    return staff;
  }

  static async update(id: string, data: any) {
    await this.findById(id);
    const { firstName, lastName, phone, gender, avatar, serviceIds, ...staffData } = data;

    // Update staff data
    if (serviceIds !== undefined) {
      await prisma.staffService.deleteMany({ where: { staffId: id } });
      if (serviceIds.length > 0) {
        await prisma.staffService.createMany({
          data: serviceIds.map((serviceId: string) => ({ staffId: id, serviceId })),
        });
      }
    }

    const staff = await prisma.staff.update({
      where: { id },
      data: staffData,
      include: { user: { include: { profile: true } } },
    });

    // Update user profile
    if (firstName || lastName || phone || gender || avatar) {
      await prisma.userProfile.update({
        where: { userId: staff.userId },
        data: {
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(phone && { phone }),
          ...(gender && { gender }),
          ...(avatar && { avatar }),
        },
      });
    }

    return this.findById(id);
  }

  static async delete(id: string) {
    const staff = await this.findById(id);
    // Delete user (cascade deletes staff)
    return prisma.user.delete({ where: { id: staff.userId } });
  }

  static async verify(id: string) {
    await this.findById(id);
    return prisma.staff.update({
      where: { id },
      data: { isVerified: true },
      include: { user: { include: { profile: true } } },
    });
  }

  static async setSchedule(staffId: string, schedules: any[]) {
    await this.findById(staffId);
    await prisma.staffSchedule.deleteMany({ where: { staffId } });
    await prisma.staffSchedule.createMany({
      data: schedules.map((s: any) => ({
        staffId,
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        isOff: s.isOff ?? false,
      })),
    });
    return prisma.staffSchedule.findMany({ where: { staffId }, orderBy: { dayOfWeek: 'asc' } });
  }
}
