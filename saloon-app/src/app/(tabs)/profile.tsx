import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, IconCircle } from '@/components/salon/ui';
import { Brand, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { fullName, initials } from '@/lib/format';
import { useAuth } from '@/store/auth';

type MenuItem = {
  icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;
  label: string;
  color: string;
  bg: string;
  tag?: string;
};

const MENU: MenuItem[] = [
  { icon: 'receipt-outline', label: 'Payment history', color: Brand.indigo, bg: Brand.indigoBg },
  { icon: 'gift-outline', label: 'Refer & earn', color: Brand.primary, bg: Brand.primaryLight, tag: '+100 pts' },
  { icon: 'star-outline', label: 'My reviews', color: '#d97706', bg: Brand.amberBg },
  { icon: 'notifications-outline', label: 'Notifications', color: '#0284c7', bg: '#e0f2fe' },
  { icon: 'shield-checkmark-outline', label: 'Data & privacy', color: '#4b5563', bg: '#f3f4f6' },
];

export default function ProfileScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const p = user?.profile;

  return (
    <View style={{ flex: 1, backgroundColor: t.screen }}>
      <View style={[styles.header, { backgroundColor: t.card, borderBottomColor: t.border, paddingTop: insets.top + 12 }]}>
        <Text style={[styles.title, { color: t.text }]}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18 }}>
          <LinearGradient colors={[Brand.primary, Brand.primaryDeep]} style={styles.bigAva}>
            <Text style={styles.bigAvaText}>{initials(p?.firstName, p?.lastName)}</Text>
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={[styles.pName, { color: t.text }]}>{fullName(p?.firstName, p?.lastName)}</Text>
            <View style={styles.pMeta}>
              <Ionicons name="mail-outline" size={12} color={t.faint} />
              <Text style={[styles.pMetaText, { color: t.muted }]}>{user?.email}</Text>
            </View>
            <View style={styles.pMeta}>
              <Ionicons name="call-outline" size={12} color={t.faint} />
              <Text style={[styles.pMetaText, { color: t.muted }]}>{p?.phone || 'Add your phone number'}</Text>
            </View>
          </View>
          <View style={[styles.edit, { backgroundColor: Brand.primaryTint }]}>
            <Ionicons name="create-outline" size={16} color={Brand.primary} />
          </View>
        </Card>

        {/* Menu */}
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {MENU.map((m, i) => (
            <View key={m.label} style={[styles.mi, i < MENU.length - 1 && { borderBottomWidth: 1, borderBottomColor: t.border }]}>
              <IconCircle name={m.icon} color={m.color} bg={m.bg} size={34} />
              <Text style={[styles.miText, { color: t.text }]}>{m.label}</Text>
              {m.tag && (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{m.tag}</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={16} color={t.faint} />
            </View>
          ))}
        </Card>

        <Pressable
          onPress={signOut}
          style={({ pressed }) => [styles.logout, { backgroundColor: t.card, borderColor: '#fecaca' }, pressed && { opacity: 0.7 }]}>
          <Ionicons name="log-out-outline" size={17} color={Brand.primary} />
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  title: { fontSize: 19, fontWeight: '800', letterSpacing: -0.2 },
  body: { padding: 16, gap: 12, paddingBottom: 28 },
  bigAva: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  bigAvaText: { color: '#fff', fontWeight: '800', fontSize: 21 },
  pName: { fontSize: 17, fontWeight: '800' },
  pMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  pMetaText: { fontSize: 12 },
  edit: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  mi: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingHorizontal: 16, paddingVertical: 14 },
  miText: { fontSize: 14, fontWeight: '600', flex: 1 },
  tag: { backgroundColor: Brand.primaryLight, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2, marginRight: 6 },
  tagText: { fontSize: 11, fontWeight: '700', color: Brand.primary },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: 14,
  },
  logoutText: { color: Brand.primary, fontWeight: '600', fontSize: 14 },
});
