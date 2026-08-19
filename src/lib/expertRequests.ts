import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export type ExpertRequestStatus = 'new' | 'read' | 'resolved';

export interface ExpertRequest {
  id: string;
  name: string | null;
  email: string | null;
  concern: string;
  status: ExpertRequestStatus;
  createdAt: string;
}

function mapRow(d: any): ExpertRequest {
  return {
    id: d.id,
    name: d.name,
    email: d.email,
    concern: d.concern,
    status: d.status,
    createdAt: d.created_at,
  };
}

export async function submitExpertRequest(
  concern: string,
  name?: string,
  email?: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { ok: false, error: 'Not available in demo mode.' };
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Please sign in to reach an expert.' };

  const { error } = await supabase.from('expert_requests').insert({
    user_id: user.id,
    name: name?.trim() || null,
    email: email?.trim() || null,
    concern: concern.trim(),
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** The signed-in user's own past submissions, newest first. */
export async function fetchMyExpertRequests(): Promise<ExpertRequest[]> {
  if (!isSupabaseConfigured) return [];
  const { data } = await supabase
    .from('expert_requests')
    .select('*')
    .order('created_at', { ascending: false });
  return (data ?? []).map(mapRow);
}

/** Admin-only — RLS blocks this for everyone else regardless of what the client asks for. */
export async function fetchAllExpertRequests(): Promise<ExpertRequest[]> {
  if (!isSupabaseConfigured) return [];
  const { data } = await supabase
    .from('expert_requests')
    .select('*')
    .order('created_at', { ascending: false });
  return (data ?? []).map(mapRow);
}

export async function updateExpertRequestStatus(
  id: string,
  status: ExpertRequestStatus,
): Promise<void> {
  if (!isSupabaseConfigured) return;
  await supabase.from('expert_requests').update({ status }).eq('id', id);
}

/** Whether the signed-in user is flagged as an admin (profiles.is_admin). */
export async function isCurrentUserAdmin(): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle();
  return !!data?.is_admin;
}
