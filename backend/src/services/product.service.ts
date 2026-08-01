import prisma from '../config/database';
import { NotFoundError, BadRequestError, ConflictError } from '../utils/ApiError';
import { Prisma } from '@prisma/client';

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
export class ProductService {
  static async create(data: any) {
    return prisma.product.create({
      data: {
        ...data,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
      },
      include: { branch: true, category: true },
    });
  }

  static async findAll(query: any) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '20', 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.branchId) where.branchId = query.branchId;
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
    // NOTE: low-stock filter (stock <= reorderLevel) is exposed via the dedicated
    // /products/alerts/low-stock endpoint since Prisma's `fields` shorthand needs
    // a preview flag we haven't enabled.
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
        include: { branch: true, category: true },
      }),
      prisma.product.count({ where }),
    ]);
    return { products, total, page, limit };
  }

  static async findById(id: string) {
    const p = await prisma.product.findUnique({
      where: { id },
      include: { branch: true, category: true },
    });
    if (!p) throw new NotFoundError('Product not found');
    return p;
  }

  static async update(id: string, data: any) {
    await this.findById(id);
    return prisma.product.update({
      where: { id },
      data: {
        ...data,
        ...(data.expiryDate !== undefined && {
          expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        }),
      },
      include: { branch: true, category: true },
    });
  }

  static async delete(id: string) {
    await this.findById(id);
    // Soft-delete so historical sale line items remain valid.
    return prisma.product.update({ where: { id }, data: { isActive: false } });
  }

  static async getLowStock(query: any) {
    const where: any = { isActive: true };
    if (query.branchId) where.branchId = query.branchId;
    // Fetch active products where stock <= reorderLevel.
    const all = await prisma.product.findMany({
      where,
      include: { branch: true, category: true },
      orderBy: { stock: 'asc' },
    });
    return all.filter((p) => p.stock <= p.reorderLevel);
  }

  static async getExpiring(query: any) {
    const days = parseInt(query.days || '30', 10);
    const until = new Date();
    until.setDate(until.getDate() + days);
    const where: any = {
      isActive: true,
      expiryDate: { not: null, lte: until },
    };
    if (query.branchId) where.branchId = query.branchId;
    return prisma.product.findMany({
      where,
      include: { branch: true, category: true },
      orderBy: { expiryDate: 'asc' },
    });
  }
}

// ============ PRODUCT SALE ============
export class ProductSaleService {
  static async create(data: any) {
    const saleNumber = `PS${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // Serializable transaction: validate + decrement stock + create sale + create earning
    // atomically so two concurrent sales can't oversell a low-stock product.
    return prisma.$transaction(
      async (tx) => {
        // Load all products in one shot and lock the rows.
        const productIds = data.items.map((i: any) => i.productId);
        const products = await tx.product.findMany({ where: { id: { in: productIds } } });
        const byId = new Map(products.map((p) => [p.id, p]));

        // Validate each item, compute subtotals.
        let subtotal = 0;
        const decrementedItems: Array<{
          productId: string;
          quantity: number;
          unitPrice: number;
          subtotal: number;
        }> = [];

        for (const item of data.items) {
          const p = byId.get(item.productId);
          if (!p) throw new NotFoundError(`Product ${item.productId} not found`);
          if (!p.isActive) throw new BadRequestError(`Product "${p.name}" is inactive`);
          if (p.branchId !== data.branchId) {
            throw new BadRequestError(`Product "${p.name}" does not belong to the selected branch`);
          }
          if (p.stock < item.quantity) {
            throw new ConflictError(`Insufficient stock for "${p.name}" (available: ${p.stock}, requested: ${item.quantity})`);
          }
          const unitPrice = item.unitPrice ?? Number(p.sellPrice);
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
        const taxAmount = Number(data.taxAmount || 0);
        const totalAmount = Math.max(0, subtotal - discountAmount + taxAmount);

        // Decrement stock for each item.
        for (const item of decrementedItems) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }

        // Create the sale + items.
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

        // Staff commission — same commissionRate as bookings.
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

      // Restore stock.
      for (const item of sale.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }

      // Void staff earning if present (and not yet paid out).
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
