import { z } from 'zod';

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Category name required'),
    description: z.string().optional(),
    icon: z.string().optional(),
    parentId: z.string().uuid().optional(),
    status: z.boolean().optional(),
  }),
});

export const createServiceSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Service name required'),
    description: z.string().optional(),
    price: z.number().positive('Price must be positive'),
    duration: z.number().int().positive('Duration must be positive integer (minutes)'),
    categoryId: z.string().uuid('Invalid category ID'),
    image: z.string().optional(),
    status: z.boolean().optional(),
    branchIds: z.array(z.string().uuid()).optional(),
  }),
});

export const updateServiceSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    price: z.number().positive().optional(),
    duration: z.number().int().positive().optional(),
    categoryId: z.string().uuid().optional(),
    image: z.string().optional(),
    status: z.boolean().optional(),
    branchIds: z.array(z.string().uuid()).optional(),
  }),
});
