-- Founder letters: warm async inbox where users write to the founder.
-- Run after 0002_community.sql

CREATE TABLE IF NOT EXISTS founder_letters (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  message    text NOT NULL CHECK (char_length(message) BETWEEN 1 AND 2000),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS founder_letters_user_id_idx ON founder_letters(user_id);

ALTER TABLE founder_letters ENABLE ROW LEVEL SECURITY;

-- Owner can write and read their own letters; founder reads via service role.
CREATE POLICY "founder_letters_select" ON founder_letters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "founder_letters_insert" ON founder_letters FOR INSERT WITH CHECK (auth.uid() = user_id);
