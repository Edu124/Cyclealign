import { useState } from 'react';
import { LayoutAnimation, Platform, Pressable, StyleSheet, Text, UIManager, View } from 'react-native';
import { palette, radius, spacing } from '@/theme';
import { PhaseInfo } from '@/types/models';
import { tipsForPhase } from '@/lib/prediction/tips';
import { PHASE_STRATEGY } from '@/lib/intelligence/framework';
import { PhaseActivityGrid } from '@/components/cycle/PhaseActivityGrid';
import { WorkItemGrid } from '@/components/cycle/WorkItemGrid';

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

type Tab = 'work' | 'wellbeing' | 'move';

const TABS: { key: Tab; label: string; emoji: string }[] = [
  { key: 'work', label: 'At Work', emoji: '💼' },
  { key: 'wellbeing', label: 'Wellbeing', emoji: '🌿' },
  { key: 'move', label: 'Move', emoji: '🏃' },
];

/** Expandable card describing a single phase with its rule-based tips. */
export function PhaseCard({ phase, color, active, defaultExpanded }: Props) {
  const [expanded, setExpanded] = useState(!!defaultExpanded);
  const [tab, setTab] = useState<Tab>('work');
  const tips = tipsForPhase(phase.key);
  const strategy = PHASE_STRATEGY[phase.key];

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((e) => !e);
  };

  function selectTab(t: Tab) {
    return (e: { stopPropagation: () => void }) => {
      // Tab pills live inside the card's own onPress={toggle} — without
      // this, switching tabs would also collapse the whole card.
      e.stopPropagation();
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setTab(t);
    };
  }

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
          <View style={styles.tabBar}>
            {TABS.map((t) => {
              const on = tab === t.key;
              return (
                <Pressable
                  key={t.key}
                  onPress={selectTab(t.key)}
                  style={[styles.tabBtn, on && { backgroundColor: color }]}
                >
                  <Text style={[styles.tabBtnText, on && styles.tabBtnTextOn]}>
                    {t.emoji} {t.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {tab === 'work' && (
            <View style={[styles.strategyBox, { backgroundColor: `${color}14` }]}>
              <Text style={[styles.strategyTheme, { color }]}>
                {strategy.theme.toUpperCase()}
              </Text>
              <Text style={styles.strategySummary}>{strategy.summary}</Text>

              <Text style={[styles.colLabel, { color: palette.lavenderDeep, marginTop: spacing.sm }]}>
                LEAN IN
              </Text>
              <WorkItemGrid items={strategy.bestFor} accent={palette.lavenderDeep} />

              <Text style={[styles.colLabel, { color: palette.roseDeep, marginTop: spacing.sm }]}>
                GO EASY
              </Text>
              <WorkItemGrid items={strategy.goEasyOn} accent={palette.roseDeep} />
            </View>
          )}

          {tab === 'wellbeing' && (
            <View style={styles.wellbeingWrap}>
              <Text style={styles.summary}>{tips.summary}</Text>
              <TipRow label="Nourish" value={tips.diet} />
              <TipRow label="Mood" value={tips.mood} />
              <TipRow label="Energy" value={tips.energy} />
            </View>
          )}

          {tab === 'move' && <PhaseActivityGrid phaseKey={phase.key} color={color} />}
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#F0EBE5',
    borderRadius: 12,
    padding: 3,
    gap: 2,
  },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: 'center' },
  tabBtnText: { fontSize: 12, fontWeight: '700', color: palette.inkSoft },
  tabBtnTextOn: { color: '#fff' },
  summary: { fontSize: 14, lineHeight: 21, color: palette.inkSoft },
  strategyBox: {
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  strategyTheme: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  strategySummary: { fontSize: 14, lineHeight: 21, color: palette.ink },
  colLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 6 },
  wellbeingWrap: { gap: spacing.md },
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
