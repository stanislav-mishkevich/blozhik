-- Add bannedUntil column for temporary bans
ALTER TABLE users ADD COLUMN bannedUntil TEXT;

-- Add index for quick ban status checks
CREATE INDEX users_banned_until_idx ON users(bannedUntil);
