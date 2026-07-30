/**
 * Deploy bootstrap. Runs before the app starts.
 *
 * Handles three cases safely:
 *   1. Fresh database — applies all migrations.
 *   2. Existing database that was previously managed via `prisma db push`
 *      (has schema but no `_prisma_migrations` history) — baselines the
 *      init migration as already-applied, then applies any newer ones.
 *   3. Existing migrated database — normal `migrate deploy`.
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

async function main() {
  const hasMigrationHistory = await tableExists('_prisma_migrations');
  const hasAppTables = await tableExists('users');

  if (!hasMigrationHistory && hasAppTables) {
    // Case 2 — DB was built by `db push`. Baseline the init migration so
    // `migrate deploy` doesn't try to re-create existing tables.
    console.log('⚙  Detected pre-migrations database. Baselining init migration…');
    run(`npx prisma migrate resolve --applied ${INIT_MIGRATION}`);
  }

  // Cases 1, 2, 3 all end here.
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
