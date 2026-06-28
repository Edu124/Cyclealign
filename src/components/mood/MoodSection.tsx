import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, Layout } from 'react-native-reanimated';
import { Card } from '@/components/ui';
import { palette, radius, spacing } from '@/theme';
import { MOODS, Mood } from '@/lib/moods';

/**
 * "How are you feeling today?" — the user taps a mood and gets an immediate,
 * supportive recommendation to help them feel better. A small daily ritual that
 * brings women back to the app.
 */
interface MoodSectionProps {
  title?: string;
  subtitle?: string;
}

export function MoodSection({
  title = 'How are you feeling today?',
  subtitle = 'Tap a mood for a little support',
}: MoodSectionProps = {}) {
  const [selected, setSelected] = useState<Mood | null>(null);

  const pick = (m: Mood) => {
    Haptics.selectionAsync().catch(() => {});
    setSelected(m);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      <View style={styles.grid}>
        {MOODS.map((m) => {
          const active = selected?.key === m.key;
          return (
            <Pressable
              key={m.key}
              onPress={() => pick(m)}
              style={[
                styles.chip,
                { borderColor: active ? m.color : palette.line },
                active && { backgroundColor: `${m.color}22` },
              ]}
            >
              <Text style={styles.emoji}>{m.emoji}</Text>
              <Text style={[styles.chipLabel, active && { color: m.color }]}>
                {m.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {selected && (
        <Animated.View
          key={selected.key}
          entering={FadeInDown.duration(380)}
          layout={Layout.springify()}
        >
          <Card glow style={[styles.rec, { borderColor: selected.color }]}>
            <Text style={[styles.recTitle, { color: selected.color }]}>
              {selected.recommendation.title}
            </Text>
            <Text style={styles.recBody}>{selected.recommendation.body}</Text>
            <View style={styles.actions}>
              {selected.recommendation.actions.map((a) => (
                <Animated.View
                  key={a}
                  entering={FadeIn.delay(120).duration(400)}
                  style={styles.actionRow}
                >
                  <View style={[styles.actionDot, { backgroundColor: selected.color }]} />
                  <Text style={styles.actionText}>{a}</Text>
                </Animated.View>
              ))}
            </View>
          </Card>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  title: { fontSize: 20, fontWeight: '700', color: palette.ink },
  subtitle: { fontSize: 14, color: palette.inkSoft, marginBottom: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  chip: {
    width: '22%',
    minWidth: 72,
    flexGrow: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    backgroundColor: palette.surface,
  },
  emoji: { fontSize: 26 },
  chipLabel: { fontSize: 12, fontWeight: '600', color: palette.inkSoft },
  rec: { marginTop: spacing.md, gap: spacing.sm },
  recTitle: { fontSize: 18, fontWeight: '800' },
  recBody: { fontSize: 15, lineHeight: 22, color: palette.inkSoft },
  actions: { gap: spacing.md, marginTop: spacing.sm },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  actionDot: { width: 8, height: 8, borderRadius: 4 },
  actionText: { flex: 1, fontSize: 14, lineHeight: 20, color: palette.ink },
});
