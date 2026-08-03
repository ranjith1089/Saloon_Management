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
