import { integer, sqliteTable, text, unique, index, primaryKey } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 */
export const users = sqliteTable("users", {
  id: integer("id").primaryKey(),
  openId: text("openId").notNull().unique(),
  name: text("name"),
  email: text("email").unique(),
  loginMethod: text("loginMethod"),
  role: text("role").default("user").notNull(),
  
  // Extended fields for BLOZHIK
  username: text("username").unique(),
  passwordHash: text("passwordHash"),
  bio: text("bio"),
  avatarUrl: text("avatarUrl"),
  
  // Admin fields
  isBanned: integer("isBanned").default(0).notNull(),
  banReason: text("banReason"),
  bannedAt: text("bannedAt"),
  bannedUntil: text("bannedUntil"), // null = permanent ban, date = temporary ban
  
  createdAt: text("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text("updatedAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
  lastSignedIn: text("lastSignedIn").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  emailIdx: index("email_idx").on(table.email),
  usernameIdx: index("username_idx").on(table.username),
  bannedUntilIdx: index("users_banned_until_idx").on(table.bannedUntil),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Posts table - stores blog posts with Markdown or plain text content
 */
export const posts = sqliteTable("posts", {
  id: integer("id").primaryKey(),
  userId: integer("userId").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  contentType: text("contentType").default("plaintext").notNull(),
  excerpt: text("excerpt"),
  published: integer("published").default(0).notNull(),
  createdAt: text("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
  categoryId: integer("categoryId"),
  scheduledAt: text("scheduledAt"),
  featured: integer("featured").default(0).notNull(),
  updatedAt: text("updatedAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  userIdIdx: index("user_id_idx").on(table.userId),
  publishedIdx: index("published_idx").on(table.published),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
}));

export type Post = typeof posts.$inferSelect;
export type InsertPost = typeof posts.$inferInsert;

/**
 * Comments table - stores comments on posts
 */
export const comments = sqliteTable("comments", {
  id: integer("id").primaryKey(),
  postId: integer("postId").notNull(),
  userId: integer("userId").notNull(),
  content: text("content").notNull(),
  parentId: integer("parentId"),
  createdAt: text("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text("updatedAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  postIdIdx: index("post_id_idx").on(table.postId),
  userIdIdx: index("user_id_idx").on(table.userId),
  parentIdIdx: index("parent_id_idx").on(table.parentId),
}));

export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;

/**
 * Comment Reactions table - stores emoji reactions on comments
 * Supported reactionType values: 'heart', 'laugh', 'ok', 'thumbs_down'
 */
export const commentReactions = sqliteTable("comment_reactions", {
  id: integer("id").primaryKey(),
  commentId: integer("commentId").notNull(),
  userId: integer("userId").notNull(),
  reactionType: text("reactionType").notNull(), // emoji key: 'heart' | 'laugh' | 'ok' | 'thumbs_down'
  createdAt: text("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  commentUserUnique: unique("comment_user_unique").on(table.commentId, table.userId),
  commentIdIdx: index("comment_reactions_comment_idx").on(table.commentId),
  userIdIdx: index("comment_reactions_user_idx").on(table.userId),
}));

export type CommentReaction = typeof commentReactions.$inferSelect;
export type InsertCommentReaction = typeof commentReactions.$inferInsert;

/**
 * Likes table - stores post likes with unique constraint
 */
export const likes = sqliteTable("likes", {
  id: integer("id").primaryKey(),
  postId: integer("postId").notNull(),
  userId: integer("userId").notNull(),
  createdAt: text("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  postUserUnique: unique("post_user_unique").on(table.postId, table.userId),
  postIdIdx: index("post_id_idx").on(table.postId),
  userIdIdx: index("user_id_idx").on(table.userId),
}));

export type Like = typeof likes.$inferSelect;
export type InsertLike = typeof likes.$inferInsert;

/**
 * Tags table - stores unique tags
 */
export const tags = sqliteTable("tags", {
  id: integer("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: text("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  nameIdx: index("name_idx").on(table.name),
}));

export type Tag = typeof tags.$inferSelect;
export type InsertTag = typeof tags.$inferInsert;

/**
 * Post-Tags junction table - many-to-many relationship
 */
export const postTags = sqliteTable("postTags", {
  postId: integer("postId").notNull(),
  tagId: integer("tagId").notNull(),
  createdAt: text("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.postId, table.tagId] }),
  postIdIdx: index("post_id_idx").on(table.postId),
  tagIdIdx: index("tag_id_idx").on(table.tagId),
}));

export type PostTag = typeof postTags.$inferSelect;
export type InsertPostTag = typeof postTags.$inferInsert;

/**
 * Post Versions table - keeps a copy of post content on updates for version history
 */
export const postVersions = sqliteTable('post_versions', {
  id: integer('id').primaryKey(),
  postId: integer('postId').notNull(),
  userId: integer('userId'),
  title: text('title'),
  content: text('content'),
  contentType: text('contentType'),
  createdAt: text('createdAt').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  postIdIdx: index('post_versions_post_idx').on(table.postId),
}));

export type PostVersion = typeof postVersions.$inferSelect;
export type InsertPostVersion = typeof postVersions.$inferInsert;

/**
 * Follows table - stores follower -> following relationships
 */
export const follows = sqliteTable("follows", {
  followerId: integer("followerId").notNull(),
  followingId: integer("followingId").notNull(),
  createdAt: text("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.followerId, table.followingId] }),
  followerIdx: index("follower_idx").on(table.followerId),
  followingIdx: index("following_idx").on(table.followingId),
}));

export type Follow = typeof follows.$inferSelect;
export type InsertFollow = typeof follows.$inferInsert;

/**
 * Bookmarks table - user saved posts
 */
export const bookmarks = sqliteTable("bookmarks", {
  id: integer("id").primaryKey(),
  userId: integer("userId").notNull(),
  postId: integer("postId").notNull(),
  createdAt: text("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  userPostUnique: unique("user_post_unique").on(table.userId, table.postId),
  userIdx: index("bookmark_user_idx").on(table.userId),
  postIdx: index("bookmark_post_idx").on(table.postId),
}));

export type Bookmark = typeof bookmarks.$inferSelect;
export type InsertBookmark = typeof bookmarks.$inferInsert;

/**
 * Post Reactions table - stores emoji reactions on posts
 */
export const postReactions = sqliteTable("post_reactions", {
  id: integer("id").primaryKey(),
  postId: integer("postId").notNull(),
  userId: integer("userId").notNull(),
  reactionType: text("reactionType").notNull(), // emoji key: 'heart' | 'laugh' | 'ok' | 'thumbs_down'
  createdAt: text("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  postUserUnique: primaryKey({ columns: [table.postId, table.userId] }),
  postIdIdx: index("post_reactions_post_idx").on(table.postId),
  userIdIdx: index("post_reactions_user_idx").on(table.userId),
}));

export type PostReaction = typeof postReactions.$inferSelect;
export type InsertPostReaction = typeof postReactions.$inferInsert;

/**
 * Categories table - post categories
 */
export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  createdAt: text("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  nameIdx: index("category_name_idx").on(table.name),
  slugIdx: index("category_slug_idx").on(table.slug),
}));

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

/**
 * Notifications table - simple user notifications
 */
export const notifications = sqliteTable("notifications", {
  id: integer("id").primaryKey(),
  userId: integer("userId").notNull(),
  type: text("type").notNull(),
  postId: integer("postId"),
  actorId: integer("actorId"),
  read: integer("read").default(0).notNull(),
  createdAt: text("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  userIdx: index("notification_user_idx").on(table.userId),
  readIdx: index("notification_read_idx").on(table.read),
}));

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Post views table - track daily views per post for author analytics
 */
export const postViews = sqliteTable('post_views', {
  id: integer('id').primaryKey(),
  postId: integer('postId').notNull(),
  day: text('day').notNull(),
  views: integer('views').default(0).notNull(),
  createdAt: text('createdAt').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  postDayIdx: index('post_views_post_day_idx').on(table.postId, table.day),
}));

export type PostView = typeof postViews.$inferSelect;

/**
 * Announcements table - site-wide messages and banners
 */
export const announcements = sqliteTable("announcements", {
  id: integer("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: text("type").default('info').notNull(),
  startDate: text("startDate"),
  endDate: text("endDate"),
  targetAudience: text("targetAudience").default('all'),
  targetUserIds: text("targetUserIds"), // JSON array of user IDs
  createdAt: text("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  typeIdx: index('announcements_type_idx').on(table.type),
  startDateIdx: index('announcements_start_date_idx').on(table.startDate),
}));

export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = typeof announcements.$inferInsert;

/**
 * Audit Logs table - tracks admin actions and system events
 */
export const auditLogs = sqliteTable("audit_logs", {
  id: integer("id").primaryKey(),
  userId: integer("userId"), // admin user who performed the action (null for system)
  action: text("action").notNull(), // 'ban_user', 'unban_user', 'delete_post', 'resolve_report', etc.
  targetType: text("targetType"), // 'user', 'post', 'comment', 'report'
  targetId: integer("targetId"), // id of the affected entity
  details: text("details"), // JSON string with additional details
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  createdAt: text("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  userIdx: index("audit_user_idx").on(table.userId),
  actionIdx: index("audit_action_idx").on(table.action),
  targetIdx: index("audit_target_idx").on(table.targetType, table.targetId),
  createdAtIdx: index("audit_created_at_idx").on(table.createdAt),
}));

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

/**
 * Reports table - user reports for content moderation
 */
export const reports = sqliteTable("reports", {
  id: integer("id").primaryKey(),
  userId: integer("userId").notNull(), // reporter
  targetType: text("targetType").notNull(), // 'post', 'comment', 'user'
  targetId: integer("targetId").notNull(), // post_id, comment_id, or user_id
  reason: text("reason").notNull(), // 'spam', 'offensive', 'harassment', 'adult', 'other'
  description: text("description"),
  status: text("status").default("open").notNull(), // 'open', 'resolved', 'dismissed'
  resolvedBy: integer("resolvedBy"),
  resolvedAt: text("resolvedAt"),
  action: text("action"), // what action was taken
  createdAt: text("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  userIdx: index("report_user_idx").on(table.userId),
  targetIdx: index("report_target_idx").on(table.targetType, table.targetId),
  statusIdx: index("report_status_idx").on(table.status),
  createdAtIdx: index("report_created_at_idx").on(table.createdAt),
}));

export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;

/**
 * Role Permissions table - defines permissions for each role
 */
export const rolePermissions = sqliteTable("role_permissions", {
  role: text("role").notNull(),
  permission: text("permission").notNull(),
  grantedAt: text("grantedAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.role, table.permission] }),
  roleIdx: index("role_perm_role_idx").on(table.role),
}));

export type RolePermission = typeof rolePermissions.$inferSelect;
export type InsertRolePermission = typeof rolePermissions.$inferInsert;

/**
 * User Permissions table - custom permissions for specific users
 */
export const userPermissions = sqliteTable("user_permissions", {
  userId: integer("userId").notNull(),
  permission: text("permission").notNull(),
  grantedAt: text("grantedAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.permission] }),
  userIdx: index("user_perm_user_idx").on(table.userId),
}));

export type UserPermission = typeof userPermissions.$inferSelect;
export type InsertUserPermission = typeof userPermissions.$inferInsert;

/**
 * Blocks table - users blocking other users
 */
export const blocks = sqliteTable("blocks", {
  id: integer("id").primaryKey(),
  userId: integer("userId").notNull(), // user who is blocking
  blockedUserId: integer("blockedUserId").notNull(), // user being blocked
  createdAt: text("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  userBlockedUnique: unique("user_blocked_unique").on(table.userId, table.blockedUserId),
  userIdx: index("blocks_user_idx").on(table.userId),
  blockedUserIdx: index("blocks_blocked_user_idx").on(table.blockedUserId),
}));

export type Block = typeof blocks.$inferSelect;
export type InsertBlock = typeof blocks.$inferInsert;

/**
 * Badges table - achievement badges
 */
export const badges = sqliteTable("badges", {
  id: integer("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  icon: text("icon").notNull(), // emoji or icon name
  requirement: text("requirement").notNull(), // JSON: {"type": "posts_count", "value": 1}
  createdAt: text("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export type Badge = typeof badges.$inferSelect;
export type InsertBadge = typeof badges.$inferInsert;

/**
 * User Badges table - badges earned by users
 */
export const userBadges = sqliteTable("user_badges", {
  id: integer("id").primaryKey(),
  userId: integer("userId").notNull(),
  badgeId: integer("badgeId").notNull(),
  earnedAt: text("earnedAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  userBadgeUnique: unique("user_badge_unique").on(table.userId, table.badgeId),
  userIdx: index("user_badges_user_idx").on(table.userId),
  badgeIdx: index("user_badges_badge_idx").on(table.badgeId),
}));

export type UserBadge = typeof userBadges.$inferSelect;
export type InsertUserBadge = typeof userBadges.$inferInsert;

