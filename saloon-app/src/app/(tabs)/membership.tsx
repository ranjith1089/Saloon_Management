import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, SectionHeader } from '@/components/salon/ui';
import { Brand, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api, unwrap } from '@/lib/api';
import { money } from '@/lib/format';
import { useAuth } from '@/store/auth';

function planDuration(days?: number) {
  if (!days) return '';
  if (days % 365 === 0) return `${days / 365} year${days === 365 ? '' : 's'}`;
  if (days % 30 === 0) return `${days / 30} month${days === 30 ? '' : 's'}`;
  return `${days} days`;
}
function fmtDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}
function daysLeft(iso?: string) {
  if (!iso) return 0;
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));
}

export default function MembershipScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const activeQ = useQuery({
    queryKey: ['active-membership', user?.id],
    queryFn: async () => unwrap<any>(await api.get(`/memberships/active/${user?.id}`)),
    enabled: !!user?.id,
  });

  const plansQ = useQuery({
    queryKey: ['membership-plans'],
    queryFn: async () => unwrap<any[]>(await api.get('/membership-plans')),
  });

  const active = activeQ.data;
  const plans = (plansQ.data ?? []).filter((p) => p.isActive && p.id !== active?.plan?.id);

  return (
    <View style={{ flex: 1, backgroundColor: t.screen }}>
      <View style={[styles.header, { backgroundColor: t.card, borderBottomColor: t.border, paddingTop: insets.top + 12 }]}>
        <Text style={[styles.title, { color: t.text }]}>My Membership</Text>
        <Text style={[styles.sub, { color: t.faint }]}>Your active plan & benefits</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {activeQ.isLoading ? (
          <Card style={{ alignItems: 'center', paddingVertical: 28 }}>
            <ActivityIndicator color={Brand.primary} />
          </Card>
        ) : active ? (
          <LinearGradient colors={['#7c2d12', '#b45309']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gold}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
              <View style={styles.crown}>
                <Ionicons name="diamond" size={24} color="#fff" />
              </View>
              <View>
                <Text style={styles.goldName}>{active.plan?.name}</Text>
                <Text style={styles.goldDesc}>Member pricing on every service</Text>
              </View>
            </View>
            <View style={styles.goldStats}>
              <View style={styles.goldStat}>
                <Text style={styles.goldStatL}>Valid until</Text>
                <Text style={styles.goldStatV}>{fmtDate(active.endDate)}</Text>
              </View>
              <View style={styles.goldStat}>
                <Text style={styles.goldStatL}>Days left</Text>
                <Text style={styles.goldStatV}>{daysLeft(active.endDate)}</Text>
              </View>
              <View style={styles.goldStat}>
                <Text style={styles.goldStatL}>Paid</Text>
                <Text style={styles.goldStatV}>{money(active.paidAmount)}</Text>
              </View>
            </View>
          </LinearGradient>
        ) : (
          <Card style={{ alignItems: 'center', paddingVertical: 28, gap: 6 }}>
            <Ionicons name="diamond-outline" size={32} color={t.faint} />
            <Text style={{ color: t.text, fontWeight: '600' }}>No active membership</Text>
            <Text style={{ color: t.faint, fontSize: 12, textAlign: 'center' }}>
              Browse the plans below and request one.
            </Text>
          </Card>
        )}

        <SectionHeader title={active ? 'Other plans' : 'Available plans'} />

        {plansQ.isLoading ? (
          <Card style={{ alignItems: 'center', paddingVertical: 20 }}>
            <ActivityIndicator color={Brand.primary} />
          </Card>
        ) : (
          plans.map((p) => (
            <Card key={p.id} style={{ borderTopWidth: 4, borderTopColor: p.color || Brand.indigo }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.planName, { color: t.text }]}>{p.name}</Text>
                  {!!p.description && <Text style={[styles.planDesc, { color: t.faint }]}>{p.description}</Text>}
                </View>
                <Ionicons name="diamond-outline" size={22} color={p.color || Brand.indigo} />
              </View>
              <Text style={[styles.planPrice, { color: t.text }]}>
                {money(p.price)} <Text style={[styles.planPer, { color: t.faint }]}>/ {planDuration(p.durationDays)}</Text>
              </Text>
              <View style={styles.reqBtn}>
                <Ionicons name="paper-plane-outline" size={15} color="#fff" />
                <Text style={styles.reqText}>Request this plan</Text>
              </View>
            </Card>
          ))
        )}

        <Text style={[styles.note, { color: t.faint }]}>
          Requesting notifies the salon — enrolment & payment are completed at the counter.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  title: { fontSize: 19, fontWeight: '800', letterSpacing: -0.2 },
  sub: { fontSize: 12, marginTop: 2 },
  body: { padding: 16, gap: 13, paddingBottom: 28 },
  gold: { borderRadius: Radius.lg, padding: 18 },
  crown: { width: 46, height: 46, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  goldName: { fontSize: 19, fontWeight: '800', color: '#fff' },
  goldDesc: { fontSize: 12, color: '#fde68a', marginTop: 2 },
  goldStats: { flexDirection: 'row', gap: 8, marginTop: 16 },
  goldStat: { flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 11, padding: 10 },
  goldStatL: { fontSize: 10, color: '#fde68a', textTransform: 'uppercase' },
  goldStatV: { fontSize: 14, fontWeight: '700', color: '#fff', marginTop: 3 },
  planName: { fontSize: 16, fontWeight: '800' },
  planDesc: { fontSize: 12, marginTop: 2 },
  planPrice: { fontSize: 22, fontWeight: '800', marginTop: 10 },
  planPer: { fontSize: 12, fontWeight: '500' },
  reqBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: Brand.primary,
    height: 42,
    borderRadius: 11,
    marginTop: 12,
  },
  reqText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  note: { fontSize: 11, paddingHorizontal: 2 },
});
