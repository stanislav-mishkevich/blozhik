-- Remove adminId column and make userId NOT NULL in audit_logs table
-- SQLite doesn't support DROP COLUMN, so we need to recreate the table

-- 1. Create new table with correct structure
CREATE TABLE audit_logs_new (
  id INTEGER PRIMARY KEY,
  userId INTEGER,
  action TEXT NOT NULL,
  targetType TEXT,
  targetId INTEGER,
  details TEXT,
  ipAddress TEXT,
  userAgent TEXT,
  createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Copy data from old table (map adminId to userId)
INSERT INTO audit_logs_new (id, userId, action, targetType, targetId, details, ipAddress, userAgent, createdAt)
SELECT 
  id, 
  COALESCE(userId, adminId) as userId,
  action, 
  targetType, 
  targetId, 
  COALESCE(details, changes) as details,
  ipAddress,
  userAgent,
  createdAt
FROM audit_logs;

-- 3. Drop old table
DROP TABLE audit_logs;

-- 4. Rename new table
ALTER TABLE audit_logs_new RENAME TO audit_logs;

-- 5. Create indexes
CREATE INDEX audit_user_idx ON audit_logs(userId);
CREATE INDEX audit_action_idx ON audit_logs(action);
CREATE INDEX audit_target_idx ON audit_logs(targetType, targetId);
CREATE INDEX audit_created_at_idx ON audit_logs(createdAt);
