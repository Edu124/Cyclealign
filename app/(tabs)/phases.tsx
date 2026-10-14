import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Card, TabScreen } from '@/components/ui';
import { PhaseTimeline } from '@/components/cycle/PhaseTimeline';
import { PhaseCard } from '@/components/cycle/PhaseCard';
import { usePrediction } from '@/lib/hooks/usePrediction';
import { useAppStore } from '@/lib/stores/useAppStore';
import { getPhases } from '@/lib/prediction/phases';
import { phaseColors, palette, spacing } from '@/theme';
import { resolveMode } from '@/lib/adaptive/mode';
import { AdaptiveInsights } from '@/components/adaptive/AdaptiveInsights';

export default function Phases() {
  const profile = useAppStore((s) => s.profile);
  const prediction = usePrediction();

  // Irregular / perimenopause users see the same phase page (from the dates
  // they gave at onboarding, marked as estimates) with their own check-in
  // patterns underneath. Without a logged period there's no phase to show,
  // so they get their patterns only.
  const adaptive = !!profile && resolveMode(profile) !== 'regular';
  if (adaptive && !prediction) {
    return (
      <TabScreen>
        <AdaptiveInsights />
      </TabScreen>
    );
  }

  if (!profile || !prediction) {
    return (
      <TabScreen contentStyle={styles.empty}>
        <Text style={styles.emptyText}>
          Set up your cycle to explore your phases.
        </Text>
      </TabScreen>
    );
  }

  const phases = getPhases(prediction.cycleLength, profile.avgPeriodLength);
  const activeKey = prediction.currentPhase;

  return (
    <TabScreen>
      <Animated.View entering={FadeInDown.duration(500)}>
        <Text style={styles.title}>Your phases</Text>
        <Text style={styles.subtitle}>
          You're on day {prediction.dayOfCycle} of a {prediction.cycleLength}-day
          cycle.
        </Text>
        {adaptive && (
          <Text style={styles.estimate}>
            Your cycle varies, so these phases and dates are estimates based on the period dates you gave us.
          </Text>
        )}
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(120).duration(500)}>
        <Card>
          <PhaseTimeline
            phases={phases}
            cycleLength={prediction.cycleLength}
            activeKey={activeKey}
            dayOfCycle={prediction.dayOfCycle}
          />
        </Card>
      </Animated.View>

      <View style={styles.list}>
        {phases.map((p, i) => (
          <Animated.View
            key={p.key}
            entering={FadeInDown.delay(220 + i * 80).duration(500)}
          >
            <PhaseCard
              phase={p}
              color={phaseColors[p.key].deep}
              active={p.key === activeKey}
              defaultExpanded={p.key === activeKey}
            />
          </Animated.View>
        ))}
      </View>

      {adaptive && (
        <Animated.View entering={FadeInDown.delay(560).duration(500)}>
          <AdaptiveInsights embedded />
        </Animated.View>
      )}
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  empty: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: palette.inkSoft, fontSize: 16, textAlign: 'center' },
  title: { fontSize: 26, fontWeight: '800', color: palette.ink },
  subtitle: { fontSize: 15, color: palette.inkSoft, marginTop: 4 },
  estimate: { fontSize: 13, color: palette.muted, marginTop: 6, lineHeight: 18 },
  list: { gap: spacing.md },
});
