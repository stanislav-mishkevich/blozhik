-- Add scheduled_at column to posts for scheduled publishing
ALTER TABLE posts ADD COLUMN scheduledAt TEXT;
CREATE INDEX IF NOT EXISTS posts_scheduled_at_idx ON posts (scheduledAt);
