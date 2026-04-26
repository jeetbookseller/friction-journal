-- =============================================================================
-- Migration 002: Add user_id to all tables, update RLS to per-user policies,
-- update pull_changes RPC to filter by auth.uid().
-- Safe to run on empty tables (no backfill needed).
-- =============================================================================

-- Add user_id column to all 5 tables
ALTER TABLE actions         ADD COLUMN user_id UUID REFERENCES auth.users NOT NULL;
ALTER TABLE timeline_events ADD COLUMN user_id UUID REFERENCES auth.users NOT NULL;
ALTER TABLE habits          ADD COLUMN user_id UUID REFERENCES auth.users NOT NULL;
ALTER TABLE habit_logs      ADD COLUMN user_id UUID REFERENCES auth.users NOT NULL;
ALTER TABLE rapid_logs      ADD COLUMN user_id UUID REFERENCES auth.users NOT NULL;

-- Drop old lax RLS policies (checked auth.uid() IS NOT NULL only)
DROP POLICY IF EXISTS "actions: authenticated users own their rows"         ON actions;
DROP POLICY IF EXISTS "timeline_events: authenticated users own their rows" ON timeline_events;
DROP POLICY IF EXISTS "habits: authenticated users own their rows"          ON habits;
DROP POLICY IF EXISTS "habit_logs: authenticated users own their rows"      ON habit_logs;
DROP POLICY IF EXISTS "rapid_logs: authenticated users own their rows"      ON rapid_logs;

-- Create per-user RLS policies
CREATE POLICY "actions: users own their rows"
  ON actions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "timeline_events: users own their rows"
  ON timeline_events FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "habits: users own their rows"
  ON habits FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "habit_logs: users own their rows"
  ON habit_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "rapid_logs: users own their rows"
  ON rapid_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Update pull_changes RPC to filter by the calling user's id
CREATE OR REPLACE FUNCTION pull_changes(since BIGINT)
  RETURNS JSON
  LANGUAGE sql
  SECURITY DEFINER
AS $$
  SELECT json_build_object(
    'actions', (
      SELECT json_agg(a ORDER BY a.updated_at)
      FROM actions a
      WHERE a.updated_at > since AND a.user_id = auth.uid()
    ),
    'timeline_events', (
      SELECT json_agg(te ORDER BY te.updated_at)
      FROM timeline_events te
      WHERE te.updated_at > since AND te.user_id = auth.uid()
    ),
    'habits', (
      SELECT json_agg(h ORDER BY h.updated_at)
      FROM habits h
      WHERE h.updated_at > since AND h.user_id = auth.uid()
    ),
    'habit_logs', (
      SELECT json_agg(hl ORDER BY hl.updated_at)
      FROM habit_logs hl
      WHERE hl.updated_at > since AND hl.user_id = auth.uid()
    ),
    'rapid_logs', (
      SELECT json_agg(rl ORDER BY rl.updated_at)
      FROM rapid_logs rl
      WHERE rl.updated_at > since AND rl.user_id = auth.uid()
    )
  );
$$;
