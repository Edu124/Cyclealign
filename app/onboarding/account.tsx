import { useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Button, Screen, TextField } from '@/components/ui';
import { Logo3D } from '@/components/logo/Logo3D';
import { useOnboarding } from '@/lib/stores/useOnboarding';
import { useAppStore } from '@/lib/stores/useAppStore';
import { signUpWithEmail, signInWithProvider } from '@/lib/auth';
import { pushCycleLog, pushProfile } from '@/lib/sync';
import { isSupabaseConfigured } from '@/lib/supabase';
import type { CycleLog, Profile } from '@/types/models';
import { palette, spacing } from '@/theme';

function webAlert(msg: string) {
  if (Platform.OS === 'web') window.alert(msg);
}

export default function AccountStep() {
  const draft = useOnboarding();
  const { setProfile, addCycleLog, completeOnboarding } = useAppStore();

  const [name,     setName]     = useState(draft.name || '');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [errors,   setErrors]   = useState<{ name?: string; email?: string; password?: string }>({});

  function validate(): boolean {
    const e: typeof errors = {};
    if (!name.trim())         e.name     = 'Please enter your name';
    if (!email.trim())        e.email    = 'Please enter your email';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email address';
    if (password.length < 8) e.password = 'Password must be at least 8 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function buildProfileAndLog(): { profile: Profile; log: CycleLog } {
    const id = `local-${Date.now()}`;
    const profile: Profile = {
      id,
      name:           name.trim() || 'Friend',
      email:          email.trim() || undefined,
      gender:         'female',
      birthDate:      '',
      avgCycleLength:  draft.avgCycleLength,
      avgPeriodLength: draft.avgPeriodLength,
      role:            draft.role ?? undefined,
    };
    const log: CycleLog = {
      id:        `log-${Date.now()}`,
      userId:    id,
      startDate: draft.lastPeriodStart ?? '',
      endDate:   null,
    };
    return { profile, log };
  }

  function saveLocally(profile: Profile, log: CycleLog) {
    setProfile(profile);
    if (log.startDate) addCycleLog(log);
    completeOnboarding();
  }

  async function syncToSupabase(profile: Profile, log: CycleLog) {
    try {
      await pushProfile(profile);
      if (log.startDate) await pushCycleLog(log);
    } catch {
      // Non-fatal.
    }
  }

  function goHome() {
    router.replace('/onboarding/founder');
  }

  const handleCreate = async () => {
    if (!validate()) return;
    setLoading(true);

    if (isSupabaseConfigured) {
      const res = await signUpWithEmail(email.trim(), password, name.trim());
      if (!res.ok) {
        setLoading(false);
        setErrors({ email: res.error });
        return;
      }
    }

    const { profile, log } = buildProfileAndLog();
    saveLocally(profile, log);
    await syncToSupabase(profile, log);
    setLoading(false);
    goHome();
  };

  const handleGoogle = async () => {
    if (!isSupabaseConfigured) {
      webAlert('Google sign-in is available once the backend is connected.');
      return;
    }
    setLoading(true);
    const res = await signInWithProvider('google');
    setLoading(false);
    if (!res.ok) { webAlert(res.error ?? 'Sign-in failed'); return; }
    const { profile, log } = buildProfileAndLog();
    saveLocally(profile, log);
    await syncToSupabase(profile, log);
    goHome();
  };

  const handleSkip = () => {
    const { profile, log } = buildProfileAndLog();
    saveLocally(profile, log);
    syncToSupabase(profile, log);
    goHome();
  };

  return (
    <Screen contentStyle={styles.content}>
      <Animated.View entering={FadeIn.duration(600)} style={styles.hero}>
        <Logo3D size={100} />
        <Text style={styles.title}>
          {name.trim() ? `Almost there, ${name.trim().split(' ')[0]}!` : 'Create your account'}
        </Text>
        <Text style={styles.subtitle}>
          Save your data and access CycleALIGN from any device.
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(180).duration(500)} style={styles.form}>
        {/* Name */}
        <View>
          <TextField
            label="What should we call you?"
            placeholder="Your name"
            value={name}
            onChangeText={(t) => { setName(t); setErrors((e) => ({ ...e, name: undefined })); }}
            autoFocus
          />
          {errors.name ? <Text style={styles.fieldError}>{errors.name}</Text> : null}
        </View>

        {/* Email */}
        <View>
          <TextField
            label="Email"
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={(t) => { setEmail(t); setErrors((e) => ({ ...e, email: undefined })); }}
          />
          {errors.email ? <Text style={styles.fieldError}>{errors.email}</Text> : null}
        </View>

        {/* Password */}
        <View>
          <TextField
            label="Password"
            placeholder="At least 8 characters"
            secureTextEntry
            value={password}
            onChangeText={(t) => { setPassword(t); setErrors((e) => ({ ...e, password: undefined })); }}
          />
          {errors.password ? <Text style={styles.fieldError}>{errors.password}</Text> : null}
        </View>

        <Button
          label="Create account"
          onPress={handleCreate}
          loading={loading}
        />

        <View style={styles.divider}>
          <View style={styles.divLine} />
          <Text style={styles.divText}>or</Text>
          <View style={styles.divLine} />
        </View>

        <Button
          label="Continue with Google"
          variant="secondary"
          onPress={handleGoogle}
        />

        <Pressable onPress={handleSkip} hitSlop={12}>
          <Text style={styles.skipText}>Skip — continue without an account →</Text>
        </Pressable>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(350).duration(500)} style={styles.privacyRow}>
        <Text style={styles.privacyText}>
          🔒 Your data is private and computed on-device. We never sell it.
        </Text>
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content:   { flexGrow: 1, gap: spacing.lg },
  hero:      { alignItems: 'center', gap: spacing.sm, paddingTop: spacing.xl },
  title:     { fontSize: 24, fontWeight: '800', color: palette.ink, textAlign: 'center', letterSpacing: -0.3 },
  subtitle:  { fontSize: 15, color: palette.inkSoft, textAlign: 'center', lineHeight: 22, paddingHorizontal: spacing.md },
  form:      { gap: spacing.md },
  fieldError:{ fontSize: 12, color: '#C2683F', fontWeight: '600', marginTop: 4, marginLeft: 4 },
  divider:   { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  divLine:   { flex: 1, height: 1, backgroundColor: palette.line },
  divText:   { color: palette.muted, fontSize: 13 },
  skipText:  { textAlign: 'center', fontSize: 13, fontWeight: '600', color: palette.lavenderDeep, marginTop: spacing.sm },
  privacyRow:{ borderTopWidth: 1, borderTopColor: palette.line, paddingTop: spacing.lg, marginTop: 'auto' },
  privacyText:{ textAlign: 'center', fontSize: 12, color: palette.muted, lineHeight: 18 },
});
