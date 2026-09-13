import { useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { dash } from '@/theme';
import type { Activity } from '@/lib/wellness/activityCatalog';

const CATEGORY_LABEL: Record<Activity['category'], string> = {
  exercise: '🏃 Exercise',
  mindfulness: '🧘 Mindfulness',
};

interface Props {
  activity: Activity;
  color: string;
  /** Short lead-in shown above the card, e.g. "Since this day can't move, here's what might help:" */
  intro?: string;
}

/**
 * A single phase-tuned activity recommendation, in the same product-card
 * visual language as the Insights tab's activity grid — image + emoji
 * fallback + tag, with the "why" (benefit) shown as one line underneath.
 * Tapping the card opens the same detail bottom-sheet the Insights grid uses.
 */
export function ActivityRecommendationCard({ activity, color, intro }: Props) {
  const [imgFailed, setImgFailed] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  return (
    <View style={styles.wrap}>
      {intro && <Text style={styles.intro}>{intro}</Text>}
      <Pressable onPress={() => setDetailOpen(true)}>
        <View style={styles.card}>
          <View style={styles.imageWrap}>
            <Text style={styles.emoji}>{activity.emoji}</Text>
            {!imgFailed && (
              <Image
                source={{ uri: activity.image }}
                style={styles.image}
                resizeMode="cover"
                onError={() => setImgFailed(true)}
              />
            )}
            {activity.tag && (
              <View style={styles.tagPill}>
                <Text style={[styles.tagText, { color }]}>{activity.tag}</Text>
              </View>
            )}
          </View>
          <View style={styles.body}>
            <Text style={styles.category}>{CATEGORY_LABEL[activity.category]}</Text>
            <Text style={styles.name}>{activity.name}</Text>
            <Text style={[styles.duration, { color }]}>{activity.duration}</Text>
          </View>
        </View>
        <Text style={styles.benefit}>{activity.benefit}</Text>
      </Pressable>

      <Modal visible={detailOpen} animationType="slide" transparent onRequestClose={() => setDetailOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setDetailOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={styles.sheetEmoji}>{activity.emoji}</Text>
            <Text style={styles.sheetName}>{activity.name}</Text>
            <Text style={[styles.sheetMeta, { color }]}>
              {CATEGORY_LABEL[activity.category]} · {activity.duration}
            </Text>
            <Text style={styles.sheetBenefit}>{activity.benefit}</Text>
            <Pressable style={[styles.sheetBtn, { backgroundColor: color }]} onPress={() => setDetailOpen(false)}>
              <Text style={styles.sheetBtnText}>Got it</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', gap: 8 },
  intro: { fontSize: 13, fontWeight: '600', color: dash.inkSoft },
  card: { backgroundColor: '#F9F6F1', borderRadius: 16, overflow: 'hidden' },
  imageWrap: {
    height: 120,
    backgroundColor: '#F0EBE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  emoji: { fontSize: 32 },
  tagPill: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#FFFFFFEE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
  },
  tagText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  body: { padding: 14, gap: 3 },
  category: { fontSize: 11, fontWeight: '700', color: dash.muted, letterSpacing: 0.2 },
  name: { fontSize: 15, fontWeight: '700', color: dash.ink },
  duration: { fontSize: 13, fontWeight: '700' },
  benefit: { fontSize: 13, color: dash.inkSoft, lineHeight: 19, paddingHorizontal: 2, marginTop: 8 },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: dash.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    alignItems: 'center',
    gap: 6,
  },
  sheetEmoji: { fontSize: 40, marginBottom: 4 },
  sheetName: { fontSize: 19, fontWeight: '800', color: dash.ink, textAlign: 'center' },
  sheetMeta: { fontSize: 13, fontWeight: '700' },
  sheetBenefit: {
    fontSize: 14,
    color: dash.inkSoft,
    textAlign: 'center',
    lineHeight: 21,
    marginTop: 6,
    marginBottom: 12,
  },
  sheetBtn: { borderRadius: 14, paddingVertical: 13, paddingHorizontal: 40, marginTop: 4 },
  sheetBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
