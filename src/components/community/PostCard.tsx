import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { formatDistanceToNow } from 'date-fns';
import { dash, phaseColors, spacing } from '@/theme';
import type { CommunityPost, PhaseKey, ReactionType } from '@/types/models';

interface Props {
  post: CommunityPost;
  index: number;
  onReact: (postId: string, reaction: ReactionType) => void;
}

const PHASE_LABELS: Record<PhaseKey, string> = {
  menstrual:  'Menstrual',
  follicular: 'Follicular',
  ovulation:  'Ovulatory',
  luteal:     'Luteal',
};

const REACTIONS: { type: ReactionType; emoji: string; label: string }[] = [
  { type: 'felt_this',      emoji: '💛', label: 'Felt this' },
  { type: 'sending_energy', emoji: '🌸', label: 'Sending energy' },
  { type: 'inspiring',      emoji: '✨', label: 'Inspiring' },
];

function timeAgo(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return '';
  }
}

export function PostCard({ post, index, onReact }: Props) {
  const phaseColor = post.phaseKey ? phaseColors[post.phaseKey].base : dash.muted;

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(350)} style={styles.card}>
      {/* Author row */}
      <View style={styles.authorRow}>
        <View style={[styles.avatar, { backgroundColor: phaseColor + '33' }]}>
          <Text style={[styles.avatarText, { color: phaseColor }]}>
            {post.displayName === 'Anonymous' ? '👤' : post.displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.authorMeta}>
          <Text style={styles.authorName}>{post.displayName}</Text>
          <Text style={styles.timeAgo}>{timeAgo(post.createdAt)}</Text>
        </View>
      </View>

      {/* Content */}
      <Text style={styles.content}>{post.content}</Text>

      {/* Reactions */}
      <View style={styles.reactions}>
        {REACTIONS.map((r) => {
          const active = post.myReaction === r.type;
          const count = post.reactions[r.type];
          return (
            <TouchableOpacity
              key={r.type}
              style={[styles.reactionBtn, active && styles.reactionBtnActive]}
              onPress={() => onReact(post.id, r.type)}
              activeOpacity={0.7}
            >
              <Text style={styles.reactionEmoji}>{r.emoji}</Text>
              {count > 0 && (
                <Text style={[styles.reactionCount, active && styles.reactionCountActive]}>
                  {count}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: dash.card,
    borderRadius: 16,
    padding: spacing.lg,
    gap: 12,
    shadowColor: '#2E2A26',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 15, fontWeight: '700' },
  authorMeta: { flex: 1 },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: dash.ink,
  },
  timeAgo: {
    fontSize: 11,
    color: dash.muted,
    marginTop: 1,
  },
  phasePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  phaseText: { fontSize: 10, fontWeight: '600' },
  content: {
    fontSize: 14,
    color: dash.ink,
    lineHeight: 22,
  },
  reactions: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: dash.line,
  },
  reactionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#F4F0EA',
  },
  reactionBtnActive: {
    backgroundColor: '#E9EFE2',
  },
  reactionEmoji: { fontSize: 14 },
  reactionCount: {
    fontSize: 12,
    fontWeight: '600',
    color: dash.inkSoft,
  },
  reactionCountActive: { color: dash.sage },
});
