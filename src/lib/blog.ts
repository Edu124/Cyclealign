import { supabase, isSupabaseConfigured } from './supabase';
import type { BlogPost } from '@/types/models';

function mapRow(d: any): BlogPost {
  return {
    id: d.id,
    title: d.title,
    excerpt: d.excerpt,
    body: d.body,
    emoji: d.emoji,
    accentColor: d.accent_color,
    author: d.author,
    publishedAt: d.published_at,
  };
}

// ── Example posts ─────────────────────────────────────────────────────────────
// Shown in demo mode (no Supabase) and as a fallback while the real blog table
// is still empty, so the Blog tab never looks abandoned.

export const EXAMPLE_POSTS: BlogPost[] = [
  {
    id: 'example-1',
    title: 'Why your calendar should know about your cycle',
    excerpt: 'The most productive week of your month is predictable. Most of us plan straight through it.',
    body: `Somewhere in your month there's a week where ideas come easier, conversations flow, and hard things feel lighter. It isn't luck — it's your follicular and ovulatory window, and it's predictable.

Yet most of us schedule as if every day were interchangeable: the big pitch lands on day 26, the deep-work sprint on day 2, and we blame ourselves when it feels like wading through mud.

Cycle-aware planning isn't about doing less. It's about putting the same work in different places — bold moves in your rising window, detail work in your luteal weeks, and real rest where your body already planned it.

Start small: look at next week, find one high-stakes task, and check what day of your cycle it lands on. That one glance is the whole habit.`,
    emoji: '📅',
    accentColor: '#7FAA5A',
    author: 'Vinita',
    publishedAt: '2026-06-24T09:00:00Z',
  },
  {
    id: 'example-2',
    title: "PMS isn't a personality flaw",
    excerpt: "You're not 'too sensitive' four days a month. Your hormones are doing exactly what they're designed to do.",
    body: `The week before your period, oestrogen and serotonin dip together. The patience you had in abundance two weeks ago genuinely isn't as available — that's chemistry, not character.

Yet so many of us apologise our way through the late luteal phase, as if needing more rest or reacting more strongly were failures of discipline.

Here's a reframe: late luteal isn't a worse version of you. It's a more honest one. The things that irritate you now probably always irritated you — you just had more of a buffer before.

So instead of pushing through, try planning for it: fewer high-stakes conversations, earlier nights, gentler expectations. Not because you're fragile — because you're cyclical, and pretending otherwise is what actually costs you.`,
    emoji: '🌙',
    accentColor: '#D95F52',
    author: 'Vinita',
    publishedAt: '2026-06-17T09:00:00Z',
  },
  {
    id: 'example-3',
    title: 'The four-phase guide to asking for what you want',
    excerpt: 'Timing a raise conversation, a hard talk, or a big ask? Your cycle already knows your best window.',
    body: `Every negotiation guide talks about preparation. Almost none talk about timing — and for women, timing has a biological layer worth using.

Around ovulation, verbal fluency and confidence peak together. If there's a conversation you've been putting off — salary, boundaries, a big ask — this is your window. You'll find the words faster and hold your ground more comfortably.

Your follicular phase is for building the case: gathering evidence, rehearsing, imagining objections. Your luteal phase is for the follow-through — the detailed email, the contract read, the fine print.

And menstruation? That's when your intuition is loudest. If something feels off about a deal during your period, listen. That signal is worth more than any script.`,
    emoji: '☀️',
    accentColor: '#EDA639',
    author: 'Vinita',
    publishedAt: '2026-06-10T09:00:00Z',
  },
];

export async function fetchBlogPosts(): Promise<BlogPost[]> {
  if (!isSupabaseConfigured) return EXAMPLE_POSTS;
  const { data } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('is_published', true)
    .order('published_at', { ascending: false });
  const rows = (data ?? []).map(mapRow);
  return rows.length > 0 ? rows : EXAMPLE_POSTS;
}

export async function fetchBlogPost(id: string): Promise<BlogPost | null> {
  const example = EXAMPLE_POSTS.find((p) => p.id === id);
  if (example) return example;
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  return data ? mapRow(data) : null;
}
