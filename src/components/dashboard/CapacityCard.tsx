import { StyleSheet, Text, View } from 'react-native';
import { capacityColors, dash } from '@/theme';
import { fonts } from '@/theme/fonts';
import { Capacity } from '@/lib/intelligence/capacity';

const SUBTITLE: Record<Capacity, string> = {
  HIGH: 'Your body is built for big moves today',
  MEDIUM: 'Steady energy — pace yourself',
  LOW: 'Conserve energy and be gentle',
};

interface Props {
  capacity: Capacity;
}

/** Component B — Today's Capacity. HIGH / MEDIUM / LOW. */
export function CapacityCard({ capacity }: Props) {
  const c = capacityColors[capacity];
  return (
    <View style={[styles.card, { backgroundColor: c.bg }]}>
      <Text style={styles.label}>Today's Capacity</Text>
      <Text style={[styles.value, { color: c.fg }]}>{capacity}</Text>
      <Text style={styles.subtitle}>{SUBTITLE[capacity]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 22, padding: 20 },
  label: { fontSize: 13, color: dash.inkSoft, fontWeight: '600' },
  value: { fontFamily: fonts.headingBold, fontSize: 44, letterSpacing: 1, lineHeight: 50, marginTop: 2 },
  subtitle: { fontSize: 14, color: dash.ink, marginTop: 2 },
});
