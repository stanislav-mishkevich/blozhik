-- Add comment reactions table (Reddit-style upvote/downvote)
CREATE TABLE `comment_reactions` (
	`id` integer PRIMARY KEY NOT NULL,
	`commentId` integer NOT NULL,
	`userId` integer NOT NULL,
	`reactionType` text NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `comment_user_unique` ON `comment_reactions` (`commentId`,`userId`);--> statement-breakpoint
CREATE INDEX `comment_reactions_comment_idx` ON `comment_reactions` (`commentId`);--> statement-breakpoint
CREATE INDEX `comment_reactions_user_idx` ON `comment_reactions` (`userId`);
