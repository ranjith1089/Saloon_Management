/**
 * Slug helpers for tenant organizations. Slugs live in URLs
 * (`{slug}.salonapp.in`, `/orgs/{slug}`), so they must be safe,
 * lowercase, and free of reserved names.
 */
import prisma from '../config/database';

/** Names we never let a tenant claim — collisions with app routes / infra. */
export const RESERVED_SLUGS = new Set([
  'admin', 'administrator', 'api', 'app', 'auth', 'billing', 'blog',
  'book', 'booking', 'bookings', 'contact', 'dashboard', 'docs', 'help',
  'home', 'login', 'logout', 'my', 'onboarding', 'org', 'orgs',
  'organization', 'organizations', 'pricing', 'public', 'register',
  'salon', 'saloon', 'settings', 'signup', 'sso', 'staff', 'status',
  'support', 'system', 'terms', 'privacy', 'root', 'super', 'superadmin',
  'test', 'tests', 'user', 'users', 'www', 'default',
]);

export function normaliseSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')       // non-alnum → dash
    .replace(/^-+|-+$/g, '')            // trim leading/trailing dashes
    .replace(/-{2,}/g, '-')             // collapse runs of dashes
    .slice(0, 40);
}

export function isReserved(slug: string): boolean {
  return RESERVED_SLUGS.has(slug);
}

/**
 * Generate a unique slug from a seed (usually salon name or email local part).
 * Adds a short random suffix if the base is taken or reserved.
 */
export async function generateUniqueSlug(seed: string): Promise<string> {
  let base = normaliseSlug(seed) || 'salon';
  if (isReserved(base)) base = `${base}-salon`;

  // First try the clean base
  const existing = await prisma.organization.findUnique({ where: { slug: base } });
  if (!existing) return base;

  // Try up to 5 random suffixes before giving up
  for (let i = 0; i < 5; i++) {
    const suffix = Math.random().toString(36).slice(2, 6);
    const candidate = `${base}-${suffix}`.slice(0, 45);
    const hit = await prisma.organization.findUnique({ where: { slug: candidate } });
    if (!hit) return candidate;
  }
  // Last-ditch — timestamp suffix always wins uniqueness
  return `${base}-${Date.now().toString(36)}`;
}
