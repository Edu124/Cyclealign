import { StyleSheet, Text, View } from 'react-native';
import { phaseColors, palette, spacing } from '@/theme';
import { PhaseInfo, PhaseKey } from '@/types/models';

interface Props {
  phases: PhaseInfo[];
  cycleLength: number;
  activeKey: PhaseKey;
  dayOfCycle: number;
}

/** Horizontal proportional bar of the four phases with a "today" marker. */
export function PhaseTimeline({ phases, cycleLength, activeKey, dayOfCycle }: Props) {
  const todayPct = Math.max(0, Math.min(1, dayOfCycle / cycleLength)) * 100;

  return (
    <View style={styles.wrap}>
      <View style={styles.bar}>
        {phases.map((p) => {
          const span = p.range[1] - p.range[0] + 1;
          const flex = span / cycleLength;
          const color = phaseColors[p.key].base;
          return (
            <View
              key={p.key}
              style={{
                flex,
                backgroundColor: color,
                opacity: p.key === activeKey ? 1 : 0.45,
              }}
            />
          );
        })}
        {/* Today marker */}
        <View style={[styles.marker, { left: `${todayPct}%` }]} />
      </View>

      <View style={styles.legend}>
        {phases.map((p) => (
          <View key={p.key} style={styles.legendItem}>
            <View
              style={[styles.dot, { backgroundColor: phaseColors[p.key].base }]}
            />
            <Text
              style={[
                styles.legendText,
                p.key === activeKey && styles.legendActive,
              ]}
            >
              {p.title}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  bar: {
    flexDirection: 'row',
    height: 22,
    borderRadius: 11,
    overflow: 'hidden',
    position: 'relative',
  },
  marker: {
    position: 'absolute',
    top: -4,
    width: 4,
    height: 30,
    borderRadius: 2,
    backgroundColor: palette.ink,
    marginLeft: -2,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 13, color: palette.inkSoft, fontWeight: '600' },
  legendActive: { color: palette.ink, fontWeight: '800' },
});
