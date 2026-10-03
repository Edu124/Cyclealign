// Keeps every connected partner's "Support someone" message fresh even when
// the sharer hasn't opened the app. The app only republishes its digest while
// it's running, so without this a friend would keep seeing the last message
// for as long as she stays away. This job recomputes it from the cycle data
// already synced to Supabase and writes it onto the same partner_links row.
//
// Called on a schedule by pg_cron (see migration 0011) — NOT by the app.
// Deploy:  supabase functions deploy partner-digest-refresh --no-verify-jwt
// Auth:    the x-cron-secret header must match the vault secret
//          `partner_digest_cron_secret` (see migration 0011).
//
// Safe to call repeatedly: a link is skipped if it was updated in the last
// STALE_AFTER_HOURS (the app writes with her exact local date, which is more
// precise than this job's UTC date, so we never overwrite a fresh one).
// Add ?dryRun=1 to see what would change without writing anything.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import {
  CAPACITY_TO_PHASE_KEY,
  capacityPhaseForDate,
  isToughDay,
  pickPartnerMessage,
} from '../_shared/partnerDigest.ts';

const STALE_AFTER_HOURS = 20;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // The shared secret lives in the database vault (the same one the pg_cron
  // job sends), so there is nothing to keep in sync in two places.
  const { data: expected } = await supabase.rpc('get_partner_cron_secret');
  const given = req.headers.get('x-cron-secret') ?? '';
  if (!expected || typeof expected !== 'string' || !timingSafeEqual(given, expected)) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const url = new URL(req.url);
  const dryRun = url.searchParams.get('dryRun') === '1';
  const force = url.searchParams.get('force') === '1';

  const todayISO = new Date().toISOString().slice(0, 10);
  const cutoff = Date.now() - STALE_AFTER_HOURS * 3_600_000;

  const { data: links, error } = await supabase
    .from('partner_links')
    .select('id, user_id, share_phase, share_tough_day, shared_updated_at')
    .eq('status', 'active');
  if (error) return json({ error: error.message }, 500);

  const due = (links ?? []).filter(
    (l) => force || !l.shared_updated_at || new Date(l.shared_updated_at).getTime() < cutoff,
  );

  const result = { active: links?.length ?? 0, due: due.length, updated: 0, skipped: 0, failed: 0 };
  const preview: unknown[] = [];

  for (const link of due) {
    try {
      const [{ data: profile }, { data: cycles }, { data: todaysLog }] = await Promise.all([
        supabase.from('profiles').select('avg_cycle_length, avg_period_length').eq('id', link.user_id).maybeSingle(),
        supabase.from('cycle_logs').select('start_date').eq('user_id', link.user_id).order('start_date', { ascending: false }),
        supabase.from('daily_logs').select('energy, mood').eq('user_id', link.user_id).eq('date_iso', todayISO).maybeSingle(),
      ]);

      const starts = (cycles ?? []).map((c: { start_date: string }) => c.start_date);
      if (!profile || starts.length === 0) {
        result.skipped++;
        continue;
      }

      const phase = capacityPhaseForDate({
        lastPeriodStart: starts[0],
        avgCycleLength: profile.avg_cycle_length,
        avgPeriodLength: profile.avg_period_length,
        periodStarts: starts,
        todayISO,
      });
      const toughDay = isToughDay(phase, todaysLog);
      const message = pickPartnerMessage(phase, toughDay, todayISO);

      const patch = {
        shared_phase: link.share_phase ? CAPACITY_TO_PHASE_KEY[phase] : null,
        shared_tough_day: link.share_tough_day ? toughDay : null,
        shared_message: link.share_tough_day ? message : null,
        shared_updated_at: new Date().toISOString(),
      };

      if (dryRun) {
        preview.push({ link: link.id, phase, toughDay, message: patch.shared_message });
        continue;
      }

      const { error: upErr } = await supabase.from('partner_links').update(patch).eq('id', link.id);
      if (upErr) throw upErr;
      result.updated++;
    } catch (e) {
      console.error('partner-digest-refresh failed for link', link.id, e);
      result.failed++;
    }
  }

  return json(dryRun ? { ...result, dryRun: true, preview } : result);
});
