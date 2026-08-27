import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge, Card } from '@/components/salon/ui';
import { BookingStatus, Brand } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api, unwrap } from '@/lib/api';
import { dateParts, money, timeRange } from '@/lib/format';

const ACTIVE = ['PENDING', 'CONFIRMED', 'IN_PROGRESS'];

function startMs(b: any) {
  const d = new Date(b.bookingDate);
  const [h, m] = String(b.startTime || '0:0').split(':').map(Number);
  d.setHours(h || 0, m || 0, 0, 0);
  return d.getTime();
}
function canCancel(b: any) {
  if (!ACTIVE.includes(b.status)) return false;
  return (startMs(b) - Date.now()) / 3_600_000 >= 2;
}

export default function BookingsScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

  const { data, isLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => unwrap<any[]>(await api.get('/bookings?limit=200')),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) =>
      api.patch(`/bookings/${id}/status`, { status: 'CANCELLED', cancelReason: 'Cancelled by customer' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      Alert.alert('Booking cancelled');
    },
    onError: (e: any) =>
      Alert.alert('Could not cancel', e?.response?.data?.message || 'Please try again.'),
  });

  const confirmCancel = (b: any) => {
    Alert.alert('Cancel appointment?', `${b.service?.name} on ${dateParts(b.bookingDate).mon} ${dateParts(b.bookingDate).day}`, [
      { text: 'Keep', style: 'cancel' },
      { text: 'Cancel booking', style: 'destructive', onPress: () => cancelMutation.mutate(b.id) },
    ]);
  };

  const { upcoming, past } = useMemo(() => {
    const all = data ?? [];
    const now = Date.now();
    const up = all
      .filter((b) => ACTIVE.includes(b.status) && startMs(b) >= now - 3_600_000)
      .sort((a, b) => startMs(a) - startMs(b));
    const pastList = all.filter((b) => !up.includes(b)).sort((a, b) => startMs(b) - startMs(a));
    return { upcoming: up, past: pastList };
  }, [data]);

  const list = tab === 'upcoming' ? upcoming : past;

  return (
    <View style={{ flex: 1, backgroundColor: t.screen }}>
      <View style={[styles.header, { backgroundColor: t.card, borderBottomColor: t.border, paddingTop: insets.top + 12 }]}>
        <Text style={[styles.title, { color: t.text }]}>My Bookings</Text>
        <Pressable style={styles.plus} onPress={() => router.push('/book')}>
          <Ionicons name="add" size={22} color="#fff" />
        </Pressable>
      </View>

      <View style={[styles.segWrap, { backgroundColor: t.card }]}>
        <View style={[styles.seg, { backgroundColor: t.screen }]}>
          {(['upcoming', 'past'] as const).map((k) => (
            <Pressable key={k} style={[styles.segBtn, tab === k && { backgroundColor: t.card }]} onPress={() => setTab(k)}>
              <Text style={[styles.segText, { color: tab === k ? t.text : t.muted }]}>
                {k === 'upcoming' ? `Upcoming${upcoming.length ? ` (${upcoming.length})` : ''}` : 'Past'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={{ paddingVertical: 40 }}>
            <ActivityIndicator color={Brand.primary} />
          </View>
        ) : list.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 48, gap: 8 }}>
            <Ionicons name="calendar-outline" size={36} color={t.faint} />
            <Text style={{ color: t.muted }}>No {tab} appointments</Text>
          </View>
        ) : (
          list.map((b) => {
            const s = BookingStatus[b.status] ?? BookingStatus.PENDING;
            const d = dateParts(b.bookingDate);
            const staff = b.staff?.user?.profile?.firstName;
            return (
              <Card key={b.id} style={{ flexDirection: 'row', gap: 12, padding: 14 }}>
                <View style={styles.dateBox}>
                  <Text style={[styles.dMon, { color: t.faint }]}>{d.mon}</Text>
                  <Text style={styles.dDay}>{d.day}</Text>
                  <Text style={[styles.dDow, { color: t.faint }]}>{d.dow}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <Text style={[styles.name, { color: t.text }]}>{b.service?.name}</Text>
                    <Badge label={s.label} fg={s.fg} bg={s.bg} />
                  </View>
                  <View style={styles.metaRow}>
                    <Ionicons name="time-outline" size={13} color={t.faint} />
                    <Text style={[styles.meta, { color: t.muted }]}>{timeRange(b.startTime, b.endTime)}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Ionicons name="person-outline" size={13} color={t.faint} />
                    <Text style={[styles.meta, { color: t.muted }]}>
                      {staff ? `${staff} · ` : ''}{b.branch?.name}
                    </Text>
                  </View>
                  {canCancel(b) && (
                    <Pressable
                      style={[styles.metaRow, { marginTop: 8 }]}
                      disabled={cancelMutation.isPending}
                      onPress={() => confirmCancel(b)}>
                      <Ionicons name="close-circle-outline" size={14} color={Brand.primary} />
                      <Text style={styles.cancel}>Cancel</Text>
                    </Pressable>
                  )}
                </View>
                <Text style={styles.price}>{money(b.totalAmount)}</Text>
              </Card>
            );
          })
        )}
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
  title: { fontSize: 19, fontWeight: '800', letterSpacing: -0.2 },
  plus: { width: 36, height: 36, borderRadius: 11, backgroundColor: Brand.primary, alignItems: 'center', justifyContent: 'center' },
  segWrap: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  seg: { flexDirection: 'row', borderRadius: 11, padding: 3 },
  segBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 9 },
  segText: { fontSize: 13, fontWeight: '600' },
  body: { padding: 16, gap: 12, paddingBottom: 28 },
  dateBox: { width: 48, alignItems: 'center' },
  dMon: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
  dDay: { fontSize: 22, fontWeight: '800', color: Brand.primary, lineHeight: 26 },
  dDow: { fontSize: 10 },
  name: { fontSize: 14.5, fontWeight: '700' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  meta: { fontSize: 12 },
  cancel: { fontSize: 12, color: Brand.primary, fontWeight: '600' },
  price: { fontSize: 15, fontWeight: '800', color: Brand.primary },
});
