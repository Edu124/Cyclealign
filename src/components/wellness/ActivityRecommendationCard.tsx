import { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { dash } from '@/theme';
import type { Activity } from '@/lib/wellness/activityCatalog';

const CATEGORY_LABEL: Record<Activity['category'], string> = {
  exercise: '🏃 Exercise',
  mindfulness: '🧘 Mindfulness',
  quick: '☕ Quick Break',
};

interface Props {
  visible: boolean;
  activities: Activity[];
  color: string;
  /** Short lead-in shown above the grid, e.g. "Since this day can't move, here's what might help:" */
  intro?: string;
  onClose: () => void;
}

function Tile({ activity, color }: { activity: Activity; color: string }) {
  const [imgFailed, setImgFailed] = useState(false);
  return (
    <View style={styles.tile}>
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
      <View style={styles.tileBody}>
        <Text style={styles.category}>{CATEGORY_LABEL[activity.category]}</Text>
        <Text style={styles.name} numberOfLines={2}>{activity.name}</Text>
        <Text style={[styles.duration, { color }]}>{activity.duration}</Text>
        <Text style={styles.benefit} numberOfLines={4}>{activity.benefit}</Text>
      </View>
    </View>
  );
}

/**
 * Four phase-tuned suggestions shown as a small popup in a 2×2 grid — a
 * compact thumbnail per option with its one-line "why", same visual language
 * as the Insights tab's activity cards.
 */
export function ActivityRecommendationCard({ visible, activities, color, intro, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.popup} onPress={() => {}}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {intro && <Text style={styles.intro}>{intro}</Text>}

            <View style={styles.grid}>
              {activities.map((a) => (
                <Tile key={a.id} activity={a} color={color} />
              ))}
            </View>

            <Pressable style={[styles.gotItBtn, { backgroundColor: color }]} onPress={onClose}>
              <Text style={styles.gotItText}>Got it</Text>
            </Pressable>
          </ScrollView>
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
    padding: 20,
  },
  popup: {
    width: '100%',
    maxWidth: 360,
    maxHeight: '88%',
    backgroundColor: dash.card,
    borderRadius: 20,
  },
  content: { padding: 16, gap: 12 },
  intro: { fontSize: 13, fontWeight: '600', color: dash.inkSoft },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  tile: {
    width: '48.5%',
    backgroundColor: '#F9F6F1',
    borderRadius: 14,
    overflow: 'hidden',
  },
  thumbWrap: {
    height: 64,
    backgroundColor: '#F0EBE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumb: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  emoji: { fontSize: 24 },
  tileBody: { padding: 9, gap: 2 },
  category: { fontSize: 9.5, fontWeight: '700', color: dash.muted, letterSpacing: 0.2 },
  name: { fontSize: 12.5, fontWeight: '700', color: dash.ink, lineHeight: 16 },
  duration: { fontSize: 11, fontWeight: '700' },
  benefit: { fontSize: 10.5, color: dash.inkSoft, lineHeight: 14, marginTop: 2 },
  gotItBtn: { borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  gotItText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
});
