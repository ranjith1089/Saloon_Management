import { z } from 'zod';

// ---------------------------------------------------------------------------
// Shared field rules (India-first). Reused across register + profile update so
// the API rejects the same junk the UI does. Client validation is bypassable,
// so these are the real gate.
// ---------------------------------------------------------------------------
const NAME_RE = /^[A-Za-z][A-Za-z\s.'-]*$/;         // letters/space/.'- , must start with a letter
const PHONE_RE = /^[6-9]\d{9}$/;                     // 10-digit Indian mobile
const POSTCODE_RE = /^\d{6}$/;                       // 6-digit Indian PIN
const PLACE_RE = /^[A-Za-z][A-Za-z\s.'-]*$/;         // city/state/country names
const ADDRESS_RE = /^[A-Za-z0-9\s,.#/'()-]*$/;       // street address safe charset

const nameField = (label: string) =>
  z.string()
    .trim()
    .min(2, `${label} must be at least 2 characters`)
    .max(50, `${label} must be at most 50 characters`)
    .regex(NAME_RE, `${label} may only contain letters`);

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    firstName: nameField('First name'),
    lastName: nameField('Last name'),
    phone: z.string().trim().regex(PHONE_RE, 'Enter a valid 10-digit mobile number').optional(),
    role: z.enum(['OWNER', 'ADMIN', 'MANAGER', 'STAFF', 'CUSTOMER']).optional(),
    referralCode: z.string().max(20).optional(),
    // Ship 2 — salon owner signup carries salon details for the new
    // Organization that gets created. All optional so existing register
    // flow still works.
    salonName: z.string().min(2).max(100).optional(),
    country:   z.string().length(2).optional(),   // ISO 3166-1 alpha-2
    currency:  z.string().length(3).optional(),   // ISO 4217
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  }),
});

// Optional free-text field: allow empty string / null (field cleared) but if a
// value is present it must match the pattern and length.
const optPattern = (re: RegExp, max: number, msg: string) =>
  z.string().trim().max(max, `Must be at most ${max} characters`)
    .refine((v) => v === '' || re.test(v), msg)
    .optional()
    .nullable();

export const updateProfileSchema = z.object({
  body: z.object({
    firstName: nameField('First name').optional(),
    lastName: nameField('Last name').optional(),
    phone: z.string().trim().regex(PHONE_RE, 'Enter a valid 10-digit mobile number').optional().nullable(),
    avatar: z.string().url().max(500).optional().nullable(),
    dob: z.string().optional().nullable(),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional().nullable(),
    address: optPattern(ADDRESS_RE, 255, 'Address contains invalid characters'),
    city: optPattern(PLACE_RE, 80, 'City may only contain letters'),
    state: optPattern(PLACE_RE, 80, 'State may only contain letters'),
    country: optPattern(PLACE_RE, 80, 'Country may only contain letters'),
    postcode: optPattern(POSTCODE_RE, 6, 'Enter a valid 6-digit postcode'),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>['body'];
