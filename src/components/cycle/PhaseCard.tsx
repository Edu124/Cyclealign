import { useState } from 'react';
import { LayoutAnimation, Platform, Pressable, StyleSheet, Text, UIManager, View } from 'react-native';
import { palette, radius, spacing } from '@/theme';
import { PhaseInfo } from '@/types/models';
import { tipsForPhase } from '@/lib/prediction/tips';
import { PHASE_STRATEGY } from '@/lib/intelligence/framework';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Props {
  phase: PhaseInfo;
  color: string;
  active?: boolean;
  defaultExpanded?: boolean;
}

/** Expandable card describing a single phase with its rule-based tips. */
export function PhaseCard({ phase, color, active, defaultExpanded }: Props) {
  const [expanded, setExpanded] = useState(!!defaultExpanded);
  const tips = tipsForPhase(phase.key);
  const strategy = PHASE_STRATEGY[phase.key];

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((e) => !e);
  };

  return (
    <Pressable
      onPress={toggle}
      style={[
        styles.card,
        { borderColor: active ? color : palette.line },
        active && styles.activeShadow,
        active && { borderWidth: 2 },
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <View style={styles.headerText}>
          <Text style={styles.title}>{phase.title}</Text>
          <Text style={styles.subtitle}>{phase.subtitle}</Text>
        </View>
        <View style={styles.dayRange}>
          <Text style={[styles.dayRangeText, { color }]}>
            Day {phase.range[0]}–{phase.range[1]}
          </Text>
          {active && (
            <Text style={[styles.youAreHere, { color }]}>You're here</Text>
          )}
        </View>
      </View>

      {expanded && (
        <View style={styles.body}>
          {/* Leadership strategy — the core intelligence */}
          <View style={[styles.strategyBox, { backgroundColor: `${color}14` }]}>
            <Text style={[styles.strategyTheme, { color }]}>
              AT WORK · {strategy.theme.toUpperCase()}
            </Text>
            <Text style={styles.strategySummary}>{strategy.summary}</Text>
            <View style={styles.strategyCols}>
              <View style={styles.strategyCol}>
                <Text style={[styles.colLabel, { color: palette.lavenderDeep }]}>
                  LEAN IN
                </Text>
                {strategy.bestFor.map((b) => (
                  <Text key={b} style={styles.colItem}>• {b}</Text>
                ))}
              </View>
              <View style={styles.strategyCol}>
                <Text style={[styles.colLabel, { color: palette.roseDeep }]}>
                  GO EASY
                </Text>
                {strategy.goEasyOn.map((g) => (
                  <Text key={g} style={styles.colItem}>• {g}</Text>
                ))}
              </View>
            </View>
          </View>

          <Text style={styles.wellnessLabel}>WELLBEING</Text>
          <Text style={styles.summary}>{tips.summary}</Text>
          <TipRow label="Nourish" value={tips.diet} />
          <TipRow label="Mood" value={tips.mood} />
          <TipRow label="Energy" value={tips.energy} />
          <TipRow label="Move" value={tips.movement} />
        </View>
      )}
    </Pressable>
  );
}

function TipRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.tipRow}>
      <Text style={styles.tipLabel}>{label}</Text>
      <Text style={styles.tipValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
  },
  activeShadow: {
    shadowColor: palette.lavenderDeep,
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dot: { width: 14, height: 14, borderRadius: 7 },
  headerText: { flex: 1 },
  title: { fontSize: 17, fontWeight: '700', color: palette.ink },
  subtitle: { fontSize: 13, color: palette.muted, marginTop: 2 },
  dayRange: { alignItems: 'flex-end' },
  dayRangeText: { fontSize: 13, fontWeight: '700' },
  youAreHere: { fontSize: 11, fontWeight: '700', marginTop: 2 },
  body: {
    marginTop: spacing.lg,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: palette.line,
    paddingTop: spacing.lg,
  },
  summary: { fontSize: 14, lineHeight: 21, color: palette.inkSoft },
  strategyBox: {
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  strategyTheme: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  strategySummary: { fontSize: 14, lineHeight: 21, color: palette.ink },
  strategyCols: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm },
  strategyCol: { flex: 1, gap: 3 },
  colLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 2 },
  colItem: { fontSize: 13, lineHeight: 18, color: palette.inkSoft },
  wellnessLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: palette.muted,
    marginTop: spacing.sm,
  },
  tipRow: { gap: 2 },
  tipLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: palette.muted,
    textTransform: 'uppercase',
  },
  tipValue: { fontSize: 14, lineHeight: 20, color: palette.ink },
});
