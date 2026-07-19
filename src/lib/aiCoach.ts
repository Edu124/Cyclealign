import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { todayISO } from '@/lib/dates';
import type { PhaseKey } from '@/types/models';

export const AI_DAILY_LIMIT = 5;
export const AI_DAILY_LIMIT_PREMIUM = 25;

/** Daily question cap for the user's tier — must mirror the ai-coach function. */
export function aiDailyLimit(premium: boolean): number {
  return premium ? AI_DAILY_LIMIT_PREMIUM : AI_DAILY_LIMIT;
}

export interface CoachMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface CoachContext {
  phase?: PhaseKey;
  dayOfCycle?: number;
  cycleLength?: number;
  /** Compact recent Quick Log summary (see recentLogSummary) — lets the coach
   *  answer from her actual logged state, not just the textbook phase. */
  logSummary?: string;
}

export interface CoachReply {
  reply: string;
  remaining: number;
  limitReached: boolean;
}

// ── Demo mode (no Supabase configured) ────────────────────────────────────────
// Keeps the UX identical — phase-aware canned tips + the same local daily cap —
// so the screen is fully testable before the backend is deployed.

const DEMO_TIPS: Record<PhaseKey, string> = {
  menstrual:
    "Your energy is naturally at its lowest right now — that's biology, not laziness. Keep today's list short, drink something warm, and let rest count as progress. 🌙",
  follicular:
    'Oestrogen is climbing, so your brain is primed for new things. This is the week to start the project, pitch the idea, or book the hard conversation for later. 🌿',
  ovulation:
    "You're at your social and verbal peak. If something needs negotiating, presenting, or asking — today is the day to do it. ☀️",
  luteal:
    'Progesterone makes you detail-sharp but energy-sensitive. Protect your calendar, finish things instead of starting them, and eat regularly to steady your mood. 🍂',
};

function demoCountKey(dateISO: string) {
  return `ai_coach_count_${dateISO}`;
}

async function getDemoCount(): Promise<number> {
  const raw = await AsyncStorage.getItem(demoCountKey(todayISO()));
  return raw ? parseInt(raw, 10) || 0 : 0;
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Questions already used today (for the remaining-count pill on open). */
export async function getUsedToday(): Promise<number> {
  if (!isSupabaseConfigured) return getDemoCount();

  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);
  const { count } = await supabase
    .from('ai_messages')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'user')
    .gte('created_at', dayStart.toISOString());
  return count ?? 0;
}

/** Chat history for the signed-in user (most recent last). */
export async function fetchHistory(): Promise<CoachMessage[]> {
  if (!isSupabaseConfigured) return [];
  const { data } = await supabase
    .from('ai_messages')
    .select('id, role, content')
    .order('created_at', { ascending: true })
    .limit(50);
  return (data ?? []) as CoachMessage[];
}

/** Send a question through the ai-coach gateway. */
export async function askCoach(message: string, context: CoachContext): Promise<CoachReply> {
  if (!isSupabaseConfigured) {
    const used = await getDemoCount();
    if (used >= AI_DAILY_LIMIT) return { reply: '', remaining: 0, limitReached: true };
    await AsyncStorage.setItem(demoCountKey(todayISO()), String(used + 1));
    return {
      reply: DEMO_TIPS[context.phase ?? 'follicular'],
      remaining: AI_DAILY_LIMIT - used - 1,
      limitReached: false,
    };
  }

  const { data, error } = await supabase.functions.invoke('ai-coach', {
    body: { message, ...context },
  });

  if (error) {
    // A 429 from the function means the daily limit was hit server-side.
    const status = (error as any)?.context?.status;
    if (status === 429) return { reply: '', remaining: 0, limitReached: true };
    throw new Error('The coach is unavailable right now — try again in a moment.');
  }

  return {
    reply: data.reply as string,
    remaining: data.remaining as number,
    limitReached: false,
  };
}
