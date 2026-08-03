import prisma from '../config/database';
import { NotFoundError, BadRequestError, ConflictError } from '../utils/ApiError';
import { Prisma } from '@prisma/client';
import { MembershipService } from './membership.service';

// ============ CATEGORY ============
export class ProductCategoryService {
  static async create(data: any) {
    return prisma.productCategory.create({ data });
  }

  static async findAll() {
    return prisma.productCategory.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    });
  }

  static async findById(id: string) {
    const c = await prisma.productCategory.findUnique({ where: { id } });
    if (!c) throw new NotFoundError('Category not found');
    return c;
  }

  static async update(id: string, data: any) {
    await this.findById(id);
    return prisma.productCategory.update({ where: { id }, data });
  }

  static async delete(id: string) {
    await this.findById(id);
    return prisma.productCategory.delete({ where: { id } });
  }
}

// ============ PRODUCT ============
const PRODUCT_INCLUDE = {
  category: true,
  branchStocks: { include: { branch: { select: { id: true, name: true } } } },
} as const;

type BranchStockInput = { branchId: string; stock?: number; reorderLevel?: number };

/**
 * Enrich a product row with two helper fields for the client:
 *  - totalStock: sum of stock across all branches
 *  - stock (only when the query narrowed to a single branch): the count at
 *    that branch, so the existing UI can read `product.stock` unchanged.
 */
function enrich(product: any, branchScopeId?: string) {
  if (!product) return product;
  const stocks = product.branchStocks || [];
  const total = stocks.reduce((s: number, x: any) => s + (x.stock || 0), 0);
  const scoped = branchScopeId ? stocks.find((x: any) => x.branchId === branchScopeId) : null;
  return {
    ...product,
    totalStock: total,
    stock: scoped ? scoped.stock : total,
    reorderLevel: scoped ? scoped.reorderLevel : undefined,
    branchId: scoped ? scoped.branchId : undefined,
    branch: scoped ? { id: scoped.branchId, name: scoped.branch?.name } : undefined,
  };
}

export class ProductService {
  static async create(data: any) {
    const { branchStocks = [], expiryDate, ...rest } = data;
    const created = await prisma.product.create({
      data: {
        ...rest,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        branchStocks: branchStocks.length
          ? { create: (branchStocks as BranchStockInput[]).map((b) => ({
              branchId: b.branchId,
              stock: Number(b.stock ?? 0),
              reorderLevel: Number(b.reorderLevel ?? 5),
            })) }
          : undefined,
      },
      include: PRODUCT_INCLUDE,
    });
    return enrich(created);
  }

  static async findAll(query: any) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '20', 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.isActive !== undefined) where.isActive = query.isActive === 'true';
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { brand: { contains: query.search, mode: 'insensitive' } },
        { sku: { contains: query.search, mode: 'insensitive' } },
        { barcode: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    // Branch filter: only products stocked at that branch.
    if (query.branchId) {
      where.branchStocks = { some: { branchId: query.branchId } };
    }
    if (query.expiringInDays) {
      const days = parseInt(query.expiringInDays, 10);
      const until = new Date();
      until.setDate(until.getDate() + days);
      where.expiryDate = { not: null, lte: until };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: PRODUCT_INCLUDE,
      }),
      prisma.product.count({ where }),
    ]);
    return {
      products: products.map((p) => enrich(p, query.branchId)),
      total,
      page,
      limit,
    };
  }

  static async findById(id: string) {
    const p = await prisma.product.findUnique({ where: { id }, include: PRODUCT_INCLUDE });
    if (!p) throw new NotFoundError('Product not found');
    return enrich(p);
  }

  static async update(id: string, data: any) {
    await this.findById(id);
    const { branchStocks, expiryDate, ...rest } = data;

    return prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: {
          ...rest,
          ...(expiryDate !== undefined && {
            expiryDate: expiryDate ? new Date(expiryDate) : null,
          }),
        },
      });

      // branchStocks is authoritative when provided — matches the "stocked at
      // exactly these branches" mental model. Omit the field entirely to leave
      // branchStocks untouched.
      if (Array.isArray(branchStocks)) {
        const desiredIds = new Set((branchStocks as BranchStockInput[]).map((b) => b.branchId));
        const existing = await tx.productBranchStock.findMany({ where: { productId: id } });

        // Remove rows for branches no longer selected.
        for (const row of existing) {
          if (!desiredIds.has(row.branchId)) {
            await tx.productBranchStock.delete({ where: { id: row.id } });
          }
        }
        // Upsert desired rows.
        for (const b of branchStocks as BranchStockInput[]) {
          await tx.productBranchStock.upsert({
            where: { productId_branchId: { productId: id, branchId: b.branchId } },
            update: {
              stock: Number(b.stock ?? 0),
              reorderLevel: Number(b.reorderLevel ?? 5),
            },
            create: {
              productId: id,
              branchId: b.branchId,
              stock: Number(b.stock ?? 0),
              reorderLevel: Number(b.reorderLevel ?? 5),
            },
          });
        }
      }

      const fresh = await tx.product.findUnique({ where: { id }, include: PRODUCT_INCLUDE });
      return enrich(fresh);
    });
  }

  static async delete(id: string) {
    await this.findById(id);
    // Soft-delete so historical sale line items remain valid.
    const updated = await prisma.product.update({
      where: { id },
      data: { isActive: false },
      include: PRODUCT_INCLUDE,
    });
    return enrich(updated);
  }

  static async getLowStock(query: any) {
    const where: any = {
      product: { isActive: true },
    };
    if (query.branchId) where.branchId = query.branchId;

    const rows = await prisma.productBranchStock.findMany({
      where,
      include: {
        branch: { select: { id: true, name: true } },
        product: { include: { category: true } },
      },
      orderBy: { stock: 'asc' },
    });
    return rows.filter((r) => r.stock <= r.reorderLevel).map((r) => ({
      ...r.product,
      branch: r.branch,
      branchId: r.branchId,
      stock: r.stock,
      reorderLevel: r.reorderLevel,
    }));
  }

  static async getExpiring(query: any) {
    const days = parseInt(query.days || '30', 10);
    const until = new Date();
    until.setDate(until.getDate() + days);
    const where: any = {
      isActive: true,
      expiryDate: { not: null, lte: until },
    };
    // Restricting to a branch simply requires the product be stocked there.
    if (query.branchId) where.branchStocks = { some: { branchId: query.branchId } };

    const rows = await prisma.product.findMany({
      where,
      include: PRODUCT_INCLUDE,
      orderBy: { expiryDate: 'asc' },
    });
    return rows.map((p) => enrich(p, query.branchId));
  }
}

// ============ PRODUCT SALE ============
export class ProductSaleService {
  static async create(data: any) {
    const saleNumber = `PS${Date.now()}${Math.floor(Math.random() * 1000)}`;

    const activeMembership = data.customerId
      ? await MembershipService.getActiveForCustomer(data.customerId)
      : null;
    const applyMemberPrice = !!activeMembership;

    return prisma.$transaction(
      async (tx) => {
        const productIds = data.items.map((i: any) => i.productId);
        // Product row for name/price and the stock row at the sale's branch.
        const [products, stocks] = await Promise.all([
          tx.product.findMany({ where: { id: { in: productIds } } }),
          tx.productBranchStock.findMany({
            where: { productId: { in: productIds }, branchId: data.branchId },
          }),
        ]);
        const productById = new Map(products.map((p) => [p.id, p]));
        const stockKey = (pid: string) => `${pid}:${data.branchId}`;
        const stockByKey = new Map(stocks.map((s) => [stockKey(s.productId), s]));

        let subtotal = 0;
        const decrementedItems: Array<{
          productId: string;
          quantity: number;
          unitPrice: number;
          subtotal: number;
        }> = [];

        for (const item of data.items) {
          const p = productById.get(item.productId);
          if (!p) throw new NotFoundError(`Product ${item.productId} not found`);
          if (!p.isActive) throw new BadRequestError(`Product "${p.name}" is inactive`);
          const s = stockByKey.get(stockKey(item.productId));
          if (!s) throw new BadRequestError(`Product "${p.name}" is not stocked at the selected branch`);
          if (s.stock < item.quantity) {
            throw new ConflictError(`Insufficient stock for "${p.name}" (available: ${s.stock}, requested: ${item.quantity})`);
          }
          const memberEligible = applyMemberPrice && p.memberPrice !== null && p.memberPrice !== undefined;
          const defaultUnitPrice = memberEligible ? Number(p.memberPrice) : Number(p.sellPrice);
          const unitPrice = item.unitPrice ?? defaultUnitPrice;
          const lineSubtotal = unitPrice * item.quantity;
          subtotal += lineSubtotal;
          decrementedItems.push({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice,
            subtotal: lineSubtotal,
          });
        }

        const discountAmount = Number(data.discountAmount || 0);
        const taxRate = Number(data.taxRate || 0);
        const taxableBase = Math.max(0, subtotal - discountAmount);
        const taxAmount = taxRate > 0 ? Math.round((taxableBase * taxRate) / 100 * 100) / 100 : 0;
        const totalAmount = Math.max(0, taxableBase + taxAmount);

        // Decrement stock at the branch's join row.
        for (const item of decrementedItems) {
          await tx.productBranchStock.update({
            where: { productId_branchId: { productId: item.productId, branchId: data.branchId } },
            data: { stock: { decrement: item.quantity } },
          });
        }

        const sale = await tx.productSale.create({
          data: {
            saleNumber,
            branchId: data.branchId,
            customerId: data.customerId || null,
            staffId: data.staffId || null,
            bookingId: data.bookingId || null,
            subtotal,
            discountAmount,
            taxAmount,
            totalAmount,
            paymentMethod: data.paymentMethod || null,
            notes: data.notes || null,
            items: { create: decrementedItems },
          },
          include: {
            items: { include: { product: true } },
            branch: true,
            customer: { include: { profile: true } },
            staff: { include: { user: { include: { profile: true } } } },
          },
        });

        if (data.staffId) {
          const staff = await tx.staff.findUnique({ where: { id: data.staffId } });
          if (staff) {
            const commissionRate = Number(staff.commissionRate || 0);
            const commissionAmount = (totalAmount * commissionRate) / 100;
            if (commissionAmount > 0) {
              await tx.staffEarning.create({
                data: {
                  staffId: data.staffId,
                  productSaleId: sale.id,
                  baseAmount: totalAmount,
                  commissionRate,
                  commissionAmount,
                },
              });
            }
          }
        }

        return sale;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
  }

  static async findAll(query: any) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '20', 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.branchId) where.branchId = query.branchId;
    if (query.staffId) where.staffId = query.staffId;
    if (query.customerId) where.customerId = query.customerId;
    if (query.startDate && query.endDate) {
      where.createdAt = { gte: new Date(query.startDate), lte: new Date(query.endDate) };
    } else if (query.date) {
      const d = new Date(query.date);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      where.createdAt = { gte: d, lt: next };
    }
    if (query.voided === 'true') where.voidedAt = { not: null };
    else if (query.voided === 'false') where.voidedAt = null;

    const [sales, total, revenueAgg] = await Promise.all([
      prisma.productSale.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: { include: { product: true } },
          branch: true,
          customer: { include: { profile: true } },
          staff: { include: { user: { include: { profile: true } } } },
        },
      }),
      prisma.productSale.count({ where }),
      prisma.productSale.aggregate({
        where: { ...where, voidedAt: null },
        _sum: { totalAmount: true },
      }),
    ]);

    return {
      sales,
      total,
      page,
      limit,
      totalRevenue: Number(revenueAgg._sum.totalAmount || 0),
    };
  }

  static async findById(id: string) {
    const sale = await prisma.productSale.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        branch: true,
        customer: { include: { profile: true } },
        staff: { include: { user: { include: { profile: true } } } },
        earning: true,
      },
    });
    if (!sale) throw new NotFoundError('Sale not found');
    return sale;
  }

  static async voidSale(id: string, reason: string) {
    return prisma.$transaction(async (tx) => {
      const sale = await tx.productSale.findUnique({
        where: { id },
        include: { items: true, earning: true },
      });
      if (!sale) throw new NotFoundError('Sale not found');
      if (sale.voidedAt) throw new BadRequestError('Sale already voided');

      // Restore stock at the branch this sale happened at.
      for (const item of sale.items) {
        await tx.productBranchStock.upsert({
          where: { productId_branchId: { productId: item.productId, branchId: sale.branchId } },
          update: { stock: { increment: item.quantity } },
          create: {
            productId: item.productId,
            branchId: sale.branchId,
            stock: item.quantity,
            reorderLevel: 5,
          },
        });
      }

      if (sale.earning) {
        if (sale.earning.payoutStatus === 'PAID') {
          throw new BadRequestError(
            'Cannot void — the linked commission has already been paid out. Reverse the payout first.'
          );
        }
        await tx.staffEarning.delete({ where: { id: sale.earning.id } });
      }

      return tx.productSale.update({
        where: { id },
        data: { voidedAt: new Date(), voidReason: reason },
        include: {
          items: { include: { product: true } },
          branch: true,
          customer: { include: { profile: true } },
          staff: { include: { user: { include: { profile: true } } } },
        },
      });
    });
  }
}
