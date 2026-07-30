/**
 * Deploy bootstrap. Runs before the app starts.
 *
 * Handles four cases safely:
 *   1. Fresh database — applies all migrations.
 *   2. Existing DB previously managed via `prisma db push` (has app tables
 *      but no `_prisma_migrations` history) — baselines the init migration
 *      as already-applied, then applies any newer ones.
 *   3. Existing DB where a previous deploy tried `migrate deploy`, created
 *      `_prisma_migrations`, and left the init migration in a FAILED state
 *      (rows exist for the enums/tables from `db push`, so the SQL raised
 *      "already exists"). Roll the failed record back, mark applied, continue.
 *   4. Normal migrated DB — `migrate deploy` applies any new migrations.
 *
 * Then runs the seed only if the users table is empty (idempotent).
 */
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();
const INIT_MIGRATION = '0001_init';

function run(cmd: string) {
  console.log(`→ ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
}

async function tableExists(name: string): Promise<boolean> {
  const rows = await prisma.$queryRawUnsafe<Array<{ exists: boolean }>>(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = $1
     ) AS "exists"`,
    name
  );
  return rows[0]?.exists === true;
}

type MigrationState = 'applied' | 'failed' | 'none';

async function migrationState(name: string): Promise<MigrationState> {
  const rows = await prisma.$queryRawUnsafe<
    Array<{ finished_at: Date | null; rolled_back_at: Date | null }>
  >(
    `SELECT finished_at, rolled_back_at
       FROM _prisma_migrations
       WHERE migration_name = $1
       ORDER BY started_at DESC
       LIMIT 1`,
    name
  );
  if (rows.length === 0) return 'none';
  const r = rows[0];
  if (r.finished_at !== null && r.rolled_back_at === null) return 'applied';
  return 'failed';
}

async function main() {
  const hasMigrationHistory = await tableExists('_prisma_migrations');
  const hasAppTables = await tableExists('users');

  if (hasAppTables) {
    if (!hasMigrationHistory) {
      // Case 2 — DB built by `db push`. Baseline init as already-applied.
      console.log('⚙  Detected pre-migrations database. Baselining init migration…');
      run(`npx prisma migrate resolve --applied ${INIT_MIGRATION}`);
    } else {
      // History exists — inspect the init migration's state.
      const state = await migrationState(INIT_MIGRATION);
      if (state === 'failed') {
        // Case 3 — a previous deploy attempted `migrate deploy` on a pushed
        // DB and left init as failed. Roll the failed row back, then mark
        // it applied so `migrate deploy` will proceed.
        console.log('⚙  Init migration is in failed state on an existing DB. Rolling back and re-baselining…');
        run(`npx prisma migrate resolve --rolled-back ${INIT_MIGRATION}`);
        run(`npx prisma migrate resolve --applied ${INIT_MIGRATION}`);
      } else if (state === 'none') {
        // Edge case: history table exists but has no row for init. Baseline it.
        console.log('⚙  Migration history table exists but no init record. Baselining…');
        run(`npx prisma migrate resolve --applied ${INIT_MIGRATION}`);
      }
      // else 'applied' — normal path, nothing to do here.
    }
  }

  // All four cases converge here.
  run('npx prisma migrate deploy');

  // Seed only when the users table is empty.
  const userCount = await prisma.user.count();
  if (userCount === 0) {
    console.log('📦 Database is empty — running initial seed…');
    run('npx ts-node prisma/seed.ts');
  } else {
    console.log(`✓ Database has ${userCount} users — skipping seed.`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('❌ Bootstrap failed:', err);
    await prisma.$disconnect();
    process.exit(1);
  });
