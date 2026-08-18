import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { BadRequestError, UnauthorizedError, NotFoundError } from '../utils/ApiError';
import { RegisterInput, LoginInput, UpdateProfileInput } from '../validators/auth.validator';
import { UserRole } from '@prisma/client';
import { ReferralService } from './referral.service';

export class AuthService {
  static async register(data: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new BadRequestError('Email already registered');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const role = (data.role as UserRole) || 'CUSTOMER';

    // Multi-tenancy (Ship 1A):
    //  - CUSTOMER signups are attached to the Default Organization so they
    //    can book at any salon. Ship 2 will let customers pick their salon.
    //  - Every other role starts a fresh Organization owned by them. In
    //    Ship 2 this becomes a proper onboarding wizard (salon name, city,
    //    plan choice). For now we auto-generate name + slug from email.
    let organizationId: string;
    if (role === 'CUSTOMER') {
      organizationId = '00000000-0000-0000-0000-000000000001';
    } else {
      const emailLocal = data.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'salon';
      // Suffix a few random chars so two people with the same email prefix don't collide
      const slug = `${emailLocal}-${Math.random().toString(36).slice(2, 6)}`;
      const orgName = `${data.firstName || 'My'}'s Salon`;
      const org = await prisma.organization.create({
        data: {
          slug,
          name: orgName,
          plan: 'TRIAL',
          status: 'ACTIVE',
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),   // 14-day trial
        },
      });
      organizationId = org.id;
    }

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        role,
        organizationId,
        profile: {
          create: {
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
          },
        },
        // Auto-create customer profile if role is CUSTOMER
        ...(role === 'CUSTOMER' && {
          customer: { create: {} },
        }),
      },
      include: {
        profile: true,
      },
    });

    // Link the new org's ownerUserId back to the creator (skip for customers,
    // who don't own their org — they're attached to the Default Organization).
    if (role !== 'CUSTOMER') {
      await prisma.organization.update({
        where: { id: organizationId },
        data:  { ownerUserId: user.id },
      });
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role, organizationId);

    // Track referral (if signup carried a ?ref=CODE). Best-effort — a bad
    // code shouldn't block registration.
    if ((data as any).referralCode && role === 'CUSTOMER') {
      try {
        await ReferralService.trackFromCode((data as any).referralCode, user.id);
      } catch (err) {
        console.error('Referral tracking failed:', err);
      }
    }

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  static async login(data: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: { profile: true },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedError(`Account is ${user.status.toLowerCase()}`);
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role, user.organizationId);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  static async refreshToken(refreshToken: string) {
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: { include: { profile: true } } },
    });

    if (!storedToken) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    if (storedToken.expiresAt < new Date()) {
      await prisma.refreshToken.delete({ where: { id: storedToken.id } });
      throw new UnauthorizedError('Refresh token expired');
    }

    try {
      verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Delete old refresh token
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });

    const tokens = await this.generateTokens(
      storedToken.user.id,
      storedToken.user.email,
      storedToken.user.role,
      storedToken.user.organizationId,
    );

    return {
      user: this.sanitizeUser(storedToken.user),
      ...tokens,
    };
  }

  static async logout(userId: string, refreshToken: string) {
    await prisma.refreshToken.deleteMany({
      where: {
        userId,
        token: refreshToken,
      },
    });
  }

  static async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new BadRequestError('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Invalidate all refresh tokens
    await prisma.refreshToken.deleteMany({ where: { userId } });
  }

  static async updateProfile(userId: string, data: UpdateProfileInput) {
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { profile: true } });
    if (!user) throw new NotFoundError('User not found');

    const { dob, ...rest } = data;
    const profileData: any = { ...rest };
    if (dob !== undefined) profileData.dob = dob ? new Date(dob) : null;

    await prisma.userProfile.upsert({
      where: { userId },
      update: profileData,
      create: {
        userId,
        firstName: profileData.firstName || user.profile?.firstName || '',
        lastName: profileData.lastName || user.profile?.lastName || '',
        ...profileData,
      },
    });

    return this.getMe(userId);
  }

  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        staff: {
          include: { branch: true },
        },
        customer: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return this.sanitizeUser(user);
  }

  private static async generateTokens(
    userId: string,
    email: string,
    role: string,
    organizationId: string | null | undefined,
  ) {
    const payload = { userId, email, role, organizationId: organizationId ?? null };
    const accessToken  = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Store refresh token in DB
    await prisma.refreshToken.create({
      data: {
        userId,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    return { accessToken, refreshToken };
  }

  private static sanitizeUser(user: any) {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }
}
