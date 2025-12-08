-- Fix audit_logs table: add userId, details, ipAddress, userAgent if they don't exist
ALTER TABLE audit_logs ADD COLUMN userId INTEGER;
ALTER TABLE audit_logs ADD COLUMN details TEXT;
ALTER TABLE audit_logs ADD COLUMN ipAddress TEXT;
ALTER TABLE audit_logs ADD COLUMN userAgent TEXT;

-- Create new indexes
CREATE INDEX IF NOT EXISTS audit_user_idx ON audit_logs (userId);
CREATE INDEX IF NOT EXISTS audit_target_idx ON audit_logs (targetType, targetId);
