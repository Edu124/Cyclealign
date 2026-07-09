-- Community moderation: user reports on posts (App Store guideline 1.2).
-- Run after 0005_ai_coach.sql

CREATE TABLE IF NOT EXISTS post_reports (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     uuid REFERENCES community_posts(id) ON DELETE CASCADE,
  reporter_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reason      text NOT NULL DEFAULT 'inappropriate',
  created_at  timestamptz DEFAULT now(),
  UNIQUE(post_id, reporter_id)
);

ALTER TABLE post_reports ENABLE ROW LEVEL SECURITY;

-- Anyone signed-in can file a report; only admins read them.
CREATE POLICY "reports_insert" ON post_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "reports_admin_select" ON post_reports FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
