-- Add parent_id to comments for nested/threaded replies
ALTER TABLE comments ADD COLUMN parentId INTEGER;
CREATE INDEX IF NOT EXISTS comments_parent_idx ON comments (parentId);
