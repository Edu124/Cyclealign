import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { capacityPhaseFor, CAPACITY } from '@/lib/intelligence/capacity';
import { todayISO } from '@/lib/dates';
import type { DailyLog } from '@/types/models';
import type { Prediction } from '@/types/models';

export interface PartnerLink {
  id: string;
  userId: string;
  partnerUserId: string | null;
  inviteCode: string;
  status: 'pending' | 'active' | 'revoked';
  sharePhase: boolean;
  shareToughDay: boolean;
  shareEnergyMood: boolean;
  sharedPhase: string | null;
  sharedToughDay: boolean | null;
  sharedMessage: string | null;
  sharedUpdatedAt: string | null;
}

function mapRow(d: any): PartnerLink {
  return {
    id: d.id,
    userId: d.user_id,
    partnerUserId: d.partner_user_id,
    inviteCode: d.invite_code,
    status: d.status,
    sharePhase: d.share_phase,
    shareToughDay: d.share_tough_day,
    shareEnergyMood: d.share_energy_mood,
    sharedPhase: d.shared_phase,
    sharedToughDay: d.shared_tough_day,
    sharedMessage: d.shared_message,
    sharedUpdatedAt: d.shared_updated_at,
  };
}

const PHASE_LABEL: Record<string, string> = {
  menstrual: 'her period',
  follicular: 'her follicular phase',
  ovulation: 'ovulation',
  luteal: 'her luteal phase',
};

/**
 * Digested, opt-in summary — never raw numbers. "Tough day" leans on the
 * phase-based capacity model, but today's actual Quick Log (if she's logged
 * one) overrides it, since how she's actually doing beats a generic guess.
 */
export function computeDigestedStatus(
  prediction: Prediction,
  todaysLog: DailyLog | undefined,
): { phase: string; toughDay: boolean; message: string } {
  const phaseCapacityLow = CAPACITY[capacityPhaseFor(prediction)] === 'LOW';
  const loggedRough = todaysLog && (todaysLog.energy <= 2 || ['rough', 'low'].includes(todaysLog.mood));
  const loggedGood = todaysLog && todaysLog.energy >= 4 && !['rough', 'low'].includes(todaysLog.mood);

  const toughDay = loggedRough ? true : loggedGood ? false : phaseCapacityLow;
  const message = toughDay
    ? "Today might be a tougher day for her 💛 — a little extra patience and kindness would go a long way."
    : "She's doing well today ✨ — a good day to check in and enjoy the moment together.";

  return { phase: prediction.currentPhase, toughDay, message };
}

function genInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I ambiguity
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

/** The signed-in user's own link, as the sharer — read-only, never creates one. */
export async function getMyInviteIfExists(): Promise<PartnerLink | null> {
  if (!isSupabaseConfigured) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from('partner_links')
    .select('*')
    .eq('user_id', user.id)
    .in('status', ['pending', 'active'])
    .maybeSingle();
  return data ? mapRow(data) : null;
}

/** The signed-in user's own link, as the sharer — creating one if none exists yet. */
export async function getOrCreateMyInvite(): Promise<{ link: PartnerLink | null; error?: string }> {
  if (!isSupabaseConfigured) return { link: null, error: 'Not available in demo mode.' };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { link: null, error: 'Please sign in first.' };

  const existing = await getMyInviteIfExists();
  if (existing) return { link: existing };

  const { data: created, error } = await supabase
    .from('partner_links')
    .insert({ user_id: user.id, invite_code: genInviteCode() })
    .select('*')
    .single();
  if (error || !created) return { link: null, error: error?.message ?? 'Could not create an invite.' };
  return { link: mapRow(created) };
}

export async function acceptInvite(code: string): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { ok: false, error: 'Not available in demo mode.' };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Please sign in first.' };

  const { data: pending } = await supabase
    .from('partner_links')
    .select('id, user_id')
    .eq('invite_code', code.trim().toUpperCase())
    .eq('status', 'pending')
    .maybeSingle();
  if (!pending) return { ok: false, error: 'That code is invalid or already used.' };
  if (pending.user_id === user.id) return { ok: false, error: "You can't connect to your own invite." };

  const { error } = await supabase
    .from('partner_links')
    .update({ partner_user_id: user.id, status: 'active' })
    .eq('id', pending.id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function updateSharingSettings(
  linkId: string,
  settings: Partial<Pick<PartnerLink, 'sharePhase' | 'shareToughDay' | 'shareEnergyMood'>>,
): Promise<void> {
  if (!isSupabaseConfigured) return;
  const patch: Record<string, boolean> = {};
  if (settings.sharePhase !== undefined) patch.share_phase = settings.sharePhase;
  if (settings.shareToughDay !== undefined) patch.share_tough_day = settings.shareToughDay;
  if (settings.shareEnergyMood !== undefined) patch.share_energy_mood = settings.shareEnergyMood;
  await supabase.from('partner_links').update(patch).eq('id', linkId);
}

/** Recompute and republish the digested summary — only fields the user has toggled on are written. */
export async function publishDigestedStatus(link: PartnerLink, prediction: Prediction): Promise<void> {
  if (!isSupabaseConfigured || link.status !== 'active') return;
  const today = todayISO();
  let todaysLog: DailyLog | undefined;
  try {
    const raw = await import('@/lib/stores/useDailyLog');
    todaysLog = raw.useDailyLog.getState().logs[today];
  } catch {}

  const digest = computeDigestedStatus(prediction, todaysLog);
  await supabase
    .from('partner_links')
    .update({
      shared_phase: link.sharePhase ? PHASE_LABEL[digest.phase] ?? digest.phase : null,
      shared_tough_day: link.shareToughDay ? digest.toughDay : null,
      shared_message: link.shareToughDay ? digest.message : null,
      shared_updated_at: new Date().toISOString(),
    })
    .eq('id', link.id);
}

export async function revokeLink(linkId: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  await supabase.from('partner_links').delete().eq('id', linkId);
}

/** The active link where the signed-in user is the PARTNER (recipient), if any. */
export async function getMyPartnerConnection(): Promise<PartnerLink | null> {
  if (!isSupabaseConfigured) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from('partner_links')
    .select('*')
    .eq('partner_user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();
  return data ? mapRow(data) : null;
}

export async function sendSupportPing(
  linkId: string,
  toUserId: string,
  message: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { ok: false, error: 'Not available in demo mode.' };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Please sign in first.' };
  const { error } = await supabase
    .from('partner_support_pings')
    .insert({ link_id: linkId, from_user_id: user.id, to_user_id: toUserId, message });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function fetchUnseenPings(): Promise<{ id: string; message: string }[]> {
  if (!isSupabaseConfigured) return [];
  const { data } = await supabase
    .from('partner_support_pings')
    .select('id, message')
    .eq('seen', false)
    .order('created_at', { ascending: false });
  return data ?? [];
}

export async function markPingsSeen(ids: string[]): Promise<void> {
  if (!isSupabaseConfigured || ids.length === 0) return;
  await supabase.from('partner_support_pings').update({ seen: true }).in('id', ids);
}
