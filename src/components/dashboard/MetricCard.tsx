import { StyleSheet, Text, View } from 'react-native';
import { dash } from '@/theme';
import { fonts } from '@/theme/fonts';
import { Icon, IconName } from './Icon';
import { Sparkline } from './Sparkline';

export interface Metric {
  icon: IconName;
  tint: string;
  iconColor: string;
  label: string;
  value: string;
  unit?: string;
  data: number[];
}

export function MetricCard(m: Metric) {
  return (
    <View style={styles.card}>
      <View style={[styles.iconCircle, { backgroundColor: m.tint }]}>
        <Icon name={m.icon} color={m.iconColor} size={18} />
      </View>
      <Text style={styles.label}>{m.label}</Text>
      <View style={styles.valueRow}>
        <Text style={styles.value}>{m.value}</Text>
        {m.unit && <Text style={styles.unit}>{m.unit}</Text>}
      </View>
      <Sparkline data={m.data} color={m.iconColor} width={118} height={32} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 150,
    backgroundColor: dash.card,
    borderRadius: 20,
    padding: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: dash.line,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  label: { fontSize: 13, color: dash.inkSoft },
  valueRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  value: { fontFamily: fonts.headingBold, fontSize: 26, color: dash.ink, lineHeight: 30 },
  unit: { fontSize: 13, color: dash.inkSoft, marginBottom: 4 },
});
