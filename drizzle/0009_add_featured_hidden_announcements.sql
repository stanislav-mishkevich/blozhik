-- Add featured column to posts
PRAGMA foreign_keys = OFF;
BEGIN TRANSACTION;
ALTER TABLE posts ADD COLUMN featured INTEGER DEFAULT 0 NOT NULL;
-- create index for featured
CREATE INDEX IF NOT EXISTS posts_featured_idx ON posts (featured);
COMMIT;
PRAGMA foreign_keys = ON;

-- Add hidden column to comments
PRAGMA foreign_keys = OFF;
BEGIN TRANSACTION;
ALTER TABLE comments ADD COLUMN hidden INTEGER DEFAULT 0 NOT NULL;
CREATE INDEX IF NOT EXISTS comments_hidden_idx ON comments (hidden);
COMMIT;
PRAGMA foreign_keys = ON;

-- Add announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'info' NOT NULL,
  startDate TEXT,
  endDate TEXT,
  targetAudience TEXT DEFAULT 'all',
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS announcements_type_idx ON announcements (type);
CREATE INDEX IF NOT EXISTS announcements_start_date_idx ON announcements (startDate);
