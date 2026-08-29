-- Partner Sync: invite a partner to see a digested, opt-in view of your
-- cycle state ("today might be tougher" etc.) so support doesn't require
-- explaining yourself. The partner NEVER reads raw health data directly —
-- the sharer's own device computes a digested summary locally and writes
-- only that onto its own row, which the partner then reads. Whatever the
-- sharer hasn't toggled on is simply never written, so there's no separate
-- access-control surface to get wrong.
-- Run after 0009_expert_requests.sql

CREATE TABLE IF NOT EXISTS partner_links (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code     text NOT NULL UNIQUE,
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'revoked')),

  -- What the user has chosen to share. Raw energy/mood is off by default on
  -- purpose -- the feature is a digested "she could use support today"
  -- signal, not a mood diary handed to someone else.
  share_phase        boolean NOT NULL DEFAULT true,
  share_tough_day     boolean NOT NULL DEFAULT true,
  share_energy_mood  boolean NOT NULL DEFAULT false,

  -- The digested summary itself, recomputed and rewritten by the sharer's
  -- own device whenever their prediction/log changes.
  shared_phase       text,
  shared_tough_day   boolean,
  shared_message     text,
  shared_updated_at  timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS partner_links_user_idx ON partner_links(user_id);
CREATE INDEX IF NOT EXISTS partner_links_partner_idx ON partner_links(partner_user_id);

ALTER TABLE partner_links ENABLE ROW LEVEL SECURITY;

-- The sharer fully owns and manages their own link (create, toggle sharing,
-- publish the digested summary, revoke).
CREATE POLICY "partner_links_owner_all" ON partner_links FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Anyone signed in can look up an unclaimed invite by its code, to accept it.
CREATE POLICY "partner_links_lookup_pending" ON partner_links FOR SELECT
  USING (status = 'pending');

-- Claiming an invite: only allowed on a still-unclaimed pending row, and the
-- result must leave the row pointing at the claimer as active -- nothing else
-- about the row (sharing toggles, user_id) can be touched this way.
CREATE POLICY "partner_links_claim" ON partner_links FOR UPDATE
  USING (status = 'pending' AND partner_user_id IS NULL)
  WITH CHECK (auth.uid() = partner_user_id AND status = 'active');

-- Once active, the connected partner can read the digested summary (and
-- only that -- profiles/cycle_logs/daily_logs RLS still blocks them from
-- everything else).
CREATE POLICY "partner_links_partner_select" ON partner_links FOR SELECT
  USING (auth.uid() = partner_user_id);

-- Support pings: the partner's "Send support" action.
CREATE TABLE IF NOT EXISTS partner_support_pings (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id      uuid NOT NULL REFERENCES partner_links(id) ON DELETE CASCADE,
  from_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message      text NOT NULL CHECK (char_length(message) BETWEEN 1 AND 200),
  seen         boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS partner_pings_recipient_idx ON partner_support_pings(to_user_id, seen);

ALTER TABLE partner_support_pings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pings_insert" ON partner_support_pings FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);
CREATE POLICY "pings_recipient_select" ON partner_support_pings FOR SELECT
  USING (auth.uid() = to_user_id);
CREATE POLICY "pings_recipient_update" ON partner_support_pings FOR UPDATE
  USING (auth.uid() = to_user_id);
CREATE POLICY "pings_sender_select" ON partner_support_pings FOR SELECT
  USING (auth.uid() = from_user_id);
