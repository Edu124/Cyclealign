import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInRight, ZoomIn } from 'react-native-reanimated';
import { dash, palette, phaseColors, spacing } from '@/theme';
import type { DopamineItem } from '@/types/models';
import type { PhaseKey } from '@/types/models';

interface Props {
  items: DopamineItem[];
  completedIds: string[];
  phaseKey: PhaseKey;
  todayISO: string;
  onToggle: (itemId: string, todayISO: string) => void;
}

const PHASE_LABELS: Record<PhaseKey, string> = {
  menstrual:  'Rest & Restore',
  follicular: 'Create & Explore',
  ovulation:  'Connect & Shine',
  luteal:     'Reflect & Wind Down',
};

export function DopamineMenuCard({ items, completedIds, phaseKey, todayISO, onToggle }: Props) {
  const completed = completedIds.length;
  const total = items.length;
  const pct = total > 0 ? completed / total : 0;
  const phaseColor = phaseColors[phaseKey].base;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Your Boost Menu</Text>
          <Text style={styles.subtitle}>{PHASE_LABELS[phaseKey]}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: phaseColor + '22' }]}>
          <Text style={[styles.badgeText, { color: phaseColor }]}>
            {completed}/{total}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressFill,
            { width: `${Math.round(pct * 100)}%` as any, backgroundColor: phaseColor },
          ]}
        />
      </View>

      {/* Items */}
      <View style={styles.list}>
        {items.map((item, i) => {
          const done = completedIds.includes(item.id);
          return (
            <Animated.View key={item.id} entering={FadeInRight.delay(i * 40).duration(300)}>
              <TouchableOpacity
                style={[styles.item, done && styles.itemDone]}
                onPress={() => onToggle(item.id, todayISO)}
                activeOpacity={0.7}
              >
                <Text style={styles.emoji}>{item.emoji}</Text>
                <View style={styles.itemText}>
                  <Text style={[styles.itemLabel, done && styles.itemLabelDone]}>
                    {item.label}
                  </Text>
                  {item.durationMinutes > 0 && (
                    <Text style={styles.itemDur}>{item.durationMinutes} min</Text>
                  )}
                </View>
                {done ? (
                  <Animated.View entering={ZoomIn.duration(220)} style={[styles.check, { backgroundColor: phaseColor }]}>
                    <Text style={styles.checkMark}>✓</Text>
                  </Animated.View>
                ) : (
                  <View style={styles.checkEmpty} />
                )}
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>

      {completed === total && total > 0 && (
        <Animated.View entering={ZoomIn.duration(350)} style={styles.completeBanner}>
          <Text style={styles.completeText}>✨ All done — beautiful work today!</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: dash.card,
    borderRadius: 20,
    padding: spacing.xl,
    gap: 14,
    shadowColor: '#2E2A26',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: dash.ink,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: dash.inkSoft,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  progressTrack: {
    height: 4,
    backgroundColor: dash.line,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  list: { gap: 10 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#F9F6F1',
  },
  itemDone: {
    backgroundColor: '#F0F0EC',
  },
  emoji: { fontSize: 20, width: 28, textAlign: 'center' },
  itemText: { flex: 1, gap: 1 },
  itemLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: dash.ink,
  },
  itemLabelDone: {
    color: dash.muted,
    textDecorationLine: 'line-through',
  },
  itemDur: {
    fontSize: 11,
    color: dash.muted,
  },
  checkEmpty: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: dash.line,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: { color: '#fff', fontSize: 12, fontWeight: '700' },
  completeBanner: {
    backgroundColor: '#EEF6E8',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  completeText: { color: dash.sage, fontSize: 13, fontWeight: '600' },
});
