import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { View } from 'react-native';

import { Brand } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/store/auth';

export default function TabsLayout() {
  const t = useTheme();
  const { user, loading } = useAuth();

  // Gate the whole tab app behind auth.
  if (loading) return <View style={{ flex: 1, backgroundColor: t.screen }} />;
  if (!user) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Brand.primary,
        tabBarInactiveTintColor: t.faint,
        tabBarStyle: { backgroundColor: t.card, borderTopColor: t.border },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Bookings',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="membership"
        options={{
          title: 'Membership',
          tabBarIcon: ({ color, size }) => <Ionicons name="diamond-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
