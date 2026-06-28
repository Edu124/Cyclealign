import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Button, Screen } from '@/components/ui';
import { Logo3D } from '@/components/logo/Logo3D';
import { useOnboarding } from '@/lib/stores/useOnboarding';
import { useAppStore } from '@/lib/stores/useAppStore';
import { pushCycleLog, pushProfile } from '@/lib/sync';
import { CycleLog, Profile } from '@/types/models';
import { palette, spacing } from '@/theme';

export default function Done() {
  const draft = useOnboarding();
  const { setProfile, addCycleLog, completeOnboarding } = useAppStore();
  const [saving, setSaving] = useState(true);

  useEffect(() => {
    const save = async () => {
      const id = `local-${Date.now()}`;
      const profile: Profile = {
        id,
        name: draft.name.trim() || 'Friend',
        gender: draft.gender ?? 'prefer_not_to_say',
        birthDate: draft.birthDate ?? '',
        avgCycleLength: draft.avgCycleLength,
        avgPeriodLength: draft.avgPeriodLength,
        role: draft.role ?? undefined,
      };
      const log: CycleLog = {
        id: `log-${Date.now()}`,
        userId: id,
        startDate: draft.lastPeriodStart ?? '',
        endDate: null,
      };

      // Local store first (instant, offline-safe), then mirror to Supabase.
      setProfile(profile);
      if (log.startDate) addCycleLog(log);
      completeOnboarding();

      try {
        await pushProfile(profile);
        if (log.startDate) await pushCycleLog(log);
      } catch {
        // Non-fatal: local mode continues to work.
      }
      setSaving(false);
    };
    save();
    // Run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Screen scroll={false} contentStyle={styles.content}>
      <View style={styles.hero}>
        <Animated.View entering={FadeIn.duration(700)}>
          <Logo3D size={180} />
        </Animated.View>
        <Animated.Text entering={FadeInDown.delay(300).duration(600)} style={styles.title}>
          You're all set, {draft.name.trim() || 'friend'}!
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(450).duration(600)} style={styles.subtitle}>
          Your hormonal intelligence is ready. Your Today briefing shows what
          your body does best right now — and how to plan the week ahead.
        </Animated.Text>
      </View>

      <Animated.View entering={FadeInDown.delay(600).duration(600)}>
        <Button
          label="Enter CycleAlign"
          loading={saving}
          onPress={() => router.replace('/(tabs)/today')}
        />
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'space-between', paddingVertical: spacing.xxl },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: palette.ink,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: palette.inkSoft,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
});
