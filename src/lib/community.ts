import { supabase, isSupabaseConfigured } from './supabase';
import type { CommunityPost, DopamineItem, ReactionType, WeeklyTopic } from '@/types/models';

export async function fetchActiveTopic(): Promise<WeeklyTopic | null> {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase
    .from('community_topics')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    title: data.title,
    body: data.body,
    isActive: data.is_active,
    weekStart: data.week_start,
    createdAt: data.created_at,
  };
}

export async function fetchPosts(topicId?: string): Promise<CommunityPost[]> {
  if (!isSupabaseConfigured) return [];
  let query = supabase
    .from('community_posts')
    .select('id, user_id, topic_id, content, is_anonymous, phase_key, cycle_day, created_at')
    .order('created_at', { ascending: false })
    .limit(60);
  if (topicId) query = query.eq('topic_id', topicId);

  const { data: posts } = await query;
  if (!posts || posts.length === 0) return [];

  const postIds = posts.map((p) => p.id);
  const { data: reactions } = await supabase
    .from('post_reactions')
    .select('post_id, reaction_type, user_id')
    .in('post_id', postIds);

  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = user?.id;

  // Fetch display names only for non-anonymous posts
  const namedUserIds = [...new Set(
    posts.filter((p) => !p.is_anonymous).map((p) => p.user_id)
  )];
  let nameMap: Record<string, string> = {};
  if (namedUserIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', namedUserIds);
    (profiles ?? []).forEach((p) => { nameMap[p.id] = p.name; });
  }

  return posts.map((p) => {
    const pr = reactions?.filter((r) => r.post_id === p.id) ?? [];
    const myReaction = (pr.find((r) => r.user_id === currentUserId)?.reaction_type ?? null) as ReactionType | null;
    return {
      id: p.id,
      userId: p.user_id,
      topicId: p.topic_id,
      content: p.content,
      isAnonymous: p.is_anonymous,
      phaseKey: p.phase_key,
      cycleDay: p.cycle_day,
      displayName: p.is_anonymous ? 'Anonymous' : (nameMap[p.user_id] ?? 'Member'),
      createdAt: p.created_at,
      reactions: {
        felt_this:      pr.filter((r) => r.reaction_type === 'felt_this').length,
        sending_energy: pr.filter((r) => r.reaction_type === 'sending_energy').length,
        inspiring:      pr.filter((r) => r.reaction_type === 'inspiring').length,
      },
      myReaction,
    };
  });
}

export async function createPost(params: {
  content: string;
  isAnonymous: boolean;
  topicId?: string;
  phaseKey?: string;
  cycleDay?: number;
}): Promise<CommunityPost | null> {
  if (!isSupabaseConfigured) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from('community_posts')
    .insert({
      user_id:      user.id,
      topic_id:     params.topicId ?? null,
      content:      params.content,
      is_anonymous: params.isAnonymous,
      phase_key:    params.phaseKey ?? null,
      cycle_day:    params.cycleDay ?? null,
    })
    .select('id, user_id, topic_id, content, is_anonymous, phase_key, cycle_day, created_at')
    .single();
  if (!data) return null;

  let displayName = 'Anonymous';
  if (!params.isAnonymous) {
    const { data: profile } = await supabase
      .from('profiles').select('name').eq('id', user.id).single();
    displayName = profile?.name ?? 'Member';
  }

  return {
    id: data.id,
    userId: data.user_id,
    topicId: data.topic_id,
    content: data.content,
    isAnonymous: data.is_anonymous,
    phaseKey: data.phase_key,
    cycleDay: data.cycle_day,
    displayName,
    createdAt: data.created_at,
    reactions: { felt_this: 0, sending_energy: 0, inspiring: 0 },
    myReaction: null,
  };
}

export async function toggleReaction(postId: string, reactionType: ReactionType): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: existing } = await supabase
    .from('post_reactions')
    .select('id, reaction_type')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) {
    if (existing.reaction_type === reactionType) {
      await supabase.from('post_reactions').delete().eq('id', existing.id);
    } else {
      await supabase.from('post_reactions').update({ reaction_type: reactionType }).eq('id', existing.id);
    }
  } else {
    await supabase.from('post_reactions').insert({
      post_id: postId, user_id: user.id, reaction_type: reactionType,
    });
  }
}

export async function fetchDopamineItems(phaseKey: string): Promise<DopamineItem[]> {
  if (!isSupabaseConfigured) return [];
  const { data } = await supabase
    .from('dopamine_items')
    .select('*')
    .in('phase_key', [phaseKey, 'all'])
    .eq('is_active', true)
    .order('sort_order');
  if (!data) return [];
  return data.map((d) => ({
    id: d.id,
    phaseKey: d.phase_key,
    label: d.label,
    emoji: d.emoji,
    durationMinutes: d.duration_minutes,
    sortOrder: d.sort_order,
  }));
}

export async function completeDopamineItem(itemId: string, date: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('dopamine_completions').upsert(
    { user_id: user.id, item_id: itemId, completed_date: date },
    { onConflict: 'user_id,item_id,completed_date' }
  );
}

export async function fetchTodayCompletions(date: string): Promise<string[]> {
  if (!isSupabaseConfigured) return [];
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from('dopamine_completions')
    .select('item_id')
    .eq('user_id', user.id)
    .eq('completed_date', date);
  return (data ?? []).map((d) => d.item_id);
}

export async function createTopic(title: string, body: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  await supabase.from('community_topics').update({ is_active: false }).eq('is_active', true);
  await supabase.from('community_topics').insert({
    title,
    body,
    is_active: true,
    week_start: new Date().toISOString().split('T')[0],
  });
}
