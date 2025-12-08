-- Add post_versions table for edit history
CREATE TABLE IF NOT EXISTS post_versions (
  id INTEGER PRIMARY KEY,
  postId INTEGER NOT NULL,
  userId INTEGER,
  title TEXT,
  content TEXT,
  contentType TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS post_versions_post_idx ON post_versions (postId);
