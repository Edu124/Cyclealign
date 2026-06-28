import { StyleSheet, Text, View } from 'react-native';
import { dash, palette } from '@/theme';
import { fonts } from '@/theme/fonts';
import { Icon } from './Icon';
import { MiniBars } from './MiniBars';

interface Props {
  value: string; // e.g. "7h 15m"
  quality: string; // e.g. "Good"
  data: number[];
}

/**
 * Half-width "Sleep Last Night" card. Placeholder health data for now — wire to
 * a real sleep source (or daily log) when available.
 */
export function SleepCard({ value, quality, data }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Sleep Last Night</Text>
        <View style={styles.iconCircle}>
          <Icon name="moon" color={palette.lavenderDeep} size={16} />
        </View>
      </View>
      <Text style={[styles.value, { color: dash.sageDeep }]}>{value}</Text>
      <View style={styles.qualityRow}>
        <Text style={styles.quality}>{quality}</Text>
        <View style={styles.qualityDot} />
      </View>
      <View style={styles.chart}>
        <MiniBars data={data} color="#A99BD4" width={120} height={36} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: dash.card,
    borderRadius: 20,
    padding: 18,
    gap: 4,
    borderWidth: 1,
    borderColor: dash.line,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 14, fontWeight: '600', color: dash.ink },
  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ECE7F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: { fontFamily: fonts.headingBold, fontSize: 24, marginTop: 4 },
  qualityRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  quality: { fontSize: 13, color: dash.inkSoft },
  qualityDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: dash.sage },
  chart: { marginTop: 8, alignItems: 'flex-end' },
});
