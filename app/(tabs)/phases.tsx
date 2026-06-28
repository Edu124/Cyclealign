import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Card, Screen } from '@/components/ui';
import { PhaseTimeline } from '@/components/cycle/PhaseTimeline';
import { PhaseCard } from '@/components/cycle/PhaseCard';
import { usePrediction } from '@/lib/hooks/usePrediction';
import { useAppStore } from '@/lib/stores/useAppStore';
import { getPhases } from '@/lib/prediction/phases';
import { phaseColors, palette, spacing } from '@/theme';

export default function Phases() {
  const profile = useAppStore((s) => s.profile);
  const prediction = usePrediction();

  if (!profile || !prediction) {
    return (
      <Screen contentStyle={styles.empty}>
        <Text style={styles.emptyText}>
          Set up your cycle to explore your phases.
        </Text>
      </Screen>
    );
  }

  const phases = getPhases(prediction.cycleLength, profile.avgPeriodLength);
  const activeKey = prediction.currentPhase;

  return (
    <Screen>
      <Animated.View entering={FadeInDown.duration(500)}>
        <Text style={styles.title}>Your phases</Text>
        <Text style={styles.subtitle}>
          You're on day {prediction.dayOfCycle} of a {prediction.cycleLength}-day
          cycle.
        </Text>
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: palette.inkSoft, fontSize: 16, textAlign: 'center' },
  title: { fontSize: 26, fontWeight: '800', color: palette.ink },
  subtitle: { fontSize: 15, color: palette.inkSoft, marginTop: 4 },
  list: { gap: spacing.md },
});
