-- Add sent-to-PH tracking fields to rapid_logs.
-- Allows the UI to show a sent indicator without re-querying PH's database.
ALTER TABLE rapid_logs
  ADD COLUMN sent_to_ph     SMALLINT DEFAULT 0    CHECK (sent_to_ph IN (0, 1)),
  ADD COLUMN sent_to_ph_at  BIGINT   DEFAULT NULL;
