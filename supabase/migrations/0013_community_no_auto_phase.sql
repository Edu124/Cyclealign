-- Community must never disclose health state on its own.
-- Run after 0012_adaptive_profile_and_checkins.sql.
--
-- Until now every post stored the author's cycle phase AND day of cycle,
-- readable by any signed-in user. From now on a post carries a phase only when
-- its author switched that on for that post, and the day of cycle is never kept.
--
-- ORDER MATTERS: apply this BEFORE the app release that sends `share_phase`
-- (and before COMMUNITY_SHARE_PHASE_COLUMN is switched on in the app). Older app
-- versions that still send phase_key / cycle_day with every post are handled by
-- the trigger below: their phase data is simply discarded.

ALTER TABLE community_posts
  ADD COLUMN IF NOT EXISTS share_phase boolean NOT NULL DEFAULT false;

-- 1. Scrub what was attached without anyone choosing to share it.
UPDATE community_posts SET phase_key = NULL, cycle_day = NULL;

-- 2. Server-side guarantee, whatever the app version: no opt-in = no phase; never a cycle day.
CREATE OR REPLACE FUNCTION public.community_posts_strip_health_state()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.cycle_day := NULL;
  IF NOT NEW.share_phase THEN
    NEW.phase_key := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS community_posts_strip_health_state ON community_posts;
CREATE TRIGGER community_posts_strip_health_state
  BEFORE INSERT OR UPDATE ON community_posts
  FOR EACH ROW EXECUTE FUNCTION public.community_posts_strip_health_state();
