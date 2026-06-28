import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui';
import { CycleRing } from '@/components/cycle/CycleRing';
import { phaseColors, palette, radius, spacing } from '@/theme';
import { fonts } from '@/theme/fonts';
import { PhaseKey } from '@/types/models';
import { PhaseStrategy } from '@/lib/intelligence/framework';

interface Props {
  dayOfCycle: number;
  cycleLength: number;
  phase: PhaseKey;
  strategy: PhaseStrategy;
}

const PHASE_TITLE: Record<PhaseKey, string> = {
  menstrual: 'Menstrual',
  follicular: 'Follicular',
  ovulation: 'Ovulation',
  luteal: 'Luteal',
};

/**
 * The daily leadership briefing hero. Shows the cycle day ring alongside the
 * phase's leadership headline, then what today is best for / to go easy on.
 */
export function TodayBriefing({ dayOfCycle, cycleLength, phase, strategy }: Props) {
  const color = phaseColors[phase].deep;

  return (
    <Card style={styles.card}>
      <View style={styles.top}>
        <View style={styles.headText}>
          <Text style={[styles.theme, { color }]}>
            {strategy.theme.toUpperCase()} · {PHASE_TITLE[phase]}
          </Text>
          <Text style={styles.headline}>{strategy.headline}</Text>
          <Text style={styles.summary}>{strategy.summary}</Text>
        </View>
        <CycleRing
          size={128}
          dayOfCycle={dayOfCycle}
          cycleLength={cycleLength}
          phaseLabel={PHASE_TITLE[phase]}
          phaseColor={color}
        />
      </View>

      <View style={styles.divider} />

      <View style={styles.lists}>
        <View style={styles.listCol}>
          <Text style={[styles.listLabel, { color: palette.lavenderDeep }]}>
            BEST FOR TODAY
          </Text>
          {strategy.bestFor.map((b) => (
            <View key={b} style={styles.row}>
              <Text style={[styles.mark, { color: palette.lavenderDeep }]}>✓</Text>
              <Text style={styles.rowText}>{b}</Text>
            </View>
          ))}
        </View>

        <View style={styles.listCol}>
          <Text style={[styles.listLabel, { color: palette.roseDeep }]}>
            GO EASY ON
          </Text>
          {strategy.goEasyOn.map((g) => (
            <View key={g} style={styles.row}>
              <Text style={[styles.mark, { color: palette.muted }]}>–</Text>
              <Text style={[styles.rowText, styles.rowTextMuted]}>{g}</Text>
            </View>
          ))}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: palette.blush, borderColor: '#F0DECE' },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headText: { flex: 1, gap: 4 },
  theme: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  headline: {
    fontFamily: fonts.name,
    fontSize: 26,
    color: palette.ink,
  },
  summary: { fontSize: 14, lineHeight: 20, color: palette.inkSoft, marginTop: 2 },
  divider: {
    height: 1,
    backgroundColor: '#EAD9CB',
    marginVertical: spacing.lg,
  },
  lists: { gap: spacing.lg },
  listCol: { gap: spacing.sm },
  listLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  mark: { fontSize: 15, fontWeight: '800', width: 16 },
  rowText: { flex: 1, fontSize: 15, lineHeight: 21, color: palette.ink },
  rowTextMuted: { color: palette.inkSoft },
});
