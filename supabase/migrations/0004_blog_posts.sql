-- Founder blog: short posts surfaced inside the Circle tab (not a separate app tab).
-- Run after 0003_founder_letters.sql

CREATE TABLE IF NOT EXISTS blog_posts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text NOT NULL,
  excerpt      text NOT NULL,
  body         text NOT NULL,
  emoji        text NOT NULL DEFAULT '📝',
  accent_color text NOT NULL DEFAULT '#A8C293',
  author       text NOT NULL DEFAULT 'Vinita',
  is_published boolean DEFAULT true,
  published_at timestamptz DEFAULT now(),
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS blog_posts_published_at_idx ON blog_posts(published_at DESC);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blog_posts_select" ON blog_posts FOR SELECT USING (is_published = true);
CREATE POLICY "blog_posts_admin"  ON blog_posts FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Seed one welcome post so the section isn't empty on first launch.
INSERT INTO blog_posts (title, excerpt, body, emoji, accent_color, author) VALUES
  ('Welcome to the CycleAlign blog',
   'A place for real conversations about working with your body, not against it.',
   'We started CycleAlign because most productivity advice ignores half the population''s biology.

This is where we''ll share research, founder notes, and community stories on cycle-aware living — new posts every couple of weeks.',
   '👋', '#A8C293', 'Vinita')
ON CONFLICT DO NOTHING;
