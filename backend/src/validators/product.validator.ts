import { z } from 'zod';

const money = z.coerce.number().nonnegative();
const positiveInt = z.coerce.number().int().nonnegative();

const branchStockEntry = z.object({
  branchId: z.string().uuid(),
  stock: positiveInt.optional(),
  reorderLevel: positiveInt.optional(),
});

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1).max(80),
    icon: z.string().max(200).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1).max(80).optional(),
    icon: z.string().max(200).optional().nullable(),
    isActive: z.boolean().optional(),
  }),
});

export const createProductSchema = z.object({
  body: z.object({
    categoryId: z.string().uuid().optional().nullable(),
    name: z.string().min(1).max(200),
    sku: z.string().max(80).optional().nullable(),
    barcode: z.string().max(80).optional().nullable(),
    brand: z.string().max(120).optional().nullable(),
    description: z.string().max(2000).optional().nullable(),
    image: z.string().max(500).optional().nullable(),
    mrp: money,
    buyPrice: money,
    sellPrice: money,
    memberPrice: money.nullable().optional(),
    // Per-branch stock rows. Empty array = catalog-only, not stocked anywhere yet.
    branchStocks: z.array(branchStockEntry).optional(),
    expiryDate: z.string().optional().nullable(),
    isActive: z.boolean().optional(),
  }),
});

export const updateProductSchema = z.object({
  body: createProductSchema.shape.body.partial(),
});

export const createProductSaleSchema = z.object({
  body: z.object({
    branchId: z.string().uuid(),
    customerId: z.string().uuid().optional().nullable(),
    staffId: z.string().uuid().optional().nullable(),
    bookingId: z.string().uuid().optional().nullable(),
    items: z
      .array(
        z.object({
          productId: z.string().uuid(),
          quantity: z.coerce.number().int().positive(),
          // Optional override — otherwise product.sellPrice is used.
          unitPrice: money.optional(),
        })
      )
      .min(1, 'At least one item is required'),
    discountAmount: money.optional().default(0),
    taxAmount: money.optional().default(0),   // legacy — ignored when taxRate is set
    taxRate: z.coerce.number().min(0).max(100).optional(),
    paymentMethod: z.string().max(80).optional().nullable(),
    notes: z.string().max(500).optional().nullable(),
  }),
});

export const voidSaleSchema = z.object({
  body: z.object({
    reason: z.string().min(1).max(500),
  }),
});
