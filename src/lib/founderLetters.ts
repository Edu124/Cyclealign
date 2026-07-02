import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { todayISO } from '@/lib/dates';

export const MAX_LETTERS_PER_DAY = 5;

function countKey(dateISO: string) {
  return `founder_letter_count_${dateISO}`;
}

/** How many letters the user has already sent today (device-local counter). */
export async function getTodayLetterCount(): Promise<number> {
  const raw = await AsyncStorage.getItem(countKey(todayISO()));
  return raw ? parseInt(raw, 10) || 0 : 0;
}

async function bumpTodayLetterCount(): Promise<number> {
  const key = countKey(todayISO());
  const next = (await getTodayLetterCount()) + 1;
  await AsyncStorage.setItem(key, String(next));
  return next;
}

/**
 * Send a letter to the founder. Writes to Supabase when configured; in local
 * demo mode (no backend) it still counts against the daily cap so the UX is
 * consistent, it just isn't persisted anywhere the founder can read it.
 */
export async function sendFounderLetter(message: string): Promise<void> {
  const trimmed = message.trim();
  if (!trimmed) return;

  if (isSupabaseConfigured) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('founder_letters').insert({ user_id: user.id, message: trimmed });
    }
  }

  await bumpTodayLetterCount();
}
