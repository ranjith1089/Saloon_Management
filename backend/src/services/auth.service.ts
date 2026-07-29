import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { BadRequestError, UnauthorizedError, NotFoundError } from '../utils/ApiError';
import { RegisterInput, LoginInput } from '../validators/auth.validator';
import { UserRole } from '@prisma/client';

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

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        role,
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

    const tokens = await this.generateTokens(user.id, user.email, user.role);

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

    const tokens = await this.generateTokens(user.id, user.email, user.role);

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
      storedToken.user.role
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

  private static async generateTokens(userId: string, email: string, role: string) {
    const accessToken = generateAccessToken({ userId, email, role });
    const refreshToken = generateRefreshToken({ userId, email, role });

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
