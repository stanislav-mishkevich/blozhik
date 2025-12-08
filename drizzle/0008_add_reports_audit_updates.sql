-- Add reports table for content moderation
CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY,
  userId INTEGER NOT NULL,
  targetType TEXT NOT NULL,
  targetId INTEGER NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'open' NOT NULL,
  resolvedBy INTEGER,
  resolvedAt TEXT,
  action TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS report_user_idx ON reports (userId);
CREATE INDEX IF NOT EXISTS report_target_idx ON reports (targetType, targetId);
CREATE INDEX IF NOT EXISTS report_status_idx ON reports (status);
CREATE INDEX IF NOT EXISTS report_created_at_idx ON reports (createdAt);

-- Update audit_logs table structure
ALTER TABLE audit_logs ADD COLUMN userId INTEGER;
ALTER TABLE audit_logs ADD COLUMN details TEXT;
ALTER TABLE audit_logs ADD COLUMN ipAddress TEXT;
ALTER TABLE audit_logs ADD COLUMN userAgent TEXT;

-- Update indexes for audit_logs
DROP INDEX IF EXISTS audit_admin_idx;
CREATE INDEX IF NOT EXISTS audit_user_idx ON audit_logs (userId);
CREATE INDEX IF NOT EXISTS audit_action_idx ON audit_logs (action);
CREATE INDEX IF NOT EXISTS audit_target_idx ON audit_logs (targetType, targetId);
CREATE INDEX IF NOT EXISTS audit_created_at_idx ON audit_logs (createdAt);