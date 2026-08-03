import prisma from '../config/database';

/**
 * Customers who should be nudged to rebook — bookings the past N days,
 * default 30. Returns each customer with their last booking's meta so the
 * message we render on the frontend can reference the last service / staff.
 */
async function customersMostRecentBooking(where: any) {
  // Pull the most recent COMPLETED booking per customer via a raw group query.
  // Then hydrate the customer + last-service rows for display.
  const groups = await prisma.booking.groupBy({
    by: ['customerId'],
    where: { ...where, customerId: { not: null }, status: 'COMPLETED' },
    _max: { bookingDate: true },
  });
  return groups.filter((g) => g.customerId && g._max.bookingDate);
}

async function hydrate(
  groups: Array<{ customerId: string | null; _max: { bookingDate: Date | null } }>
) {
  const ids = groups.map((g) => g.customerId!).filter(Boolean);
  if (ids.length === 0) return [];
  const [users, lastBookings] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: ids } },
      include: { profile: true, customer: true },
    }),
    // One "most recent" booking per user for the last-service label.
    Promise.all(
      ids.map((uid) =>
        prisma.booking.findFirst({
          where: { customerId: uid, status: 'COMPLETED' },
          orderBy: { bookingDate: 'desc' },
          include: { service: { select: { name: true } }, staff: { include: { user: { include: { profile: true } } } } },
        })
      )
    ),
  ]);
  const userById = new Map(users.map((u) => [u.id, u]));
  const lastByUser = new Map(lastBookings.filter(Boolean).map((b) => [b!.customerId!, b!]));
  return groups
    .map((g) => {
      const u = userById.get(g.customerId!);
      const last = lastByUser.get(g.customerId!);
      if (!u || !last) return null;
      const daysSince = Math.floor(
        (Date.now() - new Date(g._max.bookingDate!).getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        userId: u.id,
        firstName: u.profile?.firstName || '',
        lastName: u.profile?.lastName || '',
        phone: u.profile?.phone || null,
        email: u.email,
        lastVisit: g._max.bookingDate,
        daysSinceLastVisit: daysSince,
        lastService: last.service?.name || null,
        lastStaff: last.staff
          ? `${last.staff.user.profile?.firstName || ''} ${last.staff.user.profile?.lastName || ''}`.trim()
          : null,
        loyaltyPoints: u.customer?.loyaltyPoints ?? 0,
        totalSpent: Number(u.customer?.totalSpent ?? 0),
      };
    })
    .filter(Boolean);
}

export class MarketingService {
  /**
   * Rebook due — visited more than `minDays` ago but within `maxDays`.
   * Default: last visit 30–89 days ago (window we treat as "still warm").
   */
  static async rebookDue(minDays = 30, maxDays = 89) {
    const to = new Date();
    to.setDate(to.getDate() - minDays);
    const from = new Date();
    from.setDate(from.getDate() - maxDays);

    const groups = await customersMostRecentBooking({
      bookingDate: { gte: from, lte: to },
    });
    // Only keep those whose LATEST completed booking falls in the window.
    const filtered = groups.filter((g) => {
      const t = g._max.bookingDate!.getTime();
      return t >= from.getTime() && t <= to.getTime();
    });
    const rows = await hydrate(filtered);
    return rows.sort((a, b) => (a!.daysSinceLastVisit || 0) - (b!.daysSinceLastVisit || 0));
  }

  /**
   * Win-back — no visit for the past `days`+ days.
   */
  static async winBack(days = 90) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    // Latest booking per customer <= cutoff → they've lapsed.
    const latest = await prisma.booking.groupBy({
      by: ['customerId'],
      where: { customerId: { not: null }, status: 'COMPLETED' },
      _max: { bookingDate: true },
    });
    const lapsed = latest.filter((g) => g._max.bookingDate && g._max.bookingDate <= cutoff);
    const rows = await hydrate(lapsed);
    return rows.sort((a, b) => (b!.daysSinceLastVisit || 0) - (a!.daysSinceLastVisit || 0));
  }

  /**
   * Birthdays in the coming N days (inclusive of today).
   * Compares month + day only (year ignored).
   */
  static async birthdaysThisWeek(days = 7) {
    // Postgres has no native "next N days by MM-DD only", so we pull all
    // customers with a dob and filter in JS. Salons rarely have > a few
    // thousand rows here so it's fine.
    const users = await prisma.user.findMany({
      where: { role: 'CUSTOMER', profile: { dob: { not: null } } },
      include: { profile: true, customer: true },
    });

    const today = new Date();
    const todayY = today.getFullYear();
    const soonest = new Date(today);
    const latestDay = new Date(today);
    latestDay.setDate(latestDay.getDate() + days);

    const withUpcoming = users
      .map((u) => {
        if (!u.profile?.dob) return null;
        const dob = new Date(u.profile.dob);
        // Compute the next occurrence of this MM-DD.
        let candidate = new Date(todayY, dob.getMonth(), dob.getDate());
        if (candidate.getTime() < soonest.setHours(0, 0, 0, 0)) {
          candidate = new Date(todayY + 1, dob.getMonth(), dob.getDate());
        }
        const daysUntil = Math.ceil(
          (candidate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        if (candidate.getTime() > latestDay.getTime()) return null;
        return {
          userId: u.id,
          firstName: u.profile.firstName || '',
          lastName: u.profile.lastName || '',
          phone: u.profile.phone || null,
          email: u.email,
          dob: u.profile.dob,
          birthdayOn: candidate,
          daysUntilBirthday: Math.max(0, daysUntil),
          loyaltyPoints: u.customer?.loyaltyPoints ?? 0,
          totalSpent: Number(u.customer?.totalSpent ?? 0),
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    return withUpcoming.sort((a, b) => a.daysUntilBirthday - b.daysUntilBirthday);
  }
}
