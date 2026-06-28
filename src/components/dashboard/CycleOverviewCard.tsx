import { Pressable, StyleSheet, Text, View } from 'react-native';
import { dash, phaseColors } from '@/theme';
import { fonts } from '@/theme/fonts';
import { PhaseKey } from '@/types/models';
import { Icon } from './Icon';

const PHASE_TITLE: Record<PhaseKey, string> = {
  menstrual: 'Menstrual',
  follicular: 'Follicular',
  ovulation: 'Ovulatory',
  luteal: 'Luteal',
};

interface Props {
  dayOfCycle: number;
  cycleLength: number;
  phase: PhaseKey;
  onPress?: () => void;
}

/** Half-width "Cycle Overview" card with a phase progress bar. */
export function CycleOverviewCard({ dayOfCycle, cycleLength, phase, onPress }: Props) {
  const progress = Math.max(0, Math.min(1, dayOfCycle / cycleLength));
  const accent = phaseColors[phase].deep;
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.title}>Cycle Overview</Text>
        <View style={styles.iconCircle}>
          <Icon name="calendar" color={dash.clay} size={16} />
        </View>
      </View>
      <Text style={styles.dayLine}>
        <Text style={[styles.dayBig, { color: dash.sageDeep }]}>Day {dayOfCycle}</Text>
        <Text style={styles.dayOf}> of {cycleLength}</Text>
      </Text>
      <Text style={styles.phase}>{PHASE_TITLE[phase]} Phase</Text>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: accent }]} />
        {[0.2, 0.4, 0.6, 0.8].map((p) => (
          <View key={p} style={[styles.tick, { left: `${p * 100}%` }]} />
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: dash.card,
    borderRadius: 20,
    padding: 18,
    gap: 6,
    borderWidth: 1,
    borderColor: dash.line,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 14, fontWeight: '600', color: dash.ink },
  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: dash.clayTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayLine: { marginTop: 4 },
  dayBig: { fontFamily: fonts.headingBold, fontSize: 24 },
  dayOf: { fontSize: 14, color: dash.inkSoft },
  phase: { fontSize: 13, color: dash.inkSoft },
  track: {
    height: 7,
    borderRadius: 4,
    backgroundColor: dash.line,
    marginTop: 10,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 4 },
  tick: { position: 'absolute', width: 2, height: 7, backgroundColor: dash.card },
});
