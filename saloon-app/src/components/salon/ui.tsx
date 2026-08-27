/**
 * Shared salon UI primitives — Card, Badge, Avatar, SectionHeader, IconCircle.
 * Theme-aware (light/dark) via useTheme; brand + status colours from Brand.
 */
import { Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { Brand, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const t = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: t.card, borderColor: t.border }, style]}>
      {children}
    </View>
  );
}

export function Badge({ label, fg, bg }: { label: string; fg: string; bg: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: fg }]}>{label}</Text>
    </View>
  );
}

export function SectionHeader({ title, action }: { title: string; action?: string }) {
  const t = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: t.text }]}>{title}</Text>
      {action ? <Text style={styles.sectionAction}>{action}</Text> : null}
    </View>
  );
}

export function IconCircle({
  name,
  color,
  bg,
  size = 38,
}: {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
  size?: number;
}) {
  return (
    <View style={[styles.iconCircle, { width: size, height: size, backgroundColor: bg }]}>
      <Ionicons name={name} size={size * 0.5} color={color} />
    </View>
  );
}

export function Avatar({ initials, size = 40, bg = Brand.primaryLight, fg = Brand.primaryDark }: {
  initials: string;
  size?: number;
  bg?: string;
  fg?: string;
}) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Text style={{ color: fg, fontWeight: '700', fontSize: size * 0.36 }}>{initials}</Text>
    </View>
  );
}

/** Row of small SVG-style stars using Ionicons (filled / outline). */
export function Stars({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 1 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Ionicons
          key={n}
          name={n <= rating ? 'star' : 'star-outline'}
          size={size}
          color={n <= rating ? Brand.star : '#d1d5db'}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: 16,
  },
  badge: {
    borderRadius: Radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  badgeText: { fontSize: 11, fontWeight: '600' },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  sectionAction: { fontSize: 12, fontWeight: '600', color: Brand.primary },
  iconCircle: {
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: { alignItems: 'center', justifyContent: 'center' },
});
