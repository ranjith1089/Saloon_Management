import { z } from 'zod';

export const createInquirySchema = z.object({
  body: z.object({
    name: z.string().min(1).max(120),
    email: z.string().email(),
    phone: z.string().max(30).optional().nullable(),
    subject: z.string().max(200).optional().nullable(),
    message: z.string().min(1).max(4000),
    source: z.string().max(40).optional().nullable(),
  }),
});

export const updateInquirySchema = z.object({
  body: z.object({
    status: z.enum(['NEW', 'IN_PROGRESS', 'RESOLVED', 'SPAM']).optional(),
    internalNote: z.string().max(4000).optional().nullable(),
  }),
});
