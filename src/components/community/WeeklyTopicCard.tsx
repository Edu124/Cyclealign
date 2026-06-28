import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { dash, spacing } from '@/theme';
import type { WeeklyTopic } from '@/types/models';

interface Props {
  topic: WeeklyTopic;
  replyCount: number;
  onReply: () => void;
}

export function WeeklyTopicCard({ topic, replyCount, onReply }: Props) {
  return (
    <Animated.View entering={FadeInDown.duration(400)} style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.pill}>
          <Text style={styles.pillText}>✦ This Week</Text>
        </View>
        {replyCount > 0 && (
          <Text style={styles.replyCount}>{replyCount} {replyCount === 1 ? 'voice' : 'voices'}</Text>
        )}
      </View>

      <Text style={styles.title}>{topic.title}</Text>

      {topic.body ? (
        <Text style={styles.body}>{topic.body}</Text>
      ) : null}

      <TouchableOpacity style={styles.cta} onPress={onReply} activeOpacity={0.8}>
        <Text style={styles.ctaText}>Share your thoughts →</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#EFF5E9',
    borderRadius: 20,
    padding: spacing.xl,
    gap: 12,
    borderWidth: 1,
    borderColor: '#D4E2C5',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pill: {
    backgroundColor: dash.sage + '22',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
    color: dash.sage,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  replyCount: {
    fontSize: 12,
    color: dash.inkSoft,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: dash.ink,
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  body: {
    fontSize: 14,
    color: dash.inkSoft,
    lineHeight: 21,
  },
  cta: {
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '600',
    color: dash.sage,
  },
});
