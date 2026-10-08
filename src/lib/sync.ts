import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { CycleLog, DailyLog, Profile } from '@/types/models';

/**
 * The adaptive-mode columns (migration 0012). Keep OFF until that migration has
 * been applied to the database — writing to columns that don't exist yet would
 * make every profile / check-in upload fail. While off, these answers stay on
 * the device only (and restoreFromCloud keeps them).
 */
export const SYNC_ADAPTIVE_COLUMNS: boolean = true;

// ── Push (local → cloud) ──────────────────────────────────────────────────────

export async function pushProfile(profile: Profile): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('profiles').upsert({
    id: user.id,
    name: profile.name,
    email: profile.email ?? null,
    gender: profile.gender,
    birth_date: profile.birthDate,
    avg_cycle_length: profile.avgCycleLength,
    avg_period_length: profile.avgPeriodLength,
    user_role: profile.role ?? null,
    ...(SYNC_ADAPTIVE_COLUMNS && {
      cycle_regularity: profile.cycleRegularity ?? null,
      health_context: profile.healthContext ?? null,
      cycle_length_range: profile.cycleLengthRange ?? null,
    }),
  });
}

export async function pushCycleLog(log: CycleLog): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('cycle_logs').upsert({
    user_id: user.id,
    start_date: log.startDate,
    end_date: log.endDate ?? null,
    notes: log.notes ?? null,
  }, { onConflict: 'user_id,start_date' });
}

/**
 * Corrects a cycle log's start date. Rows are keyed by (user_id, start_date)
 * — upserting the new date alone would leave the old row behind as a stale
 * duplicate, so the old row is deleted first.
 */
export async function updateCycleLogDate(oldStartDate: string, log: CycleLog): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  if (oldStartDate !== log.startDate) {
    await supabase
      .from('cycle_logs')
      .delete()
      .eq('user_id', user.id)
      .eq('start_date', oldStartDate);
  }
  await supabase.from('cycle_logs').upsert({
    user_id: user.id,
    start_date: log.startDate,
    end_date: log.endDate ?? null,
    notes: log.notes ?? null,
  }, { onConflict: 'user_id,start_date' });
}

export async function pushDailyLog(log: DailyLog): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('daily_logs').upsert({
    user_id: user.id,
    date_iso: log.dateISO,
    energy: log.energy,
    mood: log.mood,
    win: log.win,
    ...(SYNC_ADAPTIVE_COLUMNS && {
      focus: log.focus ?? null,
      decision_confidence: log.decisionConfidence ?? null,
      sleep_quality: log.sleepQuality ?? null,
      sleep_hours: log.sleepHours ?? null,
      stress: log.stress ?? null,
      symptoms_json: log.symptoms ?? null,
      bleeding: log.bleeding ?? null,
    }),
  }, { onConflict: 'user_id,date_iso' });
}

// ── Delete (account closure) ────────────────────────────────────────────────────

/**
 * Removes the signed-in user's rows from every table the client has a
 * delete policy for (cycle_logs, daily_logs, profiles). The subscriptions
 * row and the auth.users record itself are service-role-only and outlive
 * this — full account closure additionally needs a support request, which
 * is why the deletion page tells users that.
 */
export async function deleteAccountData(): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('cycle_logs').delete().eq('user_id', user.id);
  await supabase.from('daily_logs').delete().eq('user_id', user.id);
  await supabase.from('profiles').delete().eq('id', user.id);
}

// ── Pull (cloud → local) ──────────────────────────────────────────────────────

export async function pullState(): Promise<{
  profile: Profile | null;
  cycleLogs: CycleLog[];
  dailyLogs: Record<string, DailyLog>;
  subscriptionTier: 'free' | 'premium';
}> {
  if (!isSupabaseConfigured) {
    return { profile: null, cycleLogs: [], dailyLogs: {}, subscriptionTier: 'free' };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { profile: null, cycleLogs: [], dailyLogs: {}, subscriptionTier: 'free' };
  }

  const [
    { data: p },
    { data: logs },
    { data: dLogs },
    { data: sub },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('cycle_logs').select('*').eq('user_id', user.id).order('start_date', { ascending: false }),
    supabase.from('daily_logs').select('*').eq('user_id', user.id),
    supabase.from('subscriptions').select('tier,expiry_date').eq('user_id', user.id).maybeSingle(),
  ]);

  const profile: Profile | null = p ? {
    id: p.id,
    name: p.name,
    email: p.email ?? undefined,
    gender: p.gender,
    birthDate: p.birth_date,
    avgCycleLength: p.avg_cycle_length,
    avgPeriodLength: p.avg_period_length,
    role: p.user_role ?? undefined,
    cycleRegularity: p.cycle_regularity ?? undefined,
    healthContext: p.health_context ?? undefined,
    cycleLengthRange: p.cycle_length_range ?? undefined,
    createdAt: p.created_at,
  } : null;

  const cycleLogs: CycleLog[] = (logs ?? []).map((l) => ({
    id: l.id,
    userId: l.user_id,
    startDate: l.start_date,
    endDate: l.end_date,
    notes: l.notes,
    createdAt: l.created_at,
  }));

  const dailyLogs: Record<string, DailyLog> = {};
  for (const l of dLogs ?? []) {
    dailyLogs[l.date_iso] = {
      dateISO: l.date_iso,
      energy: l.energy,
      mood: l.mood,
      win: l.win ?? '',
      ...(l.focus != null && { focus: l.focus }),
      ...(l.decision_confidence != null && { decisionConfidence: l.decision_confidence }),
      ...(l.sleep_quality != null && { sleepQuality: l.sleep_quality }),
      ...(l.sleep_hours != null && { sleepHours: Number(l.sleep_hours) }),
      ...(l.stress != null && { stress: l.stress }),
      ...(Array.isArray(l.symptoms_json) && { symptoms: l.symptoms_json }),
      ...(l.bleeding != null && { bleeding: l.bleeding }),
    };
  }

  // Subscription: premium only if tier='premium' and not expired
  const today = new Date().toISOString().slice(0, 10);
  const isActivePremium =
    sub?.tier === 'premium' &&
    (!sub.expiry_date || sub.expiry_date >= today);
  const subscriptionTier: 'free' | 'premium' = isActivePremium ? 'premium' : 'free';

  return { profile, cycleLogs, dailyLogs, subscriptionTier };
}
