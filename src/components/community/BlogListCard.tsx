import { useEffect, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { fetchBlogPosts } from '@/lib/blog';
import { BLOG_IMAGES } from '@/lib/blogImages';
import { dash, spacing } from '@/theme';
import type { BlogPost } from '@/types/models';

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDateLong(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function BlogCard({ post, index, onPress }: { post: BlogPost; index: number; onPress: () => void }) {
  const cover = BLOG_IMAGES[post.title];
  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(300)} style={styles.card}>
      <Pressable onPress={onPress}>
        <View style={[styles.imageWrap, { backgroundColor: post.accentColor + '22' }]}>
          {cover ? (
            <Image source={cover.source} style={styles.image} resizeMode="cover" />
          ) : (
            <Text style={styles.emoji}>{post.emoji}</Text>
          )}
        </View>
        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={2}>{post.title}</Text>
          <Text style={styles.excerpt} numberOfLines={2}>{post.excerpt}</Text>
          <Text style={styles.date}>{formatDateShort(post.publishedAt)} · {post.author}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export function BlogListCard() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [openPost, setOpenPost] = useState<BlogPost | null>(null);

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

  const openInline = openPost ? BLOG_IMAGES[openPost.title] : undefined;

  return (
    <View style={styles.grid}>
      {posts.map((post, i) => (
        <BlogCard key={post.id} post={post} index={i} onPress={() => setOpenPost(post)} />
      ))}

      {openPost && (
        <Modal visible animationType="slide" onRequestClose={() => setOpenPost(null)}>
          <View style={styles.modalRoot}>
            <Pressable onPress={() => setOpenPost(null)} hitSlop={12} style={styles.close}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalContent}>
              <Animated.View entering={FadeIn.duration(300)}>
                <View style={[styles.emojiCircle, { backgroundColor: openPost.accentColor + '22' }]}>
                  <Text style={styles.modalEmoji}>{openPost.emoji}</Text>
                </View>

                {openPost.kicker && (
                  <Text style={styles.kicker}>{openPost.kicker}</Text>
                )}

                <Text style={styles.modalTitle}>{openPost.title}</Text>
                <Text style={styles.meta}>{openPost.author} · {formatDateLong(openPost.publishedAt)}</Text>

                {openPost.body.split(/\r?\n\r?\n/).map((para, i) => (
                  <View key={i}>
                    <Text style={styles.paragraph}>{para}</Text>
                    {openInline && i === openInline.afterParagraph && (
                      <View style={[styles.inlineImageCard, { aspectRatio: openInline.aspect }]}>
                        <Image source={openInline.source} style={styles.inlineImage} resizeMode="cover" />
                      </View>
                    )}
                  </View>
                ))}
              </Animated.View>
            </ScrollView>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },

  card: { width: '47%', backgroundColor: dash.card, borderRadius: 18, overflow: 'hidden' },
  imageWrap: {
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  emoji: { fontSize: 30 },
  body: { padding: 12, gap: 3 },
  title: { fontSize: 13, fontWeight: '700', color: dash.ink, lineHeight: 17 },
  excerpt: { fontSize: 11.5, color: dash.inkSoft, lineHeight: 16 },
  date: { fontSize: 10.5, color: dash.muted, marginTop: 2, fontWeight: '600' },

  empty: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyEmoji: { fontSize: 32 },
  emptyText: { fontSize: 14, color: dash.muted, textAlign: 'center' },

  // Full-article popup
  modalRoot: { flex: 1, backgroundColor: dash.bg },
  close: {
    alignSelf: 'flex-end',
    margin: spacing.md,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: dash.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { fontSize: 16, color: dash.inkSoft, fontWeight: '700' },
  modalContent: { paddingHorizontal: spacing.lg, paddingBottom: 48 },

  emojiCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  modalEmoji: { fontSize: 30 },
  kicker: {
    fontSize: 12,
    fontWeight: '800',
    color: '#C9A96E',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  modalTitle: {
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
  inlineImageCard: {
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
  inlineImage: { width: '100%', height: '100%' },
});
