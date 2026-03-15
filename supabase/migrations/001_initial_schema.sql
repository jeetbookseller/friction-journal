-- =============================================================================
-- Friction Journal — Initial Schema Migration
-- =============================================================================
-- Mirrors the TypeScript interfaces in src/db/models.ts exactly.
--
-- Timestamp convention: BIGINT epoch milliseconds (not TIMESTAMPTZ).
-- This matches JavaScript's Date.now() and avoids timezone conversion issues
-- when syncing between the browser IndexedDB and Supabase.
--
-- Boolean-like columns (is_completed, is_top_priority, is_active, completed)
-- use SMALLINT with CHECK (col IN (0, 1)) to mirror TypeScript's 0 | 1 type.
-- =============================================================================

-- Enable UUID generation extension (used by Supabase auth and potential UUIDs)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- =============================================================================
-- Shared trigger: auto-update updated_at on every row mutation
-- =============================================================================
CREATE OR REPLACE FUNCTION set_updated_at()
  RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- =============================================================================
-- Table: actions
-- One action item per entry, scoped to a specific date string ('YYYY-MM-DD').
-- =============================================================================
CREATE TABLE IF NOT EXISTS actions (
  id               SERIAL PRIMARY KEY,
  uuid             TEXT        NOT NULL UNIQUE,
  date             TEXT        NOT NULL,           -- 'YYYY-MM-DD'
  title            TEXT        NOT NULL,
  is_completed     SMALLINT    NOT NULL DEFAULT 0 CHECK (is_completed IN (0, 1)),
  is_top_priority  SMALLINT    NOT NULL DEFAULT 0 CHECK (is_top_priority IN (0, 1)),
  sort_order       INTEGER     NOT NULL DEFAULT 0,
  created_at       BIGINT      NOT NULL,
  updated_at       BIGINT      NOT NULL,
  deleted_at       BIGINT      DEFAULT NULL
);

ALTER TABLE actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "actions: authenticated users own their rows"
  ON actions
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE TRIGGER trg_actions_updated_at
  BEFORE UPDATE ON actions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_actions_updated_at   ON actions (updated_at);
CREATE INDEX idx_actions_date         ON actions (date);
CREATE INDEX idx_actions_deleted_at   ON actions (deleted_at);


-- =============================================================================
-- Table: timeline_events
-- One event per calendar day — UNIQUE constraint on date enforces this.
-- =============================================================================
CREATE TABLE IF NOT EXISTS timeline_events (
  id          SERIAL PRIMARY KEY,
  uuid        TEXT    NOT NULL UNIQUE,
  date        TEXT    NOT NULL UNIQUE,             -- 'YYYY-MM-DD', one per day
  note        TEXT    NOT NULL DEFAULT '',
  created_at  BIGINT  NOT NULL,
  updated_at  BIGINT  NOT NULL,
  deleted_at  BIGINT  DEFAULT NULL
);

ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "timeline_events: authenticated users own their rows"
  ON timeline_events
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE TRIGGER trg_timeline_events_updated_at
  BEFORE UPDATE ON timeline_events
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_timeline_events_updated_at  ON timeline_events (updated_at);
CREATE INDEX idx_timeline_events_deleted_at  ON timeline_events (deleted_at);


-- =============================================================================
-- Table: habits
-- Habit definitions. Max 3 active enforced at application level.
-- =============================================================================
CREATE TABLE IF NOT EXISTS habits (
  id          SERIAL PRIMARY KEY,
  uuid        TEXT      NOT NULL UNIQUE,
  name        TEXT      NOT NULL,
  is_active   SMALLINT  NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at  BIGINT    NOT NULL,
  updated_at  BIGINT    NOT NULL,
  deleted_at  BIGINT    DEFAULT NULL
);

ALTER TABLE habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "habits: authenticated users own their rows"
  ON habits
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE TRIGGER trg_habits_updated_at
  BEFORE UPDATE ON habits
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_habits_updated_at   ON habits (updated_at);
CREATE INDEX idx_habits_is_active    ON habits (is_active);
CREATE INDEX idx_habits_deleted_at   ON habits (deleted_at);


-- =============================================================================
-- Table: habit_logs
-- Daily completion records. One log per (habit_uuid, date) pair.
-- =============================================================================
CREATE TABLE IF NOT EXISTS habit_logs (
  id          SERIAL PRIMARY KEY,
  uuid        TEXT      NOT NULL UNIQUE,
  habit_uuid  TEXT      NOT NULL REFERENCES habits(uuid) ON DELETE CASCADE,
  date        TEXT      NOT NULL,                  -- 'YYYY-MM-DD'
  completed   SMALLINT  NOT NULL DEFAULT 0 CHECK (completed IN (0, 1)),
  created_at  BIGINT    NOT NULL,
  updated_at  BIGINT    NOT NULL,
  deleted_at  BIGINT    DEFAULT NULL,
  UNIQUE (habit_uuid, date)
);

ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "habit_logs: authenticated users own their rows"
  ON habit_logs
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE TRIGGER trg_habit_logs_updated_at
  BEFORE UPDATE ON habit_logs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_habit_logs_updated_at   ON habit_logs (updated_at);
CREATE INDEX idx_habit_logs_habit_uuid   ON habit_logs (habit_uuid);
CREATE INDEX idx_habit_logs_deleted_at   ON habit_logs (deleted_at);


-- =============================================================================
-- Table: rapid_logs
-- Quick capture entries. Tag restricted to: note | event | mood.
-- =============================================================================
CREATE TABLE IF NOT EXISTS rapid_logs (
  id          SERIAL PRIMARY KEY,
  uuid        TEXT    NOT NULL UNIQUE,
  tag         TEXT    NOT NULL CHECK (tag IN ('note', 'event', 'mood')),
  body        TEXT    NOT NULL DEFAULT '',
  created_at  BIGINT  NOT NULL,
  updated_at  BIGINT  NOT NULL,
  deleted_at  BIGINT  DEFAULT NULL
);

ALTER TABLE rapid_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rapid_logs: authenticated users own their rows"
  ON rapid_logs
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE TRIGGER trg_rapid_logs_updated_at
  BEFORE UPDATE ON rapid_logs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_rapid_logs_updated_at   ON rapid_logs (updated_at);
CREATE INDEX idx_rapid_logs_tag          ON rapid_logs (tag);
CREATE INDEX idx_rapid_logs_deleted_at   ON rapid_logs (deleted_at);


-- =============================================================================
-- RPC: pull_changes(since BIGINT)
-- Returns all rows from all 5 tables modified after the given timestamp.
-- Used by the LWW sync engine in src/db/sync.ts.
--
-- The client stores its last successful sync timestamp and passes it here
-- to fetch only the delta — not the full dataset.
-- =============================================================================
CREATE OR REPLACE FUNCTION pull_changes(since BIGINT)
  RETURNS JSON
  LANGUAGE sql
  SECURITY DEFINER
AS $$
  SELECT json_build_object(
    'actions', (
      SELECT json_agg(a ORDER BY a.updated_at)
      FROM actions a
      WHERE a.updated_at > since
    ),
    'timeline_events', (
      SELECT json_agg(te ORDER BY te.updated_at)
      FROM timeline_events te
      WHERE te.updated_at > since
    ),
    'habits', (
      SELECT json_agg(h ORDER BY h.updated_at)
      FROM habits h
      WHERE h.updated_at > since
    ),
    'habit_logs', (
      SELECT json_agg(hl ORDER BY hl.updated_at)
      FROM habit_logs hl
      WHERE hl.updated_at > since
    ),
    'rapid_logs', (
      SELECT json_agg(rl ORDER BY rl.updated_at)
      FROM rapid_logs rl
      WHERE rl.updated_at > since
    )
  );
$$;
