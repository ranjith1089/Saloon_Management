import { z } from 'zod';

export const createBranchSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Branch name must be at least 2 characters'),
    description: z.string().optional(),
    address: z.string().min(5, 'Address is required'),
    cityId: z.string().uuid('Invalid city ID'),
    phone: z.string().min(10, 'Valid phone number required'),
    email: z.string().email('Invalid email'),
    logo: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    openTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)').optional(),
    closeTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)').optional(),
    status: z.boolean().optional(),
  }),
});

export const updateBranchSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    address: z.string().min(5).optional(),
    cityId: z.string().uuid().optional(),
    phone: z.string().min(10).optional(),
    email: z.string().email().optional(),
    logo: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    openTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    closeTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    status: z.boolean().optional(),
  }),
});
