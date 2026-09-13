import { useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { dash } from '@/theme';
import type { Activity } from '@/lib/wellness/activityCatalog';

const CATEGORY_LABEL: Record<Activity['category'], string> = {
  exercise: '🏃 Exercise',
  mindfulness: '🧘 Mindfulness',
};

interface Props {
  visible: boolean;
  activity: Activity;
  color: string;
  /** Short lead-in shown above the card, e.g. "Since this day can't move, here's what might help:" */
  intro?: string;
  onClose: () => void;
}

/**
 * A single phase-tuned activity recommendation, shown as a small popup — a
 * compact thumbnail (not a big banner) with the name/duration beside it and
 * the "why" (benefit) below, matching the same info the Insights tab shows.
 */
export function ActivityRecommendationCard({ visible, activity, color, intro, onClose }: Props) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.popup} onPress={() => {}}>
          {intro && <Text style={styles.intro}>{intro}</Text>}

          <View style={styles.row}>
            <View style={styles.thumbWrap}>
              <Text style={styles.emoji}>{activity.emoji}</Text>
              {!imgFailed && (
                <Image
                  source={{ uri: activity.image }}
                  style={styles.thumb}
                  resizeMode="cover"
                  onError={() => setImgFailed(true)}
                />
              )}
            </View>
            <View style={styles.textCol}>
              <Text style={styles.category}>{CATEGORY_LABEL[activity.category]}</Text>
              <Text style={styles.name} numberOfLines={2}>{activity.name}</Text>
              <Text style={[styles.duration, { color }]}>{activity.duration}</Text>
            </View>
          </View>

          <Text style={styles.benefit}>{activity.benefit}</Text>

          <Pressable style={[styles.gotItBtn, { backgroundColor: color }]} onPress={onClose}>
            <Text style={styles.gotItText}>Got it</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(47,42,37,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  popup: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: dash.card,
    borderRadius: 20,
    padding: 18,
    gap: 12,
  },
  intro: { fontSize: 13, fontWeight: '600', color: dash.inkSoft },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  thumbWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#F0EBE5',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumb: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  emoji: { fontSize: 22 },
  textCol: { flex: 1, gap: 2 },
  category: { fontSize: 11, fontWeight: '700', color: dash.muted, letterSpacing: 0.2 },
  name: { fontSize: 15, fontWeight: '700', color: dash.ink },
  duration: { fontSize: 12, fontWeight: '700' },
  benefit: { fontSize: 13, color: dash.inkSoft, lineHeight: 19 },
  gotItBtn: { borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 2 },
  gotItText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
});
