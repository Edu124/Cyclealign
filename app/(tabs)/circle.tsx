import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useEffect, useState } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Screen } from '@/components/ui';
import { DopamineMenuCard } from '@/components/community/DopamineMenuCard';
import { WeeklyTopicCard } from '@/components/community/WeeklyTopicCard';
import { PostCard } from '@/components/community/PostCard';
import { PostComposer } from '@/components/community/PostComposer';
import { usePrediction } from '@/lib/hooks/usePrediction';
import { useAppStore } from '@/lib/stores/useAppStore';
import { useCommunity } from '@/lib/stores/useCommunity';
import * as communityLib from '@/lib/community';
import { isSupabaseConfigured } from '@/lib/supabase';
import { todayISO } from '@/lib/dates';
import { dash } from '@/theme';
import type { CommunityPost, ReactionType } from '@/types/models';

export default function Circle() {
  const profile = useAppStore((s) => s.profile);
  const prediction = usePrediction();
  const {
    posts, topic, dopamineItems, completedIds, loading,
    loadAll, addPost, optimisticToggleReaction, toggleDopamineItem, setTopic,
  } = useCommunity();

  const [composerOpen, setComposerOpen] = useState(false);
  const [replyToTopic, setReplyToTopic] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminTitle, setAdminTitle] = useState('');
  const [adminBody, setAdminBody] = useState('');
  const [adminPosting, setAdminPosting] = useState(false);

  const today = todayISO();
  const phaseKey = prediction?.currentPhase ?? 'follicular';
  const cycleDay = prediction?.dayOfCycle ?? 1;
  // @ts-ignore — is_admin added via migration; may not be in generated types yet
  const isAdmin = (profile as any)?.is_admin === true;

  useEffect(() => {
    loadAll(phaseKey, today);
  }, [phaseKey, today]);

  const topicPosts = posts.filter((p) => p.topicId === topic?.id);
  const feedPosts  = posts.filter((p) => !p.topicId);

  async function handlePost(content: string, anonymous: boolean, toTopic: boolean) {
    const topicId = toTopic ? (topic?.id ?? undefined) : undefined;

    if (isSupabaseConfigured) {
      const newPost = await communityLib.createPost({
        content,
        isAnonymous: anonymous,
        topicId,
        phaseKey,
        cycleDay,
      });
      if (newPost) addPost(newPost);
    } else {
      // Demo mode: optimistic local post
      const demoPost: CommunityPost = {
        id: `local-${Date.now()}`,
        userId: 'local',
        topicId: topicId ?? null,
        content,
        isAnonymous: anonymous,
        phaseKey,
        cycleDay,
        displayName: anonymous ? 'Anonymous' : (profile?.name ?? 'You'),
        createdAt: new Date().toISOString(),
        reactions: { felt_this: 0, sending_energy: 0, inspiring: 0 },
        myReaction: null,
      };
      addPost(demoPost);
    }
  }

  async function handleAdminPost() {
    if (!adminTitle.trim()) return;
    setAdminPosting(true);
    try {
      await communityLib.createTopic(adminTitle.trim(), adminBody.trim());
      setTopic({
        id: `local-topic-${Date.now()}`,
        title: adminTitle.trim(),
        body: adminBody.trim() || null,
        isActive: true,
        weekStart: today,
        createdAt: new Date().toISOString(),
      });
      setAdminTitle('');
      setAdminBody('');
      setAdminModalOpen(false);
    } finally {
      setAdminPosting(false);
    }
  }

  function openComposer(replyMode: boolean) {
    setReplyToTopic(replyMode);
    setComposerOpen(true);
  }

  return (
    <Screen gradient={[dash.bg, dash.bg]} contentStyle={styles.content}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.headerRow}>
        <View>
          <Text style={styles.heading}>Circle</Text>
          <Text style={styles.subheading}>Your community</Text>
        </View>
        <View style={styles.headerActions}>
          {isAdmin && (
            <TouchableOpacity
              style={styles.adminBtn}
              onPress={() => setAdminModalOpen(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.adminBtnText}>+ Topic</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.composeBtn}
            onPress={() => openComposer(false)}
            activeOpacity={0.8}
          >
            <Text style={styles.composeBtnText}>✏️</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Dopamine Shop */}
      <Animated.View entering={FadeInDown.delay(60).duration(400)}>
        <DopamineMenuCard phaseKey={phaseKey} />
      </Animated.View>

      {/* Weekly Topic */}
      {topic && (
        <Animated.View entering={FadeInDown.delay(120).duration(400)}>
          <WeeklyTopicCard
            topic={topic}
            replyCount={topicPosts.length}
            onReply={() => openComposer(true)}
          />
        </Animated.View>
      )}

      {/* Topic replies */}
      {topicPosts.length > 0 && (
        <Animated.View entering={FadeInDown.delay(160).duration(400)}>
          <Text style={styles.sectionLabel}>Voices on this week's topic</Text>
          {topicPosts.map((post, i) => (
            <PostCard
              key={post.id}
              post={post}
              index={i}
              onReact={(id: string, r: ReactionType) => optimisticToggleReaction(id, r)}
            />
          ))}
        </Animated.View>
      )}

      {/* Community feed */}
      <Animated.View entering={FadeInDown.delay(200).duration(400)}>
        <View style={styles.feedHeader}>
          <Text style={styles.sectionLabel}>Community</Text>
          <TouchableOpacity onPress={() => openComposer(false)}>
            <Text style={styles.feedCta}>Share something →</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {feedPosts.length === 0 ? (
        <Animated.View entering={FadeInDown.delay(240).duration(400)} style={styles.empty}>
          <Text style={styles.emptyEmoji}>🌿</Text>
          <Text style={styles.emptyText}>Be the first to share something with the community.</Text>
        </Animated.View>
      ) : (
        feedPosts.map((post, i) => (
          <PostCard
            key={post.id}
            post={post}
            index={i}
            onReact={(id: string, r: ReactionType) => optimisticToggleReaction(id, r)}
          />
        ))
      )}

      {/* Post Composer */}
      <PostComposer
        visible={composerOpen}
        onClose={() => setComposerOpen(false)}
        onSubmit={handlePost}
        currentPhase={phaseKey}
        cycleDay={cycleDay}
        activeTopic={topic}
        defaultReplyToTopic={replyToTopic}
      />

      {/* Admin: New Topic Modal */}
      <Modal visible={adminModalOpen} animationType="slide" transparent onRequestClose={() => setAdminModalOpen(false)}>
        <View style={styles.adminOverlay}>
          <View style={styles.adminSheet}>
            <Text style={styles.adminTitle}>Post a New Topic</Text>
            <TextInput
              style={styles.adminInput}
              placeholder="Topic question or prompt…"
              placeholderTextColor={dash.muted}
              value={adminTitle}
              onChangeText={setAdminTitle}
            />
            <TextInput
              style={[styles.adminInput, styles.adminInputMulti]}
              placeholder="Optional description…"
              placeholderTextColor={dash.muted}
              value={adminBody}
              onChangeText={setAdminBody}
              multiline
            />
            <View style={styles.adminFooter}>
              <TouchableOpacity onPress={() => setAdminModalOpen(false)}>
                <Text style={styles.adminCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.adminPostBtn, (!adminTitle.trim() || adminPosting) && styles.adminPostBtnDisabled]}
                onPress={handleAdminPost}
                disabled={!adminTitle.trim() || adminPosting}
                activeOpacity={0.85}
              >
                <Text style={styles.adminPostBtnText}>{adminPosting ? 'Posting…' : 'Post Topic'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 18, gap: 16 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: dash.ink,
    letterSpacing: -0.5,
  },
  subheading: {
    fontSize: 13,
    color: dash.inkSoft,
    marginTop: 2,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  adminBtn: {
    backgroundColor: '#F0ECEA',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  adminBtnText: { fontSize: 13, fontWeight: '600', color: dash.inkSoft },
  composeBtn: {
    backgroundColor: dash.sage,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composeBtnText: { fontSize: 16 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: dash.inkSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feedCta: { fontSize: 13, color: dash.sage, fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyEmoji: { fontSize: 32 },
  emptyText: { fontSize: 14, color: dash.muted, textAlign: 'center' },
  // Admin modal
  adminOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  adminSheet: {
    backgroundColor: dash.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    gap: 14,
  },
  adminTitle: { fontSize: 17, fontWeight: '700', color: dash.ink },
  adminInput: {
    fontSize: 15,
    color: dash.ink,
    backgroundColor: '#F9F6F1',
    borderRadius: 12,
    padding: 12,
  },
  adminInputMulti: { minHeight: 80, textAlignVertical: 'top' },
  adminFooter: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 16 },
  adminCancel: { fontSize: 15, color: dash.muted },
  adminPostBtn: { backgroundColor: dash.sage, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  adminPostBtnDisabled: { backgroundColor: dash.line },
  adminPostBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
