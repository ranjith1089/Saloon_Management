/**
 * Runs the main seed script only if the users table is empty.
 * Safe to run on every deploy — won't overwrite existing data.
 */
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

async function main() {
  try {
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      console.log(`✓ Database already has ${userCount} users — skipping seed.`);
      return;
    }
    console.log('📦 Database is empty — running initial seed...');
    execSync('npx ts-node prisma/seed.ts', { stdio: 'inherit' });
  } catch (err) {
    console.error('⚠️  Seed-if-empty failed:', err);
    // Don't crash the container — the app can still boot without seed data
  } finally {
    await prisma.$disconnect();
  }
}

main();
