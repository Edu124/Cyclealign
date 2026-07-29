import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Screen } from '@/components/ui';
import { fetchBlogPost } from '@/lib/blog';
import { dash, spacing } from '@/theme';
import type { BlogPost } from '@/types/models';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

// Local inline images, dropped in as they're supplied — keyed by post TITLE
// (not id: Supabase-backed posts get a random uuid, so id can't be a stable
// key), placed after the given paragraph index (0-based) so each one breaks
// up the article right after the intro, before the first subheading.
// `aspect` is each image's own native width/height ratio — used as the box
// shape so `cover` fills it with no cropping, instead of forcing every photo
// into the same box and slicing off whatever doesn't fit.
const INLINE_IMAGES: Record<string, { source: number; afterParagraph: number; aspect: number }> = {
  'The Hidden Cost of Ignoring Female Biology at Work': {
    source: require('../../assets/blog/post-2.png'),
    afterParagraph: 1,
    aspect: 1448 / 1086,
  },
  "Cycle Tracking Isn't About Periods. It's About Performance.": {
    source: require('../../assets/blog/post-3.png'),
    afterParagraph: 1,
    aspect: 1672 / 941,
  },
  'Decision Fatigue and the Menstrual Cycle': {
    source: require('../../assets/blog/post-4.png'),
    afterParagraph: 1,
    aspect: 1983 / 793,
  },
  "The Future of Women's Leadership Is Biological Intelligence": {
    source: require('../../assets/blog/post-5.jpg'),
    afterParagraph: 1,
    aspect: 1983 / 793,
  },
};

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

          {post.kicker && (
            <Animated.Text entering={FadeInDown.delay(40).duration(400)} style={styles.kicker}>
              {post.kicker}
            </Animated.Text>
          )}

          <Animated.Text entering={FadeInDown.delay(80).duration(400)} style={styles.title}>
            {post.title}
          </Animated.Text>

          <Animated.Text entering={FadeInDown.delay(140).duration(400)} style={styles.meta}>
            {post.author} · {formatDate(post.publishedAt)}
          </Animated.Text>

          {post.body.split(/\r?\n\r?\n/).map((para, i) => {
            const inline = INLINE_IMAGES[post.title];
            return (
              <View key={i}>
                <Animated.Text
                  entering={FadeInDown.delay(200 + i * 60).duration(400)}
                  style={styles.paragraph}
                >
                  {para}
                </Animated.Text>

                {inline && i === inline.afterParagraph && (
                  <Animated.View
                    entering={FadeInDown.delay(200 + (i + 0.5) * 60).duration(400)}
                    style={[styles.imageCard, { aspectRatio: inline.aspect }]}
                  >
                    <Image source={inline.source} style={styles.image} resizeMode="cover" />
                  </Animated.View>
                )}
              </View>
            );
          })}
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
  kicker: {
    fontSize: 12,
    fontWeight: '800',
    color: '#C9A96E',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
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
  imageCard: {
    backgroundColor: dash.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: dash.line,
    overflow: 'hidden',
    marginBottom: spacing.md,
    shadowColor: '#2E2A26',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },

  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { fontSize: 14, color: dash.muted },
});
