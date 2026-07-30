import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Sentinel values that MUST NOT survive into production. Any of these in prod
// means someone forgot to set the corresponding real secret.
const DEV_DEFAULT_JWT_SECRET = 'default-secret';
const DEV_DEFAULT_JWT_REFRESH_SECRET = 'default-refresh-secret';
const MIN_SECRET_LENGTH = 32;

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  API_PREFIX: z.string().default('/api/v1'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().default(DEV_DEFAULT_JWT_SECRET),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_SECRET: z.string().default(DEV_DEFAULT_JWT_REFRESH_SECRET),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900_000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(100),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const env = parsed.data;

// Production-only guards. Do not let a container boot with dev defaults —
// signed JWTs would be forgeable and the app CORS would allow the localhost UI only.
if (env.NODE_ENV === 'production') {
  const errors: string[] = [];

  if (env.JWT_SECRET === DEV_DEFAULT_JWT_SECRET) {
    errors.push('JWT_SECRET is the dev default. Set a strong value (>= 32 chars).');
  } else if (env.JWT_SECRET.length < MIN_SECRET_LENGTH) {
    errors.push(`JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters.`);
  }

  if (env.JWT_REFRESH_SECRET === DEV_DEFAULT_JWT_REFRESH_SECRET) {
    errors.push('JWT_REFRESH_SECRET is the dev default. Set a strong value (>= 32 chars).');
  } else if (env.JWT_REFRESH_SECRET.length < MIN_SECRET_LENGTH) {
    errors.push(`JWT_REFRESH_SECRET must be at least ${MIN_SECRET_LENGTH} characters.`);
  }

  if (env.JWT_SECRET === env.JWT_REFRESH_SECRET) {
    errors.push('JWT_SECRET and JWT_REFRESH_SECRET must be different.');
  }

  if (!process.env.CORS_ORIGIN) {
    errors.push('CORS_ORIGIN is required in production. Set it to your frontend origin(s), comma-separated.');
  } else if (env.CORS_ORIGIN.trim() === '*') {
    errors.push('CORS_ORIGIN="*" is not allowed in production — cookies/credentials will not work. List explicit origins.');
  }

  if (errors.length > 0) {
    console.error('❌ Production environment validation failed:');
    errors.forEach((e) => console.error('   • ' + e));
    process.exit(1);
  }
}

export default env;
