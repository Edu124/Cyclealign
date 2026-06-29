import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Card, Screen } from '@/components/ui';
import { palette, phaseColors, spacing } from '@/theme';
import { useAppStore } from '@/lib/stores/useAppStore';
import { usePrediction } from '@/lib/hooks/usePrediction';
import { signOut } from '@/lib/auth';

const PHASE_LABELS: Record<string, string> = {
  menstrual: 'Menstrual',
  follicular: 'Follicular',
  ovulation: 'Ovulation',
  luteal: 'Luteal',
};

const PHASE_EMOJI: Record<string, string> = {
  menstrual: '🌙',
  follicular: '🌱',
  ovulation: '✨',
  luteal: '🍂',
};

export default function Profile() {
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const profile = useAppStore((s) => s.profile);
  const prediction = usePrediction();
  const phase = prediction?.currentPhase ?? null;
  const phaseColor = phase ? phaseColors[phase].base : palette.lavenderDeep;

  const initials = profile?.name
    ? profile.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <Screen>
      {/* Avatar + name */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.hero}>
        <View style={[styles.avatar, { backgroundColor: phaseColor + '28', borderColor: phaseColor }]}>
          <Text style={[styles.avatarText, { color: phaseColor }]}>{initials}</Text>
        </View>
        <Text style={styles.name}>{profile?.name ?? 'Your Profile'}</Text>
        {profile?.role && <Text style={styles.role}>{profile.role}</Text>}
      </Animated.View>

      {/* Cycle snapshot */}
      {prediction && phase && (
        <Animated.View entering={FadeInDown.delay(80).duration(400)}>
          <Card>
            <Text style={styles.cardLabel}>CURRENT CYCLE</Text>
            <View style={styles.phaseRow}>
              <View style={[styles.phaseDot, { backgroundColor: phaseColor }]} />
              <Text style={styles.phaseText}>
                {PHASE_EMOJI[phase]} {PHASE_LABELS[phase]} phase — Day {prediction.dayOfCycle} of {prediction.cycleLength}
              </Text>
            </View>
            <Text style={styles.nextPeriod}>
              Next period in {prediction.daysUntilNextPeriod > 0
                ? `${prediction.daysUntilNextPeriod} days`
                : 'approx. today'}
            </Text>
          </Card>
        </Animated.View>
      )}

      {/* Account links */}
      <Animated.View entering={FadeInDown.delay(160).duration(400)}>
        <Card padded={false}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.divider} />
          <LinkRow label="Privacy Settings"  onPress={() => router.push('/privacy-settings')} />
          <View style={styles.divider} />
          <LinkRow label="Terms & Conditions" onPress={() => router.push('/terms')} />
          <View style={styles.divider} />
          <LinkRow label="Go Premium 🌿"      onPress={() => router.push('/paywall')} />
          <View style={styles.divider} />
          <LinkRow label="Contact Us"         onPress={() => Linking.openURL('mailto:hello@cyclealign.app')} />
        </Card>
      </Animated.View>

      {/* Sign out */}
      <Animated.View entering={FadeInDown.delay(240).duration(400)}>
        <Pressable style={styles.signOutBtn} onPress={signOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </Animated.View>

      {/* Footer */}
      <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.footer}>
        <Text style={styles.version}>CycleAlign v{version}</Text>
        <Text style={styles.copyright}>© 2026 CycleAlign</Text>
      </Animated.View>
    </Screen>
  );
}

function LinkRow({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.linkRow}>
      <Text style={styles.linkLabel}>{label}</Text>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 28, fontWeight: '800' },
  name: { fontSize: 22, fontWeight: '800', color: palette.ink },
  role: { fontSize: 14, color: palette.inkSoft, fontStyle: 'italic' },

  cardLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: palette.roseDeep,
    marginBottom: spacing.sm,
  },
  phaseRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  phaseDot: { width: 10, height: 10, borderRadius: 5 },
  phaseText: { fontSize: 15, fontWeight: '600', color: palette.ink, flex: 1 },
  nextPeriod: { fontSize: 13, color: palette.inkSoft, marginTop: 6 },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: palette.muted,
    textTransform: 'uppercase',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  linkLabel: { fontSize: 15, fontWeight: '600', color: palette.ink },
  chevron: { fontSize: 22, color: palette.muted },
  divider: { height: 1, backgroundColor: palette.line, marginHorizontal: spacing.xl },

  signOutBtn: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: palette.line,
    paddingVertical: 14,
    alignItems: 'center',
  },
  signOutText: { fontSize: 15, fontWeight: '600', color: palette.danger },

  footer: { alignItems: 'center', gap: 4, paddingTop: spacing.sm },
  version: { fontSize: 13, color: palette.muted },
  copyright: { fontSize: 12, color: palette.muted },
});
