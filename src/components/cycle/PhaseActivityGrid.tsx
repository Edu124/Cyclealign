import { useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { dash } from '@/theme';
import { PHASE_ACTIVITIES, type Activity } from '@/lib/wellness/activityCatalog';
import type { PhaseKey } from '@/types/models';

const CATEGORY_LABEL: Record<Activity['category'], string> = {
  exercise: '🏃 Exercise',
  mindfulness: '🧘 Mindfulness',
};

interface Props {
  phaseKey: PhaseKey;
  color: string;
}

/** Phase-tuned exercise & mindfulness picks — same product-card visual language as the Shop/Food menu, so Insights isn't just paragraphs of text. */
export function PhaseActivityGrid({ phaseKey, color }: Props) {
  const activities = PHASE_ACTIVITIES[phaseKey];
  const [imgFailed, setImgFailed] = useState<Record<string, boolean>>({});
  const [doneIds, setDoneIds] = useState<string[]>([]);
  const [detail, setDetail] = useState<Activity | null>(null);

  function toggleDone(id: string) {
    setDoneIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.grid}>
        {activities.map((activity, i) => {
          const done = doneIds.includes(activity.id);
          return (
            <Animated.View
              key={activity.id}
              entering={FadeInDown.delay(i * 50).duration(300)}
              style={styles.card}
            >
              <Pressable
                onPress={(e) => {
                  // This grid lives inside PhaseCard's own onPress={toggle}
                  // Pressable — without this, tapping an activity would also
                  // collapse the whole phase card.
                  e.stopPropagation();
                  setDetail(activity);
                }}
              >
                <View style={styles.imageWrap}>
                  <Text style={styles.emoji}>{activity.emoji}</Text>
                  {!imgFailed[activity.id] && (
                    <Image
                      source={{ uri: activity.image }}
                      style={styles.image}
                      resizeMode="cover"
                      onError={() => setImgFailed((f) => ({ ...f, [activity.id]: true }))}
                    />
                  )}
                  {activity.tag && (
                    <View style={styles.tagPill}>
                      <Text style={[styles.tagText, { color }]}>{activity.tag}</Text>
                    </View>
                  )}
                  <Pressable
                    style={[styles.doneBtn, done && { backgroundColor: color }]}
                    onPress={(e) => {
                      e.stopPropagation();
                      toggleDone(activity.id);
                    }}
                    hitSlop={6}
                  >
                    <Text style={[styles.doneBtnText, done && { color: '#fff' }]}>
                      {done ? '✓' : ''}
                    </Text>
                  </Pressable>
                </View>
                <View style={styles.body}>
                  <Text style={styles.category}>{CATEGORY_LABEL[activity.category]}</Text>
                  <Text style={styles.name} numberOfLines={2}>{activity.name}</Text>
                  <Text style={[styles.duration, { color }]}>{activity.duration}</Text>
                </View>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      <Modal visible={!!detail} animationType="slide" transparent onRequestClose={() => setDetail(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setDetail(null)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            {detail && (
              <>
                <Text style={styles.sheetEmoji}>{detail.emoji}</Text>
                <Text style={styles.sheetName}>{detail.name}</Text>
                <Text style={[styles.sheetMeta, { color }]}>
                  {CATEGORY_LABEL[detail.category]} · {detail.duration}
                </Text>
                <Text style={styles.sheetBenefit}>{detail.benefit}</Text>
                <Pressable
                  style={[styles.sheetBtn, { backgroundColor: color }]}
                  onPress={() => setDetail(null)}
                >
                  <Text style={styles.sheetBtnText}>Got it</Text>
                </Pressable>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: { width: '47%', backgroundColor: '#F9F6F1', borderRadius: 14, overflow: 'hidden' },
  imageWrap: {
    height: 100,
    backgroundColor: '#F0EBE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  emoji: { fontSize: 28 },
  tagPill: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FFFFFFEE',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.3 },
  doneBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFFDD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: { fontSize: 12, fontWeight: '800', color: dash.ink },
  body: { padding: 12, gap: 3 },
  category: { fontSize: 10, fontWeight: '700', color: dash.muted, letterSpacing: 0.2 },
  name: { fontSize: 13, fontWeight: '600', color: dash.ink, lineHeight: 17 },
  duration: { fontSize: 12, fontWeight: '700' },

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
