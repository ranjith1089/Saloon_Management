import prisma from '../config/database';
import { UserRole } from '@prisma/client';

/**
 * Master permission catalog. Seeded on first request; new entries added on
 * subsequent boots are idempotent (upsert-by-key). Do NOT rename keys — treat
 * them as stable ids. Change label/category freely.
 */
export const PERMISSION_CATALOG: Array<{ key: string; label: string; category: string; defaultRoles: UserRole[] }> = [
  // Bookings
  { key: 'bookings.read',            label: 'View bookings',                    category: 'Bookings',   defaultRoles: ['ADMIN', 'MANAGER', 'STAFF'] },
  { key: 'bookings.create',          label: 'Create bookings',                  category: 'Bookings',   defaultRoles: ['ADMIN', 'MANAGER', 'STAFF'] },
  { key: 'bookings.update',          label: 'Edit bookings',                    category: 'Bookings',   defaultRoles: ['ADMIN', 'MANAGER', 'STAFF'] },
  { key: 'bookings.delete',          label: 'Delete bookings',                  category: 'Bookings',   defaultRoles: ['ADMIN', 'MANAGER'] },
  { key: 'bookings.collect_payment', label: 'Collect payment for a booking',    category: 'Bookings',   defaultRoles: ['ADMIN', 'MANAGER', 'STAFF'] },
  // Services
  { key: 'services.manage',          label: 'Create / edit / delete services',  category: 'Services',   defaultRoles: ['ADMIN', 'MANAGER'] },
  // Staff
  { key: 'staff.manage',             label: 'Create / edit staff',              category: 'Staff',      defaultRoles: ['ADMIN', 'MANAGER'] },
  { key: 'staff.verify',             label: 'Verify unverified staff',          category: 'Staff',      defaultRoles: ['ADMIN', 'MANAGER'] },
  { key: 'staff.delete',             label: 'Delete staff',                     category: 'Staff',      defaultRoles: ['ADMIN'] },
  { key: 'staff.schedule',           label: 'Edit staff schedules',             category: 'Staff',      defaultRoles: ['ADMIN', 'MANAGER'] },
  // Products & sales
  { key: 'products.manage',          label: 'Manage products & categories',     category: 'Products',   defaultRoles: ['ADMIN', 'MANAGER'] },
  { key: 'product_sales.create',     label: 'Record product sales (POS)',       category: 'Products',   defaultRoles: ['ADMIN', 'MANAGER', 'STAFF'] },
  { key: 'product_sales.void',       label: 'Void product sales',               category: 'Products',   defaultRoles: ['ADMIN', 'MANAGER'] },
  // Customers
  { key: 'customers.manage',         label: 'Create / edit customers',          category: 'Customers',  defaultRoles: ['ADMIN', 'MANAGER', 'STAFF'] },
  // Memberships
  { key: 'memberships.manage',       label: 'Manage plans & memberships',       category: 'Memberships', defaultRoles: ['ADMIN', 'MANAGER'] },
  // Finance
  { key: 'earnings.read',            label: 'View earnings',                    category: 'Finance',    defaultRoles: ['ADMIN', 'MANAGER', 'STAFF'] },
  { key: 'payouts.create',           label: 'Create payouts',                   category: 'Finance',    defaultRoles: ['ADMIN', 'MANAGER'] },
  { key: 'payouts.approve',          label: 'Mark payouts as paid',             category: 'Finance',    defaultRoles: ['ADMIN'] },
  { key: 'payouts.cancel',           label: 'Cancel payouts',                   category: 'Finance',    defaultRoles: ['ADMIN'] },
  { key: 'tax.manage',               label: 'Manage tax rules',                 category: 'Finance',    defaultRoles: ['ADMIN'] },
  { key: 'coupons.manage',           label: 'Manage coupons',                   category: 'Finance',    defaultRoles: ['ADMIN', 'MANAGER'] },
  // Reports
  { key: 'reports.view',             label: 'View business reports',            category: 'Reports',    defaultRoles: ['ADMIN', 'MANAGER'] },
  // Settings
  { key: 'settings.branding',        label: 'Change branding',                  category: 'Settings',   defaultRoles: ['ADMIN'] },
  { key: 'settings.currency',        label: 'Change currency',                  category: 'Settings',   defaultRoles: ['ADMIN'] },
  { key: 'settings.holidays',        label: 'Manage holidays',                  category: 'Settings',   defaultRoles: ['ADMIN', 'MANAGER'] },
  { key: 'settings.payment_methods', label: 'Manage payment methods',           category: 'Settings',   defaultRoles: ['ADMIN'] },
  { key: 'settings.access_control',  label: 'Change role permissions',          category: 'Settings',   defaultRoles: ['ADMIN'] },
  // Inquiries
  { key: 'inquiries.read',           label: 'View customer inquiries',          category: 'Inquiries',  defaultRoles: ['ADMIN', 'MANAGER'] },
  { key: 'inquiries.respond',        label: 'Respond to inquiries',             category: 'Inquiries',  defaultRoles: ['ADMIN', 'MANAGER'] },
];

const ALL_ROLES: UserRole[] = ['ADMIN', 'MANAGER', 'STAFF', 'CUSTOMER'];

// In-memory cache — the matrix rarely changes. Invalidated on every write.
let cache: { rolePermissions: Map<UserRole, Set<string>>; loadedAt: number } | null = null;
const CACHE_MS = 60_000;

async function loadMatrix() {
  const rows = await prisma.rolePermission.findMany({ include: { permission: true } });
  const map = new Map<UserRole, Set<string>>();
  ALL_ROLES.forEach((r) => map.set(r, new Set()));
  rows.forEach((r) => map.get(r.role)?.add(r.permission.key));
  cache = { rolePermissions: map, loadedAt: Date.now() };
  return cache;
}

async function getCached() {
  if (!cache || Date.now() - cache.loadedAt > CACHE_MS) return loadMatrix();
  return cache;
}

export class AccessControlService {
  static invalidate() {
    cache = null;
  }

  /**
   * Seed the catalog + default role assignments. Idempotent — safe to run on
   * every boot. Newly-added catalog entries pick up their default roles;
   * existing role→permission assignments are never touched.
   */
  static async seedIfNeeded() {
    for (const entry of PERMISSION_CATALOG) {
      const existing = await prisma.permission.findUnique({ where: { key: entry.key } });
      const permission = existing
        ? await prisma.permission.update({
            where: { key: entry.key },
            data: { label: entry.label, category: entry.category },
          })
        : await prisma.permission.create({
            data: { key: entry.key, label: entry.label, category: entry.category },
          });

      // Assign default roles ONLY when this permission is brand new — otherwise
      // an admin might have already customised the matrix and we shouldn't stomp.
      if (!existing) {
        // ADMIN always gets every permission.
        await prisma.rolePermission.createMany({
          data: [
            { role: 'ADMIN' as UserRole, permissionId: permission.id },
            ...entry.defaultRoles
              .filter((r) => r !== 'ADMIN')
              .map((role) => ({ role, permissionId: permission.id })),
          ],
          skipDuplicates: true,
        });
      }
    }
    // Guarantee ADMIN has every permission (even if manually removed).
    const allPerms = await prisma.permission.findMany({ select: { id: true } });
    await prisma.rolePermission.createMany({
      data: allPerms.map((p) => ({ role: 'ADMIN' as UserRole, permissionId: p.id })),
      skipDuplicates: true,
    });
    cache = null;
  }

  static async hasPermission(role: UserRole, key: string): Promise<boolean> {
    if (role === 'ADMIN') return true; // ADMIN always allowed — matches seed
    const { rolePermissions } = await getCached();
    return rolePermissions.get(role)?.has(key) === true;
  }

  static async getMatrix() {
    const [permissions, rolePermissions] = await Promise.all([
      prisma.permission.findMany({ orderBy: [{ category: 'asc' }, { label: 'asc' }] }),
      prisma.rolePermission.findMany(),
    ]);
    const grants = new Map<string, Set<UserRole>>();
    permissions.forEach((p) => grants.set(p.id, new Set()));
    rolePermissions.forEach((rp) => grants.get(rp.permissionId)?.add(rp.role));

    return {
      roles: ALL_ROLES.filter((r) => r !== 'CUSTOMER'), // customer role has no admin surface
      permissions: permissions.map((p) => ({
        id: p.id,
        key: p.key,
        label: p.label,
        category: p.category,
        grantedTo: Array.from(grants.get(p.id) || []),
      })),
    };
  }

  /**
   * Bulk-set the matrix. Body: [{ permissionId, roles: UserRole[] }, ...].
   * ADMIN is force-added to every permission (can't lock yourself out).
   */
  static async setMatrix(items: Array<{ permissionId: string; roles: UserRole[] }>) {
    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        const rolesWithAdmin = Array.from(new Set([...(item.roles || []), 'ADMIN' as UserRole]));
        await tx.rolePermission.deleteMany({ where: { permissionId: item.permissionId } });
        await tx.rolePermission.createMany({
          data: rolesWithAdmin.map((role) => ({ role, permissionId: item.permissionId })),
          skipDuplicates: true,
        });
      }
    });
    cache = null;
    return this.getMatrix();
  }
}
