import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { dash } from '@/theme';
import { visualFor } from '@/lib/wellness/workItemVisuals';

interface Props {
  items: string[];
  accent: string;
}

/** Image-card grid for LEAN IN / GO EASY items — same visual language as the Move & Recharge grid, instead of plain text chips. */
export function WorkItemGrid({ items, accent }: Props) {
  const [imgFailed, setImgFailed] = useState<Record<string, boolean>>({});

  return (
    <View style={styles.grid}>
      {items.map((text, i) => {
        const visual = visualFor(text);
        return (
          <Animated.View
            key={text}
            entering={FadeInDown.delay(i * 50).duration(300)}
            style={styles.card}
          >
            <View style={styles.imageWrap}>
              <Text style={styles.emoji}>{visual.emoji}</Text>
              {!imgFailed[text] && (
                <Image
                  source={{ uri: visual.image }}
                  style={styles.image}
                  resizeMode="cover"
                  onError={() => setImgFailed((f) => ({ ...f, [text]: true }))}
                />
              )}
              <View style={[styles.accentBar, { backgroundColor: accent }]} />
            </View>
            <View style={styles.body}>
              <Text style={styles.label} numberOfLines={2}>{text}</Text>
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: { width: '47%', backgroundColor: '#F9F6F1', borderRadius: 14, overflow: 'hidden' },
  imageWrap: {
    height: 80,
    backgroundColor: '#F0EBE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  emoji: { fontSize: 22 },
  accentBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  body: { padding: 10 },
  label: { fontSize: 12, fontWeight: '600', color: dash.ink, lineHeight: 16 },
});
