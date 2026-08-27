import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar, Badge, Card, IconCircle, SectionHeader } from '@/components/salon/ui';
import { BookingStatus, Brand, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api, unwrap } from '@/lib/api';
import { dateParts, fullName, initials, timeRange } from '@/lib/format';
import { useAuth } from '@/store/auth';

const POINTS_GOAL = 500;
const UPCOMING_STATUSES = ['PENDING', 'CONFIRMED', 'IN_PROGRESS'];

export default function HomeScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const p = user?.profile;

  const bookingsQ = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => unwrap<any[]>(await api.get('/bookings?limit=200')),
  });

  const membershipQ = useQuery({
    queryKey: ['active-membership', user?.id],
    queryFn: async () => unwrap<any>(await api.get(`/memberships/active/${user?.id}`)),
    enabled: !!user?.id,
  });

  const points = user?.customer?.loyaltyPoints ?? 0;
  const pct = Math.min(100, Math.round((points / POINTS_GOAL) * 100));
  const toGoal = Math.max(0, POINTS_GOAL - points);

  const upcoming = (bookingsQ.data ?? [])
    .filter((b) => UPCOMING_STATUSES.includes(b.status))
    .sort((a, b) => new Date(a.bookingDate).getTime() - new Date(b.bookingDate).getTime())
    .slice(0, 3);

  const membershipName = membershipQ.data?.plan?.name ?? 'None';

  return (
    <View style={{ flex: 1, backgroundColor: t.screen }}>
      <View style={[styles.header, { backgroundColor: t.card, borderBottomColor: t.border, paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={styles.brand}>Studie&apos;o</Text>
          <Text style={[styles.brandSub, { color: t.faint }]}>Koramangala · Bengaluru</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View>
            <Ionicons name="notifications-outline" size={22} color={t.text} />
            <View style={styles.dot} />
          </View>
          <Avatar initials={initials(p?.firstName, p?.lastName)} size={38} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View>
          <Text style={{ color: t.muted, fontSize: 13 }}>Welcome back,</Text>
          <Text style={[styles.name, { color: t.text }]}>{fullName(p?.firstName, p?.lastName)}</Text>
        </View>

        {/* Loyalty hero */}
        <LinearGradient colors={[Brand.primary, Brand.primaryDeep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View>
              <Text style={styles.heroLabel}>LOYALTY POINTS</Text>
              <Text style={styles.heroNum}>
                {points} <Text style={styles.heroNumSub}>/ {POINTS_GOAL}</Text>
              </Text>
            </View>
            <Ionicons name="sparkles" size={24} color="#fff" />
          </View>
          <View style={styles.bar}>
            <View style={[styles.barFill, { width: `${pct}%` }]} />
          </View>
          <Text style={styles.heroHint}>
            {toGoal > 0 ? `${toGoal} points to your next free service` : 'Free service unlocked!'}
          </Text>
        </LinearGradient>

        {/* Quick tiles */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Card style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 11, padding: 13 }}>
            <IconCircle name="calendar-outline" color={Brand.blue} bg={Brand.blueBg} />
            <View>
              <Text style={[styles.tileLabel, { color: t.muted }]}>Upcoming</Text>
              <Text style={[styles.tileVal, { color: t.text }]}>{upcoming.length} visits</Text>
            </View>
          </Card>
          <Card style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 11, padding: 13 }}>
            <IconCircle name="diamond-outline" color={Brand.amber} bg={Brand.amberBg} />
            <View>
              <Text style={[styles.tileLabel, { color: t.muted }]}>Membership</Text>
              <Text style={[styles.tileVal, { color: t.text }]}>{membershipName}</Text>
            </View>
          </Card>
        </View>

        <SectionHeader title="Upcoming appointments" action="See all" />

        {bookingsQ.isLoading ? (
          <Card style={{ alignItems: 'center', paddingVertical: 28 }}>
            <ActivityIndicator color={Brand.primary} />
          </Card>
        ) : upcoming.length === 0 ? (
          <Card style={{ alignItems: 'center', paddingVertical: 28, gap: 6 }}>
            <Ionicons name="calendar-outline" size={30} color={t.faint} />
            <Text style={{ color: t.muted, fontSize: 13 }}>No upcoming appointments</Text>
          </Card>
        ) : (
          <Card style={{ padding: 0 }}>
            {upcoming.map((b, i) => {
              const s = BookingStatus[b.status] ?? BookingStatus.PENDING;
              const d = dateParts(b.bookingDate);
              const staff = b.staff?.user?.profile?.firstName;
              return (
                <View key={b.id} style={[styles.appt, i > 0 && { borderTopWidth: 1, borderTopColor: t.border }]}>
                  <View style={styles.dateBox}>
                    <Text style={[styles.dMon, { color: t.faint }]}>{d.mon}</Text>
                    <Text style={styles.dDay}>{d.day}</Text>
                    <Text style={[styles.dDow, { color: t.faint }]}>{d.dow}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.apptName, { color: t.text }]}>{b.service?.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 }}>
                      <Ionicons name="time-outline" size={13} color={t.faint} />
                      <Text style={{ color: t.muted, fontSize: 12 }}>
                        {timeRange(b.startTime, b.endTime)}
                        {staff ? ` · with ${staff}` : ''}
                      </Text>
                    </View>
                    <View style={{ marginTop: 7 }}>
                      <Badge label={s.label} fg={s.fg} bg={s.bg} />
                    </View>
                  </View>
                </View>
              );
            })}
          </Card>
        )}

        <Pressable
          style={({ pressed }) => [styles.bookBtn, pressed && { opacity: 0.9 }]}
          onPress={() => router.push('/book')}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.bookBtnText}>Book an appointment</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: { fontSize: 20, fontWeight: '800', color: Brand.primary, letterSpacing: -0.3 },
  brandSub: { fontSize: 11, fontWeight: '500', marginTop: 3 },
  dot: { position: 'absolute', top: -1, right: -1, width: 8, height: 8, borderRadius: 4, backgroundColor: Brand.primary, borderWidth: 1.5, borderColor: '#fff' },
  body: { padding: 16, gap: 14, paddingBottom: 28 },
  name: { fontSize: 19, fontWeight: '800', letterSpacing: -0.2, marginTop: 1 },
  hero: { borderRadius: Radius.lg, padding: 18 },
  heroLabel: { fontSize: 11, letterSpacing: 1, color: '#fecaca', fontWeight: '700' },
  heroNum: { fontSize: 30, fontWeight: '800', color: '#fff', marginTop: 6, letterSpacing: -0.5 },
  heroNumSub: { fontSize: 16, fontWeight: '600', color: '#fecaca' },
  bar: { height: 7, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.28)', marginTop: 12, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 99, backgroundColor: '#fff' },
  heroHint: { fontSize: 12, color: '#fee2e2', marginTop: 9 },
  tileLabel: { fontSize: 11, fontWeight: '500' },
  tileVal: { fontSize: 16, fontWeight: '700', marginTop: 1 },
  appt: { flexDirection: 'row', gap: 12, alignItems: 'center', padding: 14 },
  dateBox: { width: 46, alignItems: 'center' },
  dMon: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
  dDay: { fontSize: 20, fontWeight: '800', color: Brand.primary, lineHeight: 24 },
  dDow: { fontSize: 10 },
  apptName: { fontSize: 14, fontWeight: '600' },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Brand.primary,
    height: 50,
    borderRadius: 12,
  },
  bookBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
