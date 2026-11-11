-- Cycle-Aware Productivity onboarding ("Let's understand your rhythm").
--
-- ADDITIVE ONLY. Two optional columns on profiles record HOW she answered the
-- cycle-length and period-duration questions: 'known', 'varies' or 'unsure'.
--
--   * Only 'known' means avg_cycle_length / avg_period_length is her number.
--   * For 'varies' / 'unsure' those existing columns keep the engine's working
--     default (28 / 5, the columns' own defaults). The app never shows or uses
--     that as her answer and lowers its confidence instead.
--   * avg_cycle_length / avg_period_length stay NOT NULL on purpose: older app
--     versions treat a profile without a cycle length as "onboarding not
--     finished" and would send the person through onboarding again.
--   * NULL in the new columns = an existing user who answered with a number
--     before this question existed (treated as 'known'). Nothing is rewritten.
--
-- Run order: after 0015 (app_content). Safe to run more than once.
-- Old app versions ignore the new columns; the new app works before this
-- migration too (it retries the profile save without these columns).
--
-- ROLLBACK (only if needed; the app keeps working without the columns):
--   ALTER TABLE public.profiles DROP COLUMN IF EXISTS cycle_length_preference;
--   ALTER TABLE public.profiles DROP COLUMN IF EXISTS period_duration_preference;
--   DELETE FROM public.app_content WHERE key = 'feature_flags';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cycle_length_preference text
    CHECK (cycle_length_preference IN ('known', 'varies', 'unsure')),
  ADD COLUMN IF NOT EXISTS period_duration_preference text
    CHECK (period_duration_preference IN ('known', 'varies', 'unsure'));

-- Remote on/off switches (read by the app at start, also before sign-in).
-- Set "rhythmOnboarding": false to bring back the previous onboarding step,
-- or "ratingPrompt": false to stop the in-app rating prompt — no release needed.
INSERT INTO public.app_content (key, data)
VALUES ('feature_flags', '{"rhythmOnboarding": true, "ratingPrompt": true}'::jsonb)
ON CONFLICT (key) DO NOTHING;
