import { z } from 'zod';

const money = z.coerce.number().nonnegative();
const positiveInt = z.coerce.number().int().positive();

export const createPlanSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(120),
    description: z.string().max(500).optional().nullable(),
    price: money,
    durationDays: positiveInt,
    color: z.string().max(20).optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.coerce.number().int().optional(),
  }),
});

export const updatePlanSchema = z.object({
  body: createPlanSchema.shape.body.partial(),
});

export const createMembershipSchema = z.object({
  body: z.object({
    customerId: z.string().uuid(),
    planId: z.string().uuid(),
    startDate: z.string(),
    paidAmount: money,
    paymentMethod: z.string().max(80).optional().nullable(),
    notes: z.string().max(500).optional().nullable(),
  }),
});

export const updateMembershipSchema = z.object({
  body: z.object({
    paidAmount: money.optional(),
    paymentMethod: z.string().max(80).optional().nullable(),
    notes: z.string().max(500).optional().nullable(),
    endDate: z.string().optional(),
  }),
});
