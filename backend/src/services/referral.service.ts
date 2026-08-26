import prisma from '../config/database';
import { NotFoundError, BadRequestError } from '../utils/ApiError';

// Reward defaults — later exposed via Settings, hardcoded for the first ship.
const REWARD_OWNER = 100;
const REWARD_REFEREE = 100;

/**
 * Random 6-char share code — omits confusable chars (0/O, 1/I/L).
 */
function generateCode() {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

export class ReferralService {
  /**
   * Fetch (creating if needed) the caller's own share code + list of
   * referrals they've made. Lazy-generation avoids the migration
   * touching every existing user.
   */
  static async myOverview(userId: string) {
    let user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, referralCode: true },
    });
    if (!user) throw new NotFoundError('User not found');

    if (!user.referralCode) {
      // Retry loop in the unlikely case of a collision.
      for (let attempt = 0; attempt < 6; attempt++) {
        const code = generateCode();
        try {
          user = await prisma.user.update({
            where: { id: userId },
            data: { referralCode: code },
            select: { id: true, referralCode: true },
          });
          break;
        } catch (e: any) {
          if (e?.code === 'P2002') continue; // unique conflict — try again
          throw e;
        }
      }
    }

    const referrals = await prisma.referral.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        referee: { include: { profile: true } },
      },
    });

    return {
      code: user!.referralCode!,
      referrals,
      counts: {
        total: referrals.length,
        pending: referrals.filter((r) => r.status === 'PENDING').length,
        completed: referrals.filter((r) => r.status === 'COMPLETED').length,
      },
      rewardEarned: referrals
        .filter((r) => r.status === 'COMPLETED')
        .reduce((s, r) => s + (r.rewardOwner || 0), 0),
    };
  }

  /**
   * Admin — every referral across the system.
   */
  static async findAll(query: any) {
    const where: any = {};
    if (query.status) where.status = query.status;
    return prisma.referral.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        owner: { include: { profile: true } },
        referee: { include: { profile: true } },
      },
      take: parseInt((query.limit as string) || '200', 10),
    });
  }

  /**
   * Called during registration when the register payload carried a
   * ?ref=CODE. Links the new user (referee) to the code owner and
   * credits BOTH parties 100 loyalty points immediately — the reward is
   * granted at signup, not deferred to a first visit. No-op if the code
   * is empty, unknown, or a self-referral.
   */
  static async trackFromCode(code: string, refereeId: string) {
    if (!code) return null;
    const cleaned = code.trim().toUpperCase();
    const owner = await prisma.user.findUnique({ where: { referralCode: cleaned } });
    if (!owner) return null;
    if (owner.id === refereeId) return null;

    // Already tracked? Don't credit twice.
    const existing = await prisma.referral.findUnique({ where: { refereeId } });
    if (existing) return existing;

    // Create the referral as COMPLETED and credit both sides atomically.
    // customer rows may not exist yet (direct signup) — upsert to be safe.
    return prisma.$transaction(async (tx) => {
      const referral = await tx.referral.create({
        data: {
          code: cleaned,
          ownerId: owner.id,
          refereeId,
          status: 'COMPLETED',
          rewardOwner: REWARD_OWNER,
          rewardReferee: REWARD_REFEREE,
          completedAt: new Date(),
        },
      });

      await Promise.all([
        tx.customer.upsert({
          where: { userId: owner.id },
          update: { loyaltyPoints: { increment: REWARD_OWNER } },
          create: { userId: owner.id, loyaltyPoints: REWARD_OWNER },
        }),
        tx.customer.upsert({
          where: { userId: refereeId },
          update: { loyaltyPoints: { increment: REWARD_REFEREE } },
          create: { userId: refereeId, loyaltyPoints: REWARD_REFEREE },
        }),
      ]);

      return referral;
    });
  }

  /**
   * Called after a booking flips to COMPLETED. Referral rewards are now
   * granted at signup (see trackFromCode), so this is a no-op for the
   * current flow — it only fires for any legacy PENDING referrals created
   * before the credit-on-signup change, keeping them from being stranded.
   */
  static async onBookingCompleted(customerId: string, tx?: any) {
    const client = tx || prisma;
    const referral = await client.referral.findUnique({ where: { refereeId: customerId } });
    if (!referral || referral.status !== 'PENDING') return;

    // Count how many COMPLETED bookings the referee has BEFORE this one.
    // Since the caller has already flipped the booking to COMPLETED in the
    // same transaction, we expect exactly 1 here to be the first.
    const completedCount = await client.booking.count({
      where: { customerId, status: 'COMPLETED' },
    });
    if (completedCount > 1) return; // not their first — don't award

    // Award points. `customer` row may not exist if signup was direct; upsert.
    await Promise.all([
      client.customer.upsert({
        where: { userId: referral.ownerId },
        update: { loyaltyPoints: { increment: REWARD_OWNER } },
        create: { userId: referral.ownerId, loyaltyPoints: REWARD_OWNER },
      }),
      client.customer.upsert({
        where: { userId: customerId },
        update: { loyaltyPoints: { increment: REWARD_REFEREE } },
        create: { userId: customerId, loyaltyPoints: REWARD_REFEREE },
      }),
      client.referral.update({
        where: { id: referral.id },
        data: {
          status: 'COMPLETED',
          rewardOwner: REWARD_OWNER,
          rewardReferee: REWARD_REFEREE,
          completedAt: new Date(),
        },
      }),
    ]);
  }
}

export const REFERRAL_REWARDS = { REWARD_OWNER, REWARD_REFEREE };
