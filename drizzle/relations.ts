import { relations } from "drizzle-orm";
import {
  users,
  posts,
  comments,
  likes,
  tags,
  postTags,
  postVersions,
  follows,
  bookmarks,
  categories,
  notifications,
  postViews,
  auditLogs,
  reports,
  rolePermissions,
  userPermissions,
} from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  comments: many(comments),
  likes: many(likes),
  postTags: many(postTags),
  postVersions: many(postVersions),
  follows: many(follows),
  bookmarks: many(bookmarks),
  notifications: many(notifications),
  postViews: many(postViews),
  auditLogs: many(auditLogs),
  reports: many(reports),
  userPermissions: many(userPermissions),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  comments: many(comments),
  likes: many(likes),
  postTags: many(postTags),
  postVersions: many(postVersions),
  bookmarks: many(bookmarks),
  postViews: many(postViews),
  reports: many(reports),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
  }),
  replies: many(comments),
  likes: many(likes),
  reports: many(reports),
}));

export const likesRelations = relations(likes, ({ one }) => ({
  user: one(users, {
    fields: [likes.userId],
    references: [users.id],
  }),
  post: one(posts, {
    fields: [likes.postId],
    references: [posts.id],
  }),
  comment: one(comments, {
    fields: [likes.commentId],
    references: [comments.id],
  }),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  postTags: many(postTags),
}));

export const postTagsRelations = relations(postTags, ({ one }) => ({
  post: one(posts, {
    fields: [postTags.postId],
    references: [posts.id],
  }),
  tag: one(tags, {
    fields: [postTags.tagId],
    references: [tags.id],
  }),
}));

export const postVersionsRelations = relations(postVersions, ({ one }) => ({
  post: one(posts, {
    fields: [postVersions.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [postVersions.userId],
    references: [users.id],
  }),
}));

export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(users, {
    fields: [follows.followerId],
    references: [users.id],
  }),
  following: one(users, {
    fields: [follows.followingId],
    references: [users.id],
  }),
}));

export const bookmarksRelations = relations(bookmarks, ({ one }) => ({
  user: one(users, {
    fields: [bookmarks.userId],
    references: [users.id],
  }),
  post: one(posts, {
    fields: [bookmarks.postId],
    references: [posts.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  posts: many(posts),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const postViewsRelations = relations(postViews, ({ one }) => ({
  user: one(users, {
    fields: [postViews.userId],
    references: [users.id],
  }),
  post: one(posts, {
    fields: [postViews.postId],
    references: [posts.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  user: one(users, {
    fields: [reports.userId],
    references: [users.id],
  }),
  resolvedBy: one(users, {
    fields: [reports.resolvedBy],
    references: [users.id],
  }),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({}) => ({}));

export const userPermissionsRelations = relations(userPermissions, ({ one }) => ({
  user: one(users, {
    fields: [userPermissions.userId],
    references: [users.id],
  }),
}));
