import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { formatDistanceToNow } from 'date-fns';
import { dash, phaseColors, spacing } from '@/theme';
import { useModeration } from '@/lib/stores/useModeration';
import { reportPost } from '@/lib/moderation';
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
  const { blockUser, markReported, reportedPostIds } = useModeration();
  const isReported = reportedPostIds.includes(post.id);

  function handleReport() {
    markReported(post.id);
    reportPost(post.id).catch(() => {});
    if (Platform.OS === 'web') {
      window.alert("Thanks — we'll review this post.");
    } else {
      Alert.alert('Report received', "Thanks — we'll review this post.");
    }
  }

  function handleHideUser() {
    blockUser(post.userId);
  }

  function openMenu() {
    if (Platform.OS === 'web') {
      if (window.confirm('Report this post as inappropriate?')) handleReport();
      else if (window.confirm(`Hide all posts from ${post.displayName}?`)) handleHideUser();
      return;
    }
    Alert.alert('Post options', undefined, [
      { text: 'Report post', onPress: handleReport, style: 'destructive' },
      { text: `Hide posts from ${post.displayName}`, onPress: handleHideUser },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

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
        {isReported && (
          <View style={styles.reportedPill}>
            <Text style={styles.reportedText}>Reported</Text>
          </View>
        )}
        <TouchableOpacity onPress={openMenu} hitSlop={10} style={styles.menuBtn}>
          <Text style={styles.menuDots}>⋯</Text>
        </TouchableOpacity>
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
  menuBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuDots: { fontSize: 18, color: dash.muted, fontWeight: '700', lineHeight: 20 },
  reportedPill: {
    backgroundColor: '#F7E3D9',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 2,
  },
  reportedText: { fontSize: 10, fontWeight: '700', color: '#B85F3C' },
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
