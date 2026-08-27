import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api, unwrap } from '@/lib/api';
import { initials, money } from '@/lib/format';
import { useAuth } from '@/store/auth';

function next14Days() {
  const out: { iso: string; day: string; dow: string }[] = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    out.push({
      iso: d.toISOString().slice(0, 10),
      day: String(d.getDate()).padStart(2, '0'),
      dow: i === 0 ? 'Today' : d.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase(),
    });
  }
  return out;
}

export default function BookScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { user } = useAuth();

  const [branchId, setBranchId] = useState<string>('');
  const [service, setService] = useState<any>(null);
  const [staffId, setStaffId] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');

  const dates = useMemo(next14Days, []);

  const branchesQ = useQuery({
    queryKey: ['public-branches'],
    queryFn: async () => unwrap<any[]>(await api.get('/public/branches')),
  });
  const servicesQ = useQuery({
    queryKey: ['public-services', branchId],
    queryFn: async () => unwrap<any[]>(await api.get(`/public/branches/${branchId}/services`)),
    enabled: !!branchId,
  });
  const staffQ = useQuery({
    queryKey: ['public-staff', branchId, service?.id],
    queryFn: async () => unwrap<any[]>(await api.get(`/public/branches/${branchId}/staff`, { params: { serviceId: service.id } })),
    enabled: !!branchId && !!service?.id,
  });
  const slotsQ = useQuery({
    queryKey: ['public-slots', branchId, staffId, service?.id, date],
    queryFn: async () => unwrap<any[]>(await api.get(`/public/branches/${branchId}/slots`, { params: { staffId, serviceId: service.id, date } })),
    enabled: !!branchId && !!staffId && !!service?.id && !!date,
  });

  const submit = useMutation({
    mutationFn: async () => {
      if (!user?.id || !branchId || !service || !staffId || !date || !time) throw new Error('Complete every step');
      return api.post('/bookings', {
        customerId: user.id,
        branchId,
        serviceId: service.id,
        staffId,
        bookingDate: date,
        startTime: time,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      Alert.alert('Booking requested', 'The salon will confirm your appointment shortly.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: (e: any) => Alert.alert('Could not book', e?.response?.data?.message || 'Please try again.'),
  });

  const canSubmit = !!(branchId && service && staffId && date && time);

  return (
    <View style={{ flex: 1, backgroundColor: t.screen }}>
      <View style={[styles.header, { backgroundColor: t.card, borderBottomColor: t.border, paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="close" size={24} color={t.text} />
        </Pressable>
        <Text style={[styles.title, { color: t.text }]}>Book appointment</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Branch */}
        <Text style={[styles.label, { color: t.text }]}>Choose a branch</Text>
        {branchesQ.isLoading ? (
          <ActivityIndicator color={Brand.primary} />
        ) : (
          <View style={styles.chips}>
            {(branchesQ.data ?? []).map((b) => {
              const on = branchId === b.id;
              return (
                <Pressable
                  key={b.id}
                  onPress={() => { setBranchId(b.id); setService(null); setStaffId(''); setTime(''); }}
                  style={[styles.chip, { borderColor: on ? Brand.primary : t.border, backgroundColor: on ? Brand.primaryTint : t.card }]}>
                  <Text style={{ color: on ? Brand.primaryDark : t.text, fontWeight: '600', fontSize: 13 }}>{b.name}</Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Service */}
        {!!branchId && (
          <>
            <Text style={[styles.label, { color: t.text }]}>Select a service</Text>
            {servicesQ.isLoading ? (
              <ActivityIndicator color={Brand.primary} />
            ) : (
              (servicesQ.data ?? []).map((s) => {
                const on = service?.id === s.id;
                return (
                  <Pressable
                    key={s.id}
                    onPress={() => { setService(s); setStaffId(''); setTime(''); }}
                    style={[styles.svc, { borderColor: on ? Brand.primary : t.border, backgroundColor: on ? Brand.primaryTint : t.card }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.svcName, { color: t.text }]}>{s.name}</Text>
                      <Text style={[styles.svcMeta, { color: t.faint }]}>{s.duration} min</Text>
                    </View>
                    <Text style={styles.svcPrice}>{money(s.price)}</Text>
                    {on && <Ionicons name="checkmark-circle" size={22} color={Brand.primary} style={{ marginLeft: 10 }} />}
                  </Pressable>
                );
              })
            )}
          </>
        )}

        {/* Staff */}
        {!!service && (
          <>
            <Text style={[styles.label, { color: t.text }]}>Choose your stylist</Text>
            {staffQ.isLoading ? (
              <ActivityIndicator color={Brand.primary} />
            ) : (staffQ.data ?? []).length === 0 ? (
              <Text style={{ color: t.faint, fontSize: 12 }}>No stylist available for this service here.</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                {(staffQ.data ?? []).map((st) => {
                  const on = staffId === st.id;
                  const first = st.user?.profile?.firstName;
                  const last = st.user?.profile?.lastName;
                  return (
                    <Pressable key={st.id} onPress={() => { setStaffId(st.id); setTime(''); }} style={{ alignItems: 'center', width: 62, gap: 5 }}>
                      <View style={[styles.stf, { backgroundColor: on ? Brand.primaryLight : t.card, borderColor: on ? Brand.primary : t.border }]}>
                        <Text style={{ color: on ? Brand.primaryDark : t.muted, fontWeight: '700', fontSize: 15 }}>{initials(first, last)}</Text>
                      </View>
                      <Text style={{ color: on ? Brand.primaryDark : t.muted, fontSize: 11, fontWeight: '600' }} numberOfLines={1}>{first || 'Staff'}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
          </>
        )}

        {/* Date */}
        {!!staffId && (
          <>
            <Text style={[styles.label, { color: t.text }]}>Pick a date</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {dates.map((d) => {
                const on = date === d.iso;
                return (
                  <Pressable
                    key={d.iso}
                    onPress={() => { setDate(d.iso); setTime(''); }}
                    style={[styles.dchip, { borderColor: on ? Brand.primary : t.border, backgroundColor: on ? Brand.primary : t.card }]}>
                    <Text style={{ fontSize: 10, fontWeight: '600', color: on ? '#fecaca' : t.faint }}>{d.dow}</Text>
                    <Text style={{ fontSize: 17, fontWeight: '800', color: on ? '#fff' : t.text }}>{d.day}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </>
        )}

        {/* Time */}
        {!!date && (
          <>
            <Text style={[styles.label, { color: t.text }]}>Available times</Text>
            {slotsQ.isLoading ? (
              <ActivityIndicator color={Brand.primary} />
            ) : (slotsQ.data ?? []).length === 0 ? (
              <Text style={{ color: t.faint, fontSize: 12 }}>No slots available on this day.</Text>
            ) : (
              <View style={styles.slots}>
                {(slotsQ.data ?? []).map((sl) => {
                  const on = time === sl.startTime;
                  return (
                    <Pressable
                      key={sl.startTime}
                      disabled={!sl.available}
                      onPress={() => setTime(sl.startTime)}
                      style={[
                        styles.slot,
                        { borderColor: on ? Brand.primary : t.border, backgroundColor: on ? Brand.primary : !sl.available ? t.screen : t.card },
                      ]}>
                      <Text style={{ fontSize: 12.5, fontWeight: '600', color: on ? '#fff' : !sl.available ? t.faint : t.text, textDecorationLine: sl.available ? 'none' : 'line-through' }}>
                        {sl.startTime}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Sticky confirm */}
      <View style={[styles.cta, { backgroundColor: t.card, borderTopColor: t.border, paddingBottom: insets.bottom + 12 }]}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, color: t.faint }}>{service ? `${service.name}${time ? ` · ${time}` : ''}` : 'Select a service'}</Text>
          <Text style={{ fontSize: 18, fontWeight: '800', color: t.text }}>{service ? money(service.price) : '—'}</Text>
        </View>
        <Pressable
          disabled={!canSubmit || submit.isPending}
          onPress={() => submit.mutate()}
          style={({ pressed }) => [styles.confirm, { opacity: !canSubmit ? 0.4 : pressed ? 0.85 : 1 }]}>
          {submit.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmText}>Confirm booking</Text>}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 17, fontWeight: '700' },
  body: { padding: 16, gap: 10, paddingBottom: 24 },
  label: { fontSize: 13, fontWeight: '700', marginTop: 8, marginBottom: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1.5, borderRadius: Radius.pill, paddingHorizontal: 14, paddingVertical: 9 },
  svc: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 13, padding: 13 },
  svcName: { fontSize: 14, fontWeight: '600' },
  svcMeta: { fontSize: 12, marginTop: 2 },
  svcPrice: { fontSize: 14, fontWeight: '800', color: Brand.primary },
  stf: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  dchip: { width: 54, borderWidth: 1.5, borderRadius: 12, paddingVertical: 9, alignItems: 'center', gap: 2 },
  slots: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slot: { width: '22%', borderWidth: 1.5, borderRadius: 10, paddingVertical: 9, alignItems: 'center' },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  confirm: {
    backgroundColor: Brand.primary,
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
