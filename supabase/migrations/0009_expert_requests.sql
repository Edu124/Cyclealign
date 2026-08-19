-- "Talk with an Expert" concern form (Discover tab). No email/Slack
-- notification by design — admins check the in-app admin screen.
-- Run after 0008_profiles_delete_policy.sql

CREATE TABLE IF NOT EXISTS expert_requests (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name       text,
  email      text,
  concern    text NOT NULL CHECK (char_length(concern) BETWEEN 1 AND 2000),
  status     text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'resolved')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS expert_requests_created_idx ON expert_requests(created_at DESC);

ALTER TABLE expert_requests ENABLE ROW LEVEL SECURITY;

-- Any signed-in user can submit and read back their own submissions.
CREATE POLICY "expert_requests_insert" ON expert_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "expert_requests_own_select" ON expert_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Admins read and update (mark read/resolved) every submission.
CREATE POLICY "expert_requests_admin_select" ON expert_requests FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "expert_requests_admin_update" ON expert_requests FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
