CREATE TABLE `audit_logs` (
	`id` integer PRIMARY KEY NOT NULL,
	`adminId` integer NOT NULL,
	`action` text NOT NULL,
	`targetType` text NOT NULL,
	`targetId` integer,
	`changes` text,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `audit_admin_idx` ON `audit_logs` (`adminId`);--> statement-breakpoint
CREATE INDEX `audit_action_idx` ON `audit_logs` (`action`);--> statement-breakpoint
CREATE INDEX `audit_created_at_idx` ON `audit_logs` (`createdAt`);--> statement-breakpoint
CREATE TABLE `bookmarks` (
	`id` integer PRIMARY KEY NOT NULL,
	`userId` integer NOT NULL,
	`postId` integer NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `bookmark_user_idx` ON `bookmarks` (`userId`);--> statement-breakpoint
CREATE INDEX `bookmark_post_idx` ON `bookmarks` (`postId`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_post_unique` ON `bookmarks` (`userId`,`postId`);--> statement-breakpoint
CREATE TABLE `categories` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_name_unique` ON `categories` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `categories_slug_unique` ON `categories` (`slug`);--> statement-breakpoint
CREATE INDEX `category_name_idx` ON `categories` (`name`);--> statement-breakpoint
CREATE INDEX `category_slug_idx` ON `categories` (`slug`);--> statement-breakpoint
CREATE TABLE `comments` (
	`id` integer PRIMARY KEY NOT NULL,
	`postId` integer NOT NULL,
	`userId` integer NOT NULL,
	`content` text NOT NULL,
	`parentId` integer,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `comments_post_id_idx` ON `comments` (`postId`);--> statement-breakpoint
CREATE INDEX `comments_user_id_idx` ON `comments` (`userId`);--> statement-breakpoint
CREATE INDEX `parent_id_idx` ON `comments` (`parentId`);--> statement-breakpoint
CREATE TABLE `follows` (
	`followerId` integer NOT NULL,
	`followingId` integer NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`followerId`, `followingId`)
);
--> statement-breakpoint
CREATE INDEX `follower_idx` ON `follows` (`followerId`);--> statement-breakpoint
CREATE INDEX `following_idx` ON `follows` (`followingId`);--> statement-breakpoint
CREATE TABLE `likes` (
	`id` integer PRIMARY KEY NOT NULL,
	`postId` integer NOT NULL,
	`userId` integer NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `likes_post_id_idx` ON `likes` (`postId`);--> statement-breakpoint
CREATE INDEX `likes_user_id_idx` ON `likes` (`userId`);--> statement-breakpoint
CREATE UNIQUE INDEX `post_user_unique` ON `likes` (`postId`,`userId`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` integer PRIMARY KEY NOT NULL,
	`userId` integer NOT NULL,
	`type` text NOT NULL,
	`postId` integer,
	`actorId` integer,
	`read` integer DEFAULT 0 NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `notification_user_idx` ON `notifications` (`userId`);--> statement-breakpoint
CREATE INDEX `notification_read_idx` ON `notifications` (`read`);--> statement-breakpoint
CREATE TABLE `postTags` (
	`postId` integer NOT NULL,
	`tagId` integer NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`postId`, `tagId`)
);
--> statement-breakpoint
CREATE INDEX `posttags_post_id_idx` ON `postTags` (`postId`);--> statement-breakpoint
CREATE INDEX `tag_id_idx` ON `postTags` (`tagId`);--> statement-breakpoint
CREATE TABLE `post_versions` (
	`id` integer PRIMARY KEY NOT NULL,
	`postId` integer NOT NULL,
	`userId` integer,
	`title` text,
	`content` text,
	`contentType` text,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `post_versions_post_idx` ON `post_versions` (`postId`);--> statement-breakpoint
CREATE TABLE `post_views` (
	`id` integer PRIMARY KEY NOT NULL,
	`postId` integer NOT NULL,
	`day` text NOT NULL,
	`views` integer DEFAULT 0 NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `post_views_post_day_idx` ON `post_views` (`postId`,`day`);--> statement-breakpoint
CREATE TABLE `posts` (
	`id` integer PRIMARY KEY NOT NULL,
	`userId` integer NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`contentType` text DEFAULT 'plaintext' NOT NULL,
	`excerpt` text,
	`published` integer DEFAULT 0 NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`categoryId` integer,
	`scheduledAt` text,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `posts_user_id_idx` ON `posts` (`userId`);--> statement-breakpoint
CREATE INDEX `posts_published_idx` ON `posts` (`published`);--> statement-breakpoint
CREATE INDEX `posts_created_at_idx` ON `posts` (`createdAt`);--> statement-breakpoint
CREATE TABLE `role_permissions` (
	`role` text NOT NULL,
	`permission` text NOT NULL,
	`grantedAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`role`, `permission`)
);
--> statement-breakpoint
CREATE INDEX `role_perm_role_idx` ON `role_permissions` (`role`);--> statement-breakpoint
CREATE TABLE `tags` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_name_unique` ON `tags` (`name`);--> statement-breakpoint
CREATE INDEX `name_idx` ON `tags` (`name`);--> statement-breakpoint
CREATE TABLE `user_permissions` (
	`userId` integer NOT NULL,
	`permission` text NOT NULL,
	`grantedAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`userId`, `permission`)
);
--> statement-breakpoint
CREATE INDEX `user_perm_user_idx` ON `user_permissions` (`userId`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY NOT NULL,
	`openId` text NOT NULL,
	`name` text,
	`email` text,
	`loginMethod` text,
	`role` text DEFAULT 'user' NOT NULL,
	`username` text,
	`passwordHash` text,
	`bio` text,
	`avatarUrl` text,
	`isBanned` integer DEFAULT 0 NOT NULL,
	`banReason` text,
	`bannedAt` text,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`lastSignedIn` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_openId_unique` ON `users` (`openId`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE INDEX `email_idx` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `username_idx` ON `users` (`username`);