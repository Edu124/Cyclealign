-- Adaptive Leadership OS: the optional profile answers and the richer daily check-in.
-- Run after 0011_partner_digest_cron.sql.
--
-- DO NOT apply until the matching app release is ready: the app only starts writing
-- these columns once SYNC_ADAPTIVE_COLUMNS is switched on in src/lib/sync.ts.
-- Everything here is additive and nullable, so existing rows and existing app
-- versions keep working untouched.

-- User-provided context (NOT a diagnosis). Null = existing user, regular experience.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS cycle_regularity  text
    CHECK (cycle_regularity IN ('REGULAR', 'VARIABLE', 'IRREGULAR', 'CHANGING', 'UNKNOWN')),
  ADD COLUMN IF NOT EXISTS health_context    text
    CHECK (health_context IN ('REGULAR', 'PCOS', 'IRREGULAR', 'PERIMENOPAUSE', 'POSTPARTUM', 'OTHER', 'UNKNOWN')),
  ADD COLUMN IF NOT EXISTS cycle_length_range text;

-- Optional "more detail" check-in fields. All 1..5 unless noted.
ALTER TABLE daily_logs
  ADD COLUMN IF NOT EXISTS focus               smallint CHECK (focus BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS decision_confidence smallint CHECK (decision_confidence BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS sleep_quality       smallint CHECK (sleep_quality BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS sleep_hours         smallint CHECK (sleep_hours BETWEEN 0 AND 24),
  ADD COLUMN IF NOT EXISTS stress              smallint CHECK (stress BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS symptoms_json       jsonb,
  ADD COLUMN IF NOT EXISTS bleeding            text
    CHECK (bleeding IN ('none', 'spotting', 'light', 'medium', 'heavy'));

-- Existing RLS on profiles and daily_logs (owner-only) already covers the new columns.
-- Pattern insights are computed on the device from these logs and are not stored.
