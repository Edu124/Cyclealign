import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { CycleLog, DailyLog, Profile } from '@/types/models';

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
