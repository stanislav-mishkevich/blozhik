-- Add follows table
CREATE TABLE IF NOT EXISTS follows (
  followerId INTEGER NOT NULL,
  followingId INTEGER NOT NULL,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (followerId, followingId)
);
CREATE INDEX IF NOT EXISTS follower_idx ON follows (followerId);
CREATE INDEX IF NOT EXISTS following_idx ON follows (followingId);

-- Add bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
  id INTEGER PRIMARY KEY,
  userId INTEGER NOT NULL,
  postId INTEGER NOT NULL,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS user_post_unique ON bookmarks (userId, postId);
CREATE INDEX IF NOT EXISTS bookmark_user_idx ON bookmarks (userId);
CREATE INDEX IF NOT EXISTS bookmark_post_idx ON bookmarks (postId);

-- Add categories table
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS category_name_idx ON categories (name);
CREATE INDEX IF NOT EXISTS category_slug_idx ON categories (slug);

-- Add categoryId to posts if it does not exist
PRAGMA foreign_keys = OFF;
BEGIN TRANSACTION;
-- SQLite lacks direct IF NOT EXISTS for ALTER TABLE ADD COLUMN. We will attempt to add column; if exists, this will fail silently on some SQLite versions, but for migration we run once.
ALTER TABLE posts ADD COLUMN categoryId INTEGER;
CREATE INDEX IF NOT EXISTS category_idx ON posts (categoryId);
COMMIT;
PRAGMA foreign_keys = ON;
