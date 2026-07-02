import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { fetchBlogPosts } from '@/lib/blog';
import { dash, spacing } from '@/theme';
import type { BlogPost } from '@/types/models';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function BlogRow({ post, index }: { post: BlogPost; index: number }) {
  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(350)}>
      <Pressable
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        onPress={() => router.push(`/blog/${post.id}`)}
      >
        <View style={[styles.emojiCircle, { backgroundColor: post.accentColor + '22' }]}>
          <Text style={styles.emoji}>{post.emoji}</Text>
        </View>
        <View style={styles.rowText}>
          <Text style={styles.rowTitle} numberOfLines={1}>{post.title}</Text>
          <Text style={styles.rowExcerpt} numberOfLines={2}>{post.excerpt}</Text>
          <Text style={styles.rowDate}>{formatDate(post.publishedAt)} · {post.author}</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>
    </Animated.View>
  );
}

export function BlogListCard() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlogPosts().then((p) => {
      setPosts(p);
      setLoading(false);
    });
  }, []);

  if (loading) return null;

  if (posts.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyEmoji}>📰</Text>
        <Text style={styles.emptyText}>New posts coming soon.</Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {posts.map((post, i) => (
        <BlogRow key={post.id} post={post} index={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: dash.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: dash.line,
    padding: spacing.md,
  },
  rowPressed: { opacity: 0.7 },
  emojiCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 24 },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 15, fontWeight: '700', color: dash.ink },
  rowExcerpt: { fontSize: 13, color: dash.inkSoft, lineHeight: 18 },
  rowDate: { fontSize: 11, color: dash.muted, marginTop: 2, fontWeight: '600' },
  chevron: { fontSize: 22, color: dash.muted, fontWeight: '300' },

  empty: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyEmoji: { fontSize: 32 },
  emptyText: { fontSize: 14, color: dash.muted, textAlign: 'center' },
});
