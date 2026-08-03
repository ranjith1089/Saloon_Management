import { z } from 'zod';

export const collectPaymentSchema = z.object({
  body: z.object({
    method: z.string().min(1).max(80),
    reference: z.string().max(120).optional().nullable(),
    amount: z.coerce.number().nonnegative().optional(),
    taxRate: z.coerce.number().min(0).max(100).optional(),
    alsoComplete: z.boolean().optional(),
  }),
});

export const quickSaleSchema = z.object({
  body: z.object({
    branchId: z.string().uuid(),
    serviceId: z.string().uuid(),
    staffId: z.string().uuid(),
    amount: z.coerce.number().nonnegative(),
    taxRate: z.coerce.number().min(0).max(100).optional(),
    paymentMethod: z.string().min(1).max(80),
    reference: z.string().max(120).optional().nullable(),
    // Either a registered customer OR a walk-in name is required. Both may be
    // present (walk-in with a known customer); the customer wins.
    customerId: z.string().uuid().optional().nullable(),
    walkInName: z.string().max(120).optional().nullable(),
    walkInPhone: z.string().max(30).optional().nullable(),
    notes: z.string().max(500).optional().nullable(),
  }).refine((b) => !!b.customerId || !!b.walkInName, {
    message: 'Either customerId or walkInName is required',
    path: ['walkInName'],
  }),
});
