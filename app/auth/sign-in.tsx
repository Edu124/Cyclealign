import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Button, Screen, TextField } from '@/components/ui';
import { Logo3D } from '@/components/logo/Logo3D';
import { palette, spacing } from '@/theme';
import { signInWithEmail, signInWithProvider } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/supabase';
import { restoreFromCloud } from '@/lib/restoreSession';

export default function SignIn() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);

  /** Restore the account from the cloud, then route: returning users go
   *  straight to the app; accounts with no profile yet go to onboarding. */
  async function afterSignIn() {
    const hasProfile = await restoreFromCloud().catch(() => false);
    if (hasProfile) {
      router.replace('/(tabs)/today');
    } else {
      router.replace('/onboarding/role');
    }
  }

  const handleSignIn = async () => {
    setLoading(true);
    const res = await signInWithEmail(email.trim(), password);
    if (!res.ok) {
      setLoading(false);
      Alert.alert('Could not sign in', res.error);
    } else {
      await afterSignIn();
      setLoading(false);
    }
  };

  const handleProvider = async (p: 'google' | 'apple') => {
    const res = await signInWithProvider(p);
    if (!res.ok) {
      Alert.alert('Sign-in', res.error ?? 'Failed');
    } else {
      setLoading(true);
      await afterSignIn();
      setLoading(false);
    }
  };

  return (
    <Screen contentStyle={styles.content}>
      <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
        <Logo3D size={140} />
        <Text style={styles.subtitle}>Welcome back</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(150).duration(600)} style={styles.form}>
        <TextField
          label="Email"
          placeholder="you@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextField
          label="Password"
          placeholder="••••••••"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <Button label="Sign in" onPress={handleSignIn} loading={loading} />

        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.or}>or</Text>
          <View style={styles.line} />
        </View>

        <Button
          label="Continue with Google"
          variant="secondary"
          onPress={() => handleProvider('google')}
        />
        <Button
          label="Continue with Apple"
          variant="secondary"
          onPress={() => handleProvider('apple')}
        />

        {!isSupabaseConfigured && (
          <Pressable onPress={() => router.replace('/onboarding/welcome')}>
            <Text style={styles.demo}>
              Running in demo mode — tap to get started →
            </Text>
          </Pressable>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>New here? </Text>
          <Link href="/auth/sign-up" style={styles.link}>
            Create an account
          </Link>
        </View>
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.xl, justifyContent: 'center', flexGrow: 1 },
  header: { alignItems: 'center', gap: spacing.sm },
  subtitle: { fontSize: 16, color: palette.inkSoft, marginTop: spacing.sm },
  form: { gap: spacing.lg },
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  line: { flex: 1, height: 1, backgroundColor: palette.line },
  or: { color: palette.muted, fontSize: 13 },
  demo: {
    textAlign: 'center',
    color: palette.lavenderDeep,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  footerText: { color: palette.inkSoft },
  link: { color: palette.roseDeep, fontWeight: '700' },
});
