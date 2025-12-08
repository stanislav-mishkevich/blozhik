-- Migration: create post_reactions table for emoji reactions on posts

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS `post_reactions` (
  `id` INTEGER PRIMARY KEY,
  `postId` INTEGER NOT NULL,
  `userId` INTEGER NOT NULL,
  `reactionType` TEXT NOT NULL, -- 'heart' | 'laugh' | 'ok' | 'thumbs_down'
  `createdAt` TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Unique per (postId, userId)
CREATE UNIQUE INDEX IF NOT EXISTS `post_user_unique` ON `post_reactions` (`postId`, `userId`);
CREATE INDEX IF NOT EXISTS `post_reactions_post_idx` ON `post_reactions` (`postId`);
CREATE INDEX IF NOT EXISTS `post_reactions_user_idx` ON `post_reactions` (`userId`);

COMMIT;

-- Apply with:
-- sqlite3 blozhik.db < drizzle/0013_add_post_reactions.sql
