-- Migration: Convert existing upvote/downvote reactions to emoji types
-- Mapping:
--   upvote    -> heart
--   downvote  -> thumbs_down

BEGIN TRANSACTION;

-- Safety: only update rows that have legacy values
UPDATE comment_reactions
SET reactionType = 'heart'
WHERE reactionType = 'upvote';

UPDATE comment_reactions
SET reactionType = 'thumbs_down'
WHERE reactionType = 'downvote';

COMMIT;

-- To apply:
-- sqlite3 blozhik.db < drizzle/0012_migrate_reactions_to_emojis.sql
