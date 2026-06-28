import { Pressable, StyleSheet, Text, View } from 'react-native';
import { phaseBanner, dash } from '@/theme';
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
  phase: PhaseKey;
  dayOfCycle: number;
  onPress?: () => void;
}

/** Component A — Phase Banner. Phase name + day; tappable to Phase Detail. */
export function PhaseBanner({ phase, dayOfCycle, onPress }: Props) {
  const c = phaseBanner[phase];
  return (
    <Pressable
      style={[styles.card, { backgroundColor: c.bg }]}
      onPress={onPress}
    >
      <View style={[styles.dot, { backgroundColor: c.accent }]} />
      <View style={styles.text}>
        <Text style={[styles.phase, { color: c.accent }]}>
          {PHASE_TITLE[phase]} Phase
        </Text>
        <Text style={styles.day}>Day {dayOfCycle}</Text>
      </View>
      <Icon name="chevronRight" color={c.accent} size={20} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 22,
    padding: 20,
  },
  dot: { width: 12, height: 12, borderRadius: 6 },
  text: { flex: 1 },
  phase: { fontFamily: fonts.heading, fontSize: 22 },
  day: { fontSize: 14, color: dash.inkSoft, marginTop: 1 },
});
