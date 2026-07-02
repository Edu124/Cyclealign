-- AI Coach: chat messages + server-enforced daily question limit.
-- Run after 0004_blog_posts.sql

CREATE TABLE IF NOT EXISTS ai_messages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       text NOT NULL CHECK (role IN ('user', 'assistant')),
  content    text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 4000),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_messages_user_created_idx ON ai_messages(user_id, created_at DESC);

ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

-- Users can read their own chat history. Writes happen ONLY through the
-- ai-coach edge function (service role), so the daily limit cannot be
-- bypassed by inserting rows directly from the client.
CREATE POLICY "ai_messages_select" ON ai_messages FOR SELECT USING (auth.uid() = user_id);
