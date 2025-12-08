-- Add notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY,
  userId INTEGER NOT NULL,
  type TEXT NOT NULL,
  postId INTEGER,
  actorId INTEGER,
  read INTEGER DEFAULT 0 NOT NULL,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS notification_user_idx ON notifications (userId);
CREATE INDEX IF NOT EXISTS notification_read_idx ON notifications (read);
