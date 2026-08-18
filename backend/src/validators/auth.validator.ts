import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    phone: z.string().optional(),
    role: z.enum(['OWNER', 'ADMIN', 'MANAGER', 'STAFF', 'CUSTOMER']).optional(),
    referralCode: z.string().max(20).optional(),
    // Ship 2 — salon owner signup carries salon details for the new
    // Organization that gets created. All optional so existing register
    // flow still works.
    salonName: z.string().min(2).max(100).optional(),
    country:   z.string().length(2).optional(),   // ISO 3166-1 alpha-2
    currency:  z.string().length(3).optional(),   // ISO 4217
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    firstName: z.string().min(1).max(80).optional(),
    lastName: z.string().min(1).max(80).optional(),
    phone: z.string().max(30).optional().nullable(),
    avatar: z.string().url().max(500).optional().nullable(),
    dob: z.string().optional().nullable(),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional().nullable(),
    address: z.string().max(255).optional().nullable(),
    city: z.string().max(80).optional().nullable(),
    state: z.string().max(80).optional().nullable(),
    country: z.string().max(80).optional().nullable(),
    postcode: z.string().max(20).optional().nullable(),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>['body'];
