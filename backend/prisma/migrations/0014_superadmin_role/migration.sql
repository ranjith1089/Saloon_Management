-- Ship 5A of SaaS conversion — SUPERADMIN role for Aveon-side operators.
DO $$ BEGIN
  ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SUPERADMIN' BEFORE 'OWNER';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
