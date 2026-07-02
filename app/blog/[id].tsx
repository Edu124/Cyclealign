import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Screen } from '@/components/ui';
import { fetchBlogPost } from '@/lib/blog';
import { dash, spacing } from '@/theme';
import type { BlogPost } from '@/types/models';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function BlogPostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchBlogPost(id).then((p) => {
      setPost(p);
      setLoading(false);
    });
  }, [id]);

  return (
    <Screen contentStyle={styles.content}>
      <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>

      {!loading && post && (
        <Animated.View entering={FadeIn.duration(400)}>
          <View style={[styles.emojiCircle, { backgroundColor: post.accentColor + '22' }]}>
            <Text style={styles.emoji}>{post.emoji}</Text>
          </View>

          <Animated.Text entering={FadeInDown.delay(80).duration(400)} style={styles.title}>
            {post.title}
          </Animated.Text>

          <Animated.Text entering={FadeInDown.delay(140).duration(400)} style={styles.meta}>
            {post.author} · {formatDate(post.publishedAt)}
          </Animated.Text>

          {post.body.split('\n\n').map((para, i) => (
            <Animated.Text
              key={i}
              entering={FadeInDown.delay(200 + i * 60).duration(400)}
              style={styles.paragraph}
            >
              {para}
            </Animated.Text>
          ))}
        </Animated.View>
      )}

      {!loading && !post && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>This post couldn't be found.</Text>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.md },
  back: { alignSelf: 'flex-start', marginBottom: spacing.sm },
  backText: { fontSize: 14, fontWeight: '600', color: dash.inkSoft },

  emojiCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emoji: { fontSize: 30 },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: dash.ink,
    lineHeight: 31,
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  meta: {
    fontSize: 13,
    color: dash.muted,
    fontWeight: '600',
    marginBottom: spacing.lg,
  },
  paragraph: {
    fontSize: 16,
    color: dash.inkSoft,
    lineHeight: 25,
    marginBottom: spacing.md,
  },

  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { fontSize: 14, color: dash.muted },
});
