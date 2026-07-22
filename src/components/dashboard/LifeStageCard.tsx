import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLifeStage } from '@/lib/hooks/useLifeStage';
import { dash } from '@/theme';

/**
 * Age-aware life-stage guidance on the dashboard. Renders nothing when no
 * birthday is on file. Tapping the card cycles through the stage's tips.
 */
export function LifeStageCard() {
  const lifeStage = useLifeStage();
  const [tipIndex, setTipIndex] = useState(0);

  if (!lifeStage) return null;
  const { stage } = lifeStage;
  const tip = stage.tips[tipIndex % stage.tips.length];

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
      onPress={() => setTipIndex((i) => i + 1)}
    >
      <View style={styles.header}>
        <Text style={styles.emoji}>{stage.emoji}</Text>
        <View style={styles.headerText}>
          <Text style={styles.kicker}>YOUR LIFE STAGE</Text>
          <Text style={styles.title}>{stage.label}</Text>
        </View>
      </View>
      <Text style={styles.summary}>{stage.moodNote}</Text>
      <View style={styles.tipBox}>
        <Text style={styles.tipLabel}>For this stage · tap for more</Text>
        <Text style={styles.tipText}>{tip}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: dash.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: dash.line,
    padding: 16,
    gap: 10,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  emoji: { fontSize: 26 },
  headerText: { flex: 1 },
  kicker: { fontSize: 10, fontWeight: '800', letterSpacing: 1, color: dash.muted },
  title: { fontSize: 16, fontWeight: '800', color: dash.ink, marginTop: 1 },
  summary: { fontSize: 13, color: dash.inkSoft, lineHeight: 19 },
  tipBox: {
    backgroundColor: dash.insight,
    borderRadius: 12,
    padding: 12,
    gap: 3,
  },
  tipLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.6, color: dash.muted, textTransform: 'uppercase' },
  tipText: { fontSize: 13, color: dash.ink, lineHeight: 19 },
});
