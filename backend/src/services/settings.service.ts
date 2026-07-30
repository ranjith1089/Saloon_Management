import prisma from '../config/database';
import { NotFoundError } from '../utils/ApiError';

// ============ GENERIC SETTINGS (Branding, Currency, Business) ============
export class SettingsService {
  static async getByType(type: string) {
    const rows = await prisma.setting.findMany({ where: { type } });
    const obj: Record<string, any> = {};
    for (const row of rows) {
      try { obj[row.key] = JSON.parse(row.value); }
      catch { obj[row.key] = row.value; }
    }
    return obj;
  }

  static async upsertMany(type: string, values: Record<string, any>) {
    const results = [];
    for (const [key, value] of Object.entries(values)) {
      const stored = typeof value === 'string' ? JSON.stringify(value) : JSON.stringify(value);
      const row = await prisma.setting.upsert({
        where: { key: `${type}.${key}` },
        create: { key: `${type}.${key}`, value: stored, type },
        update: { value: stored, type },
      });
      results.push(row);
    }
    return this.getByType(type);
  }

  static async delete(key: string) {
    return prisma.setting.delete({ where: { key } });
  }
}

// ============ HOLIDAYS ============
export class HolidayService {
  static async create(data: any) {
    return prisma.holiday.create({
      data: {
        name: data.name,
        date: new Date(data.date),
        repeats: data.repeats ?? false,
        behavior: data.behavior ?? 'BLOCK',
        color: data.color ?? '#ef4444',
        branchIds: data.branchIds ?? [],
      },
    });
  }

  static async findAll(query: any = {}) {
    const where: any = {};
    if (query.year) {
      const start = new Date(`${query.year}-01-01`);
      const end = new Date(`${Number(query.year) + 1}-01-01`);
      where.date = { gte: start, lt: end };
    }
    if (query.branchId) {
      where.OR = [{ branchIds: { isEmpty: true } }, { branchIds: { has: query.branchId } }];
    }
    return prisma.holiday.findMany({ where, orderBy: { date: 'asc' } });
  }

  static async findById(id: string) {
    const h = await prisma.holiday.findUnique({ where: { id } });
    if (!h) throw new NotFoundError('Holiday not found');
    return h;
  }

  static async update(id: string, data: any) {
    await this.findById(id);
    return prisma.holiday.update({
      where: { id },
      data: { ...data, date: data.date ? new Date(data.date) : undefined },
    });
  }

  static async delete(id: string) {
    await this.findById(id);
    return prisma.holiday.delete({ where: { id } });
  }

  static async bulkCreate(items: any[]) {
    return prisma.holiday.createMany({
      data: items.map((h) => ({
        name: h.name,
        date: new Date(h.date),
        repeats: h.repeats ?? false,
        behavior: h.behavior ?? 'BLOCK',
        color: h.color ?? '#ef4444',
        branchIds: h.branchIds ?? [],
      })),
    });
  }
}

// ============ PAYMENT METHODS ============
export class PaymentMethodService {
  static async create(data: any) {
    const maxOrder = await prisma.paymentMethod.aggregate({ _max: { sortOrder: true } });
    const sortOrder = data.sortOrder ?? (maxOrder._max.sortOrder ?? -1) + 1;
    return prisma.paymentMethod.create({
      data: {
        name: data.name,
        type: data.type ?? 'CASH',
        gateway: data.gateway ?? 'NONE',
        icon: data.icon ?? '💵',
        enabled: data.enabled ?? true,
        sortOrder,
        testMode: data.testMode ?? false,
        apiKey: data.apiKey,
        apiSecret: data.apiSecret,
        webhookUrl: data.webhookUrl,
      },
    });
  }

  static async findAll(query: any = {}) {
    const where: any = {};
    if (query.enabled !== undefined) where.enabled = query.enabled === 'true';
    return prisma.paymentMethod.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      // Hide sensitive credentials from list by default; use findById for full details
      select: {
        id: true, name: true, type: true, gateway: true, icon: true,
        enabled: true, sortOrder: true, testMode: true,
        webhookUrl: true, createdAt: true, updatedAt: true,
        apiKey: false, apiSecret: false,
      },
    });
  }

  static async findById(id: string) {
    const m = await prisma.paymentMethod.findUnique({ where: { id } });
    if (!m) throw new NotFoundError('Payment method not found');
    return m;
  }

  static async update(id: string, data: any) {
    await this.findById(id);
    // Don't overwrite secrets with empty strings
    if (data.apiKey === '' || data.apiKey === undefined) delete data.apiKey;
    if (data.apiSecret === '' || data.apiSecret === undefined) delete data.apiSecret;
    return prisma.paymentMethod.update({ where: { id }, data });
  }

  static async delete(id: string) {
    await this.findById(id);
    return prisma.paymentMethod.delete({ where: { id } });
  }

  static async reorder(orderedIds: string[]) {
    // Batch update sortOrder based on array position
    const updates = orderedIds.map((id, index) =>
      prisma.paymentMethod.update({ where: { id }, data: { sortOrder: index } })
    );
    await prisma.$transaction(updates);
    return this.findAll();
  }
}
