import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Card, Screen } from '@/components/ui';
import { Logo3D } from '@/components/logo/Logo3D';
import { palette, spacing } from '@/theme';

const SECTIONS = [
  {
    title: 'What CycleAlign is',
    body: 'CycleAlign is a hormonal intelligence platform for women in leadership. It is not a period app — it is a performance tool that turns your cycle into a strategy for how you work, lead and decide.',
  },
  {
    title: 'How it works',
    body: 'Your cycle moves through four hormonal phases, each with a distinct cognitive and energetic signature. CycleAlign maps where you are to what your body does best right now — today, this week and this month.',
  },
  {
    title: 'Privacy first',
    body: 'Your data is personal and powerful. It is tied only to your account, never sold, and your intelligence is computed on your device. You can delete everything at any time.',
  },
  {
    title: 'A note on health',
    body: 'CycleAlign provides performance and wellness guidance for general use only. It is not a medical device and does not provide medical advice or contraception. Always consult a healthcare professional for medical concerns.',
  },
];

export default function About() {
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <Screen>
      <Animated.View entering={FadeInDown.duration(500)} style={styles.hero}>
        <Logo3D size={120} />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(80).duration(500)}>
        <Card>
          <Text style={styles.cardLabel}>FOUNDER</Text>
          <Text style={styles.founder}>Vinita Thakur</Text>
          <Text style={styles.founderBody}>
            CycleAlign was founded to give high-achieving women a strategic edge —
            built with empathy, backed by the science of female hormonal intelligence.
          </Text>
        </Card>
      </Animated.View>

      {SECTIONS.map((s, i) => (
        <Animated.View key={s.title} entering={FadeInDown.delay(160 + i * 70).duration(500)}>
          <Card>
            <Text style={styles.sectionTitle}>{s.title}</Text>
            <Text style={styles.sectionBody}>{s.body}</Text>
          </Card>
        </Animated.View>
      ))}

      <Animated.View entering={FadeInDown.delay(460).duration(500)}>
        <Card padded={false}>
          <LinkRow label="Privacy Settings" onPress={() => router.push('/privacy-settings')} />
          <View style={styles.divider} />
          <LinkRow label="Terms of Service"  onPress={() => router.push('/terms')} />
          <View style={styles.divider} />
          <LinkRow label="Go Premium 🌿"     onPress={() => router.push('/paywall')} />
          <View style={styles.divider} />
          <LinkRow label="Contact us"        onPress={() => Linking.openURL('mailto:hello@cyclealign.app')} />
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(540).duration(500)} style={styles.footer}>
        <Text style={styles.version}>CycleAlign v{version}</Text>
        <Text style={styles.copyright}>© 2026 CycleAlign. Hormone intelligence for women who lead.</Text>
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
  hero: { alignItems: 'center', marginBottom: spacing.sm },
  cardLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: palette.roseDeep,
    marginBottom: 4,
  },
  founder: { fontSize: 20, fontWeight: '800', color: palette.ink },
  founderBody: { fontSize: 14, lineHeight: 21, color: palette.inkSoft, marginTop: spacing.sm },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: palette.ink, marginBottom: spacing.sm },
  sectionBody: { fontSize: 14, lineHeight: 21, color: palette.inkSoft },
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
  footer: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  version: { fontSize: 13, color: palette.muted, marginTop: spacing.md },
  copyright: { fontSize: 12, color: palette.muted, textAlign: 'center' },
});
