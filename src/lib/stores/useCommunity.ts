import { create } from 'zustand';
import type { CommunityPost, DopamineItem, ReactionType, WeeklyTopic } from '@/types/models';
import * as communityLib from '@/lib/community';
import { isSupabaseConfigured } from '@/lib/supabase';

// ── Demo seed data (shown when Supabase is not configured) ──────────────────

const DEMO_TOPIC: WeeklyTopic = {
  id: 'demo-topic-1',
  title: 'What do you let go of when your energy drops?',
  body: "During slower phases, our bodies ask us to ease the pace. What's one thing you've learned to release — without guilt?",
  isActive: true,
  weekStart: new Date().toISOString().split('T')[0],
  createdAt: new Date().toISOString(),
};

const DEMO_POSTS: CommunityPost[] = [
  {
    id: 'demo-post-1',
    userId: 'demo-1',
    topicId: 'demo-topic-1',
    content: 'I let go of trying to reply to every message immediately. My luteal phase taught me that rest IS productive.',
    isAnonymous: false,
    phaseKey: 'luteal',
    cycleDay: 22,
    displayName: 'Priya S.',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    reactions: { felt_this: 12, sending_energy: 4, inspiring: 7 },
    myReaction: null,
  },
  {
    id: 'demo-post-2',
    userId: 'demo-2',
    topicId: null,
    content: 'Day 8 energy is unreal. Finished a proposal I had been avoiding for two weeks. Follicular phase is my superpower ✨',
    isAnonymous: false,
    phaseKey: 'follicular',
    cycleDay: 8,
    displayName: 'Meera R.',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    reactions: { felt_this: 8, sending_energy: 2, inspiring: 15 },
    myReaction: null,
  },
  {
    id: 'demo-post-3',
    userId: 'demo-3',
    topicId: 'demo-topic-1',
    content: 'The pressure to show up the same way every single day. We are cyclical beings — not machines.',
    isAnonymous: true,
    phaseKey: 'menstrual',
    cycleDay: 2,
    displayName: 'Anonymous',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    reactions: { felt_this: 22, sending_energy: 9, inspiring: 11 },
    myReaction: null,
  },
];

const DEMO_DOPAMINE: Record<string, DopamineItem[]> = {
  menstrual: [
    { id: 'd-m-1', phaseKey: 'menstrual', label: 'Take a warm bath',              emoji: '🛁', durationMinutes: 10, sortOrder: 1 },
    { id: 'd-m-2', phaseKey: 'menstrual', label: 'Light your favourite candle',    emoji: '🕯️', durationMinutes:  1, sortOrder: 2 },
    { id: 'd-m-3', phaseKey: 'menstrual', label: 'Read 5 pages of a comfort book', emoji: '📖', durationMinutes: 10, sortOrder: 3 },
    { id: 'd-m-4', phaseKey: 'menstrual', label: 'Legs up the wall pose',          emoji: '🧘', durationMinutes:  5, sortOrder: 4 },
    { id: 'd-m-5', phaseKey: 'menstrual', label: 'Make a warm drink mindfully',    emoji: '☕', durationMinutes:  5, sortOrder: 5 },
  ],
  follicular: [
    { id: 'd-f-1', phaseKey: 'follicular', label: 'Walk somewhere new',               emoji: '🚶', durationMinutes: 15, sortOrder: 1 },
    { id: 'd-f-2', phaseKey: 'follicular', label: 'Brain-dump a creative idea',       emoji: '📓', durationMinutes:  5, sortOrder: 2 },
    { id: 'd-f-3', phaseKey: 'follicular', label: 'Dance to one song',                emoji: '💃', durationMinutes:  3, sortOrder: 3 },
    { id: 'd-f-4', phaseKey: 'follicular', label: 'Text a friend to plan something',  emoji: '📞', durationMinutes:  2, sortOrder: 4 },
    { id: 'd-f-5', phaseKey: 'follicular', label: 'Doodle or colour freely',          emoji: '🎨', durationMinutes: 10, sortOrder: 5 },
  ],
  ovulation: [
    { id: 'd-o-1', phaseKey: 'ovulation', label: 'Call someone you love',                      emoji: '📞', durationMinutes:  5, sortOrder: 1 },
    { id: 'd-o-2', phaseKey: 'ovulation', label: 'Step outside and feel the sun',              emoji: '🌿', durationMinutes:  5, sortOrder: 2 },
    { id: 'd-o-3', phaseKey: 'ovulation', label: 'Leave a kind note for someone',              emoji: '💌', durationMinutes:  2, sortOrder: 3 },
    { id: 'd-o-4', phaseKey: 'ovulation', label: 'Take a photo of something beautiful',        emoji: '📸', durationMinutes:  1, sortOrder: 4 },
    { id: 'd-o-5', phaseKey: 'ovulation', label: 'Learn one interesting fact',                 emoji: '🧠', durationMinutes:  3, sortOrder: 5 },
  ],
  luteal: [
    { id: 'd-l-1', phaseKey: 'luteal', label: 'Write 3 things that went well today',    emoji: '📝', durationMinutes:  3, sortOrder: 1 },
    { id: 'd-l-2', phaseKey: 'luteal', label: 'Wear your cosiest clothes',               emoji: '🧸', durationMinutes:  0, sortOrder: 2 },
    { id: 'd-l-3', phaseKey: 'luteal', label: 'Watch something comforting',              emoji: '🌙', durationMinutes: 15, sortOrder: 3 },
    { id: 'd-l-4', phaseKey: 'luteal', label: 'Enjoy a small treat intentionally',       emoji: '🍫', durationMinutes:  5, sortOrder: 4 },
    { id: 'd-l-5', phaseKey: 'luteal', label: 'Give yourself a 1-min shoulder massage', emoji: '🤗', durationMinutes:  1, sortOrder: 5 },
  ],
};

// ── Store ───────────────────────────────────────────────────────────────────

interface CommunityState {
  posts: CommunityPost[];
  topic: WeeklyTopic | null;
  dopamineItems: DopamineItem[];
  completedIds: string[];
  loading: boolean;

  loadAll: (phaseKey: string, todayISO: string) => Promise<void>;
  addPost: (post: CommunityPost) => void;
  optimisticToggleReaction: (postId: string, reaction: ReactionType) => void;
  toggleDopamineItem: (itemId: string, todayISO: string) => void;
  setTopic: (topic: WeeklyTopic) => void;
}

export const useCommunity = create<CommunityState>()((set, get) => ({
  posts: DEMO_POSTS,
  topic: DEMO_TOPIC,
  dopamineItems: DEMO_DOPAMINE.follicular,
  completedIds: [],
  loading: false,

  loadAll: async (phaseKey, todayISO) => {
    set({ loading: true });
    const fallbackItems = DEMO_DOPAMINE[phaseKey] ?? DEMO_DOPAMINE.follicular;
    if (isSupabaseConfigured) {
      const [topic, posts, dopamineItems, completedIds] = await Promise.all([
        communityLib.fetchActiveTopic(),
        communityLib.fetchPosts(),
        communityLib.fetchDopamineItems(phaseKey),
        communityLib.fetchTodayCompletions(todayISO),
      ]);
      set({
        topic:         topic ?? DEMO_TOPIC,
        posts:         posts.length > 0 ? posts : DEMO_POSTS,
        dopamineItems: dopamineItems.length > 0 ? dopamineItems : fallbackItems,
        completedIds,
        loading: false,
      });
    } else {
      set({
        topic:         DEMO_TOPIC,
        posts:         DEMO_POSTS,
        dopamineItems: fallbackItems,
        loading: false,
      });
    }
  },

  addPost: (post) => set((s) => ({ posts: [post, ...s.posts] })),

  optimisticToggleReaction: (postId, reaction) => {
    set((s) => ({
      posts: s.posts.map((p) => {
        if (p.id !== postId) return p;
        const prev = p.myReaction;
        const counts = { ...p.reactions };
        if (prev) counts[prev] = Math.max(0, counts[prev] - 1);
        if (prev !== reaction) counts[reaction] = counts[reaction] + 1;
        return { ...p, myReaction: prev === reaction ? null : reaction, reactions: counts };
      }),
    }));
    communityLib.toggleReaction(postId, reaction).catch(() => {});
  },

  toggleDopamineItem: (itemId, todayISO) => {
    const already = get().completedIds.includes(itemId);
    set((s) => ({
      completedIds: already
        ? s.completedIds.filter((id) => id !== itemId)
        : [...s.completedIds, itemId],
    }));
    if (!already) communityLib.completeDopamineItem(itemId, todayISO).catch(() => {});
  },

  setTopic: (topic) => set({ topic }),
}));
