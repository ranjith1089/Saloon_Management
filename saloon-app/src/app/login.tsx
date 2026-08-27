import { Ionicons } from '@expo/vector-icons';
import { Redirect } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/store/auth';

export default function LoginScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { user, loading, signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <View style={{ flex: 1, backgroundColor: t.screen }} />;
  if (user) return <Redirect href="/" />;

  const onSubmit = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError('Enter your email and password');
      return;
    }
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
    } catch (e: any) {
      const status = e?.response?.status;
      setError(status === 401 ? 'Invalid email or password' : e?.response?.data?.message || 'Could not sign in. Check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: t.screen }}>
      <View style={[styles.container, { paddingTop: insets.top + 40 }]}>
        <View style={styles.logoWrap}>
          <View style={styles.logo}>
            <Ionicons name="cut" size={28} color="#fff" />
          </View>
          <Text style={styles.brand}>Studie&apos;o</Text>
          <Text style={[styles.tagline, { color: t.muted }]}>Sign in to your account</Text>
        </View>

        <View style={{ gap: 14 }}>
          <View>
            <Text style={[styles.label, { color: t.muted }]}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@email.com"
              placeholderTextColor={t.faint}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              style={[styles.input, { color: t.text, borderColor: t.border, backgroundColor: t.card }]}
            />
          </View>

          <View>
            <Text style={[styles.label, { color: t.muted }]}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={t.faint}
              secureTextEntry
              style={[styles.input, { color: t.text, borderColor: t.border, backgroundColor: t.card }]}
            />
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={Brand.primary} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Pressable
            onPress={onSubmit}
            disabled={submitting}
            style={({ pressed }) => [styles.btn, (pressed || submitting) && { opacity: 0.85 }]}>
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Sign In</Text>
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, gap: 36 },
  logoWrap: { alignItems: 'center', gap: 10 },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: { fontSize: 26, fontWeight: '800', color: Brand.primary, letterSpacing: -0.4 },
  tagline: { fontSize: 14 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  errorText: { color: Brand.primary, fontSize: 13, fontWeight: '500', flex: 1 },
  btn: {
    backgroundColor: Brand.primary,
    height: 50,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
