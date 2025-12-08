-- Add post views analytics table
CREATE TABLE IF NOT EXISTS post_views (
  id INTEGER PRIMARY KEY,
  postId INTEGER NOT NULL,
  day TEXT NOT NULL,
  views INTEGER DEFAULT 0 NOT NULL,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS post_views_post_day_idx ON post_views (postId, day);
