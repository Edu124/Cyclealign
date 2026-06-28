-- Community feature: topics, posts, reactions, dopamine menu
-- Run after 0001_init.sql

-- Add admin flag to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- Weekly/daily topics posted by the founder/admin
CREATE TABLE IF NOT EXISTS community_topics (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  body        text,
  is_active   boolean DEFAULT true,
  week_start  date,
  created_at  timestamptz DEFAULT now()
);

-- Free-form community posts + topic replies
CREATE TABLE IF NOT EXISTS community_posts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id     uuid REFERENCES community_topics(id) ON DELETE SET NULL,
  content      text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  is_anonymous boolean DEFAULT false,
  phase_key    text,
  cycle_day    int,
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS community_posts_created_at_idx ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS community_posts_topic_id_idx   ON community_posts(topic_id);
CREATE INDEX IF NOT EXISTS community_posts_user_id_idx    ON community_posts(user_id);

-- One reaction per user per post (can switch type, not stack)
CREATE TABLE IF NOT EXISTS post_reactions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id       uuid REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type text NOT NULL CHECK (reaction_type IN ('felt_this','sending_energy','inspiring')),
  created_at    timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Phase-aware dopamine items (admin-editable)
CREATE TABLE IF NOT EXISTS dopamine_items (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_key        text NOT NULL,    -- menstrual | follicular | ovulation | luteal | all
  label            text NOT NULL,
  emoji            text NOT NULL DEFAULT '✨',
  duration_minutes int  DEFAULT 5,
  is_active        boolean DEFAULT true,
  sort_order       int  DEFAULT 0,
  created_at       timestamptz DEFAULT now()
);

-- Track daily completions per user
CREATE TABLE IF NOT EXISTS dopamine_completions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id        uuid REFERENCES dopamine_items(id) ON DELETE CASCADE,
  completed_date date DEFAULT current_date,
  created_at     timestamptz DEFAULT now(),
  UNIQUE(user_id, item_id, completed_date)
);

-- ── Row Level Security ──────────────────────────────────────────────────────

ALTER TABLE community_topics    ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reactions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE dopamine_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE dopamine_completions ENABLE ROW LEVEL SECURITY;

-- Topics: public read, admin write
CREATE POLICY "topics_select"  ON community_topics FOR SELECT USING (true);
CREATE POLICY "topics_insert"  ON community_topics FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "topics_update"  ON community_topics FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Posts: public read, owner insert/delete
CREATE POLICY "posts_select"   ON community_posts FOR SELECT USING (true);
CREATE POLICY "posts_insert"   ON community_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "posts_delete"   ON community_posts FOR DELETE USING (auth.uid() = user_id);

-- Reactions: public read, owner insert/delete/update
CREATE POLICY "reactions_select" ON post_reactions FOR SELECT USING (true);
CREATE POLICY "reactions_insert" ON post_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reactions_delete" ON post_reactions FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "reactions_update" ON post_reactions FOR UPDATE USING (auth.uid() = user_id);

-- Dopamine items: public read, admin manage
CREATE POLICY "dopamine_items_select" ON dopamine_items FOR SELECT USING (true);
CREATE POLICY "dopamine_items_admin"  ON dopamine_items FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Completions: user-scoped
CREATE POLICY "completions_select" ON dopamine_completions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "completions_insert" ON dopamine_completions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "completions_delete" ON dopamine_completions FOR DELETE USING (auth.uid() = user_id);

-- ── Seed default dopamine items ─────────────────────────────────────────────

INSERT INTO dopamine_items (phase_key, label, emoji, duration_minutes, sort_order) VALUES
  ('menstrual',  'Take a warm bath',                  '🛁', 10, 1),
  ('menstrual',  'Light your favourite candle',        '🕯️',  1, 2),
  ('menstrual',  'Read 5 pages of a comfort book',     '📖', 10, 3),
  ('menstrual',  'Legs up the wall pose',              '🧘',  5, 4),
  ('menstrual',  'Make a warm drink mindfully',        '☕',  5, 5),
  ('menstrual',  'Play a comfort playlist',            '🎵',  5, 6),
  ('follicular', 'Walk somewhere new',                 '🚶', 15, 1),
  ('follicular', 'Brain-dump a creative idea',         '📓',  5, 2),
  ('follicular', 'Dance to one song',                  '💃',  3, 3),
  ('follicular', 'Text a friend to plan something',    '📞',  2, 4),
  ('follicular', 'Water your plants',                  '🌱',  2, 5),
  ('follicular', 'Doodle or colour freely',            '🎨', 10, 6),
  ('ovulation',  'Call someone you love',              '📞',  5, 1),
  ('ovulation',  'Step outside and feel the sun',      '🌿',  5, 2),
  ('ovulation',  'Leave a kind note for someone',      '💌',  2, 3),
  ('ovulation',  'Tackle one thing you have been avoiding', '🎯', 10, 4),
  ('ovulation',  'Take a photo of something beautiful','📸',  1, 5),
  ('ovulation',  'Learn one interesting fact',         '🧠',  3, 6),
  ('luteal',     'Write 3 things that went well today','📝',  3, 1),
  ('luteal',     'Wear your cosiest clothes',          '🧸',  0, 2),
  ('luteal',     'Watch something comforting',         '🌙', 15, 3),
  ('luteal',     'Enjoy a small treat intentionally',  '🍫',  5, 4),
  ('luteal',     'Tidy one small area',                '🧹',  5, 5),
  ('luteal',     'Give yourself a 1-min shoulder massage', '🤗', 1, 6)
ON CONFLICT DO NOTHING;
