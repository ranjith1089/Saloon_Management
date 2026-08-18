/**
 * Tenant context — Ship 1A of SaaS conversion.
 *
 * Every authenticated HTTP request runs inside an AsyncLocalStorage frame
 * that carries the caller's organizationId. Downstream code (services,
 * Prisma-extension hooks in Ship 1B) can read it via `getCurrentOrgId()`
 * without threading it through every function signature.
 *
 * SHIP 1A: the store is set on every authed request but NOT yet consumed
 *   by the query layer. Existing services keep returning cross-org data
 *   until Ship 1B enables filtering.
 * SHIP 1B: adds Prisma client extension that auto-injects `where.organizationId`
 *   into every read/write for tenant-scoped models, using this store.
 */
import { AsyncLocalStorage } from 'node:async_hooks';

interface TenantContext {
  organizationId: string | null;   // null = anonymous / cross-tenant (auth flows, cron)
  userId: string | null;
  role: string | null;
  isSystem?: boolean;              // true = bypass all tenant filtering (super-admin only)
}

const storage = new AsyncLocalStorage<TenantContext>();

/** Run a callback inside a tenant frame. Returns whatever the callback returns. */
export function runInTenant<T>(ctx: TenantContext, fn: () => T): T {
  return storage.run(ctx, fn);
}

/** Read the current tenant frame; returns null when called outside any run. */
export function getTenantContext(): TenantContext | null {
  return storage.getStore() ?? null;
}

export function getCurrentOrgId(): string | null {
  return storage.getStore()?.organizationId ?? null;
}

export function getCurrentUserId(): string | null {
  return storage.getStore()?.userId ?? null;
}

/**
 * Escape hatch for genuinely cross-tenant flows (super-admin dashboards,
 * background jobs, reconciliation). Do not use for regular request handlers.
 */
export function runAsSystem<T>(fn: () => T): T {
  return storage.run({ organizationId: null, userId: null, role: null, isSystem: true }, fn);
}
