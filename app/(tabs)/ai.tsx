import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { palette } from '@/theme';
import { fonts } from '@/theme/fonts';

const FEATURES = [
  {
    emoji: '💊',
    title: 'Supplement recommendations',
    body: 'Phase-matched supplement stacks — iron and magnesium in Menstrual, B6 and zinc in Luteal — based on your cycle day.',
  },
  {
    emoji: '🏃‍♀️',
    title: 'Movement intelligence',
    body: 'Workout type, intensity and recovery recommendations synced to your energy window — from HIIT in Ovulatory to restorative yoga in Menstrual.',
  },
  {
    emoji: '🥗',
    title: 'Nutrition guidance',
    body: 'Anti-inflammatory foods in Luteal, iron-rich meals in Menstrual, high-protein timing around Ovulation — tailored to your phase.',
  },
  {
    emoji: '🧘‍♀️',
    title: 'Recovery & stress protocols',
    body: 'Breathwork, cold exposure, and sleep hygiene protocols matched to your cortisol and progesterone windows.',
  },
  {
    emoji: '🤖',
    title: 'Ask the AI',
    body: "A conversational AI that knows your phase, your role and your history — ask anything about your body, work or energy.",
  },
];

export default function AITab() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>AI Coach</Text>
          <Text style={styles.headerSub}>Personalised intelligence for every phase</Text>
        </View>

        <Animated.View entering={FadeIn.delay(100).duration(600)} style={styles.comingSoonCard}>
          <Text style={styles.comingSoonEmoji}>✨</Text>
          <Text style={styles.comingSoonTitle}>Coming Soon</Text>
          <Text style={styles.comingSoonBody}>
            CycleAlign AI is being built and tested. When it launches, it will be your
            always-on hormonal health coach — medications, movement, nutrition and recovery,
            all phase-matched to your body.
          </Text>
          <View style={styles.pill}>
            <Text style={styles.pillText}>Available in V2</Text>
          </View>
        </Animated.View>

        <View style={styles.featureList}>
          {FEATURES.map((f, i) => (
            <Animated.View
              key={f.title}
              entering={FadeInDown.delay(200 + i * 80).duration(400)}
              style={styles.featureCard}
            >
              <Text style={styles.featureEmoji}>{f.emoji}</Text>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureBody}>{f.body}</Text>
              </View>
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  scrollContent: { paddingBottom: 120 },
  header: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontFamily: fonts.headingBold,
    fontSize: 28,
    color: palette.ink,
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 14,
    color: palette.muted,
    marginTop: 4,
  },

  comingSoonCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#F3EDE6',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E8D9CC',
    padding: 22,
    alignItems: 'center',
    gap: 8,
  },
  comingSoonEmoji: { fontSize: 40 },
  comingSoonTitle: {
    fontFamily: fonts.headingBold,
    fontSize: 22,
    color: palette.ink,
    letterSpacing: -0.2,
  },
  comingSoonBody: {
    fontSize: 14,
    lineHeight: 21,
    color: palette.inkSoft,
    textAlign: 'center',
  },
  pill: {
    backgroundColor: '#EEE8F4',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginTop: 4,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '800',
    color: palette.lavenderDeep,
    letterSpacing: 0.5,
  },

  featureList: {
    paddingHorizontal: 20,
    gap: 10,
    paddingBottom: 120,
  },
  featureCard: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: palette.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.line,
    padding: 14,
    opacity: 0.65,
  },
  featureEmoji: { fontSize: 28, marginTop: 2 },
  featureText: { flex: 1 },
  featureTitle: { fontSize: 15, fontWeight: '700', color: palette.ink, marginBottom: 4 },
  featureBody: { fontSize: 13, color: palette.inkSoft, lineHeight: 18 },
});
