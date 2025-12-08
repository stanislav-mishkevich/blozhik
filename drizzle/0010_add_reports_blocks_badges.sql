-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY,
  userId INTEGER NOT NULL,
  targetType TEXT NOT NULL, -- 'post' or 'comment'
  targetId INTEGER NOT NULL,
  reason TEXT NOT NULL, -- 'spam', 'offensive', 'adult_content', 'other'
  description TEXT,
  status TEXT DEFAULT 'open' NOT NULL, -- 'open', 'resolved', 'dismissed'
  resolvedBy INTEGER,
  resolvedAt TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS reports_status_idx ON reports (status);
CREATE INDEX IF NOT EXISTS reports_target_idx ON reports (targetType, targetId);

-- Create blocks table
CREATE TABLE IF NOT EXISTS blocks (
  id INTEGER PRIMARY KEY,
  userId INTEGER NOT NULL,
  blockedUserId INTEGER NOT NULL,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  UNIQUE(userId, blockedUserId)
);

CREATE INDEX IF NOT EXISTS blocks_user_idx ON blocks (userId);
CREATE INDEX IF NOT EXISTS blocks_blocked_user_idx ON blocks (blockedUserId);

-- Create badges table
CREATE TABLE IF NOT EXISTS badges (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  requirement TEXT NOT NULL, -- JSON with badge requirements
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create user_badges table
CREATE TABLE IF NOT EXISTS user_badges (
  id INTEGER PRIMARY KEY,
  userId INTEGER NOT NULL,
  badgeId INTEGER NOT NULL,
  earnedAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  UNIQUE(userId, badgeId)
);

CREATE INDEX IF NOT EXISTS user_badges_user_idx ON user_badges (userId);

-- Insert default badges
INSERT INTO badges (name, description, icon, requirement) VALUES
('first_post', 'Created your first post', '✍️', '{"type":"posts","count":1}'),
('popular_author', 'Received 200+ likes across all posts', '⭐', '{"type":"total_likes","count":200}'),
('commentator', 'Made 10+ comments', '💬', '{"type":"comments","count":10}'),
('hundred_likes', 'Received 100 likes on posts', '❤️', '{"type":"total_likes","count":100}'),
('week_streak', 'Posted for 7 days in a row', '🔥', '{"type":"streak","days":7}');
