-- Add free-text details to habits (name stays immutable; details editable).
ALTER TABLE habits
  ADD COLUMN details TEXT NOT NULL DEFAULT '';
