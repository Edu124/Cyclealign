-- Keeps partner "Support someone" messages fresh when the sharer hasn't opened
-- the app. The app only republishes its digest while it's running; this runs the
-- `partner-digest-refresh` edge function every 6 hours, and the function itself
-- skips any link updated in the last 20h, so each pair is refreshed about daily.
-- Run after 0010_partner_sync.sql
--
-- One-off, NOT in this file (it's a secret): create the shared secret once with
--   select vault.create_secret('<random 64-hex string>', 'partner_digest_cron_secret');

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- The edge function reads the secret through this so the check stays server-side.
CREATE OR REPLACE FUNCTION public.get_partner_cron_secret()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT decrypted_secret FROM vault.decrypted_secrets
  WHERE name = 'partner_digest_cron_secret' LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_partner_cron_secret() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_partner_cron_secret() TO service_role;

SELECT cron.schedule(
  'partner-digest-refresh',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://kzfltfrbqqtcdcefpwpk.supabase.co/functions/v1/partner-digest-refresh',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'partner_digest_cron_secret' LIMIT 1)
    ),
    body := '{}'::jsonb
  );
  $$
);
