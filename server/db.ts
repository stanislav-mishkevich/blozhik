import { eq, and, desc, sql, like, or, inArray, count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { 
  InsertUser, users, 
  posts, InsertPost, Post,
  comments, InsertComment, Comment,
  commentReactions, InsertCommentReaction, CommentReaction,
  likes, InsertLike,
  postReactions, InsertPostReaction, PostReaction,
  tags, InsertTag, Tag,
  postTags, InsertPostTag,
  postVersions, InsertPostVersion,
  postViews,
  auditLogs, rolePermissions, userPermissions,
  reports, Report, InsertReport,
  blocks, Block, InsertBlock,
  badges, Badge, InsertBadge,
  userBadges, UserBadge, InsertUserBadge
} from "../drizzle/schema";
import { announcements } from "../drizzle/schema";
import { follows, Follow, bookmarks, Bookmark, categories, Category, notifications } from "../drizzle/schema";
// `tags` and `postTags` are already imported above from drizzle schema.
import { ENV } from './_core/env';
import { publishNotification } from './_core/notificationHub';
import { sendNotificationEmail } from './_core/email';
import { logAction, logError } from './_core/auditLog';

let _db: ReturnType<typeof drizzle> | null = null;

export function resetDb() {
  if (_db) {
    (_db as any).$client.close();
  }
  _db = null;
}

export async function getDb() {
  if (!_db) {
    try {
      const dbUrl = process.env.DATABASE_URL ?? process.env.DATABASE_PATH ?? "./blozhik.db";
      // Allow specifiers like `sqlite:./blozhik.db` or `file:./blozhik.db` or just a plain path
      const filePath = String(dbUrl).replace(/^sqlite:\/?|^file:\/?/, "");
      const db = new Database(filePath);
      _db = drizzle(db);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============= USER OPERATIONS =============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
      name: user.name || null,
      email: user.email || null,
      loginMethod: user.loginMethod || 'password',
      role: user.role || 'user',
      username: user.username || null,
      passwordHash: user.passwordHash || null,
      bio: user.bio || null,
      avatarUrl: user.avatarUrl || null,
      isBanned: user.isBanned || 0,
      banReason: user.banReason || null,
      bannedAt: user.bannedAt || null,
      createdAt: user.createdAt || new Date().toISOString(),
      updatedAt: user.updatedAt || new Date().toISOString(),
      lastSignedIn: user.lastSignedIn || new Date().toISOString(),
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "username", "passwordHash", "bio", "avatarUrl"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date().toISOString();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date().toISOString();
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByUsername(username: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUser(id: number, data: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) return undefined;
  
  await db.update(users).set(data).where(eq(users.id, id));
  return getUserById(id);
}

export async function getUserStats(userId: number) {
  const db = await getDb();
  if (!db) return { postCount: 0, totalLikes: 0, commentCount: 0 };
  
  const postCountResult = await db.select({ count: sql<number>`count(*)` })
    .from(posts)
    .where(and(eq(posts.userId, userId), eq(posts.published, 1)));
  
  // Count old likes
  const likesResult = await db.select({ count: sql<number>`count(*)` })
    .from(likes)
    .innerJoin(posts, eq(likes.postId, posts.id))
    .where(eq(posts.userId, userId));
  
  // Count post reactions (emoji)
  const reactionsResult = await db.select({ count: sql<number>`count(*)` })
    .from(postReactions)
    .innerJoin(posts, eq(postReactions.postId, posts.id))
    .where(eq(posts.userId, userId));
  
  const commentCountResult = await db.select({ count: sql<number>`count(*)` })
    .from(comments)
    .where(eq(comments.userId, userId));
  
  return {
    postCount: Number(postCountResult[0]?.count || 0),
    totalLikes: Number(likesResult[0]?.count || 0) + Number(reactionsResult[0]?.count || 0),
    commentCount: Number(commentCountResult[0]?.count || 0),
  };
}

export async function getBookmarkCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const res = await db.select({ count: sql<number>`count(*)` }).from(bookmarks).where(eq(bookmarks.userId, userId));
  return Number(res[0]?.count || 0);
}

// ============= POST OPERATIONS =============

export async function createPost(data: InsertPost) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(posts).values(data).returning({ id: posts.id });
  
  // Log action
  await logAction({
    action: 'post_created',
    userId: data.userId,
    targetType: 'post',
    targetId: result.id,
    details: { title: data.title, contentType: data.contentType, published: data.published },
  });
  
  return result.id;
}

export async function saveDraft(draft: { postId?: number; userId: number; title?: string | null; content?: string | null; contentType?: string | null; tags?: string[] | null; categoryId?: number | null; scheduledAt?: string | null }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (draft.postId) {
    const updateData: any = {};
    updateData.title = draft.title ?? "";
    updateData.content = draft.content ?? "";
    updateData.contentType = draft.contentType ?? 'markdown';
    updateData.published = 0; // ensure draft
    updateData.updatedAt = new Date().toISOString();
    if (draft.categoryId !== undefined) {
      updateData.categoryId = draft.categoryId ?? null;
    }
    
    await db.update(posts).set(updateData).where(eq(posts.id, draft.postId));
    return draft.postId;
  } else {
    const [result] = await db.insert(posts).values({
      userId: draft.userId,
      title: draft.title ?? "",
      content: draft.content ?? "",
      contentType: draft.contentType ?? 'markdown',
      excerpt: '',
      published: 0,
      categoryId: draft.categoryId ?? null,
      scheduledAt: draft.scheduledAt ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }).returning({ id: posts.id });
    return result.id;
  }
}

export async function getDraftsForUser(userId: number, limit: number = 20, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select()
    .from(posts)
    .where(and(eq(posts.userId, userId), eq(posts.published, 0)))
    .orderBy(desc(posts.updatedAt))
    .limit(limit)
    .offset(offset);
}

export async function getPostById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  if (result.length === 0) return undefined;
  const post = result[0];

  // Attach reactionCounts for post (emoji map)
  try {
    const emojis = ['heart', 'laugh', 'ok', 'thumbs_down'];
    const counts: Record<string, number> = {};
    let total = 0;
    for (const e of emojis) {
      const res = await db
        .select({ count: count() })
        .from(postReactions)
        .where(and(eq(postReactions.postId, id), eq(postReactions.reactionType, e)));
      const val = Number(res[0]?.count || 0);
      counts[e] = val;
      total += val;
    }
    (post as any).reactionCounts = counts;
    (post as any).reactionTotal = total;
  } catch (err) {
    // ignore
  }

  return post;
}

export function estimateReadingTime(content: string, contentType: string = 'markdown') {
  if (!content) return 0;
  let codeWordCount = 0;
  let textOnly = content;
  if (contentType === 'markdown') {
    // remove code blocks, but count words inside code blocks separately as faster words
    const codeBlocks = Array.from((content.match(/```[\s\S]*?```/g) || []));
    for (const block of codeBlocks) {
      const inner = block.replace(/```/g, '');
      codeWordCount += (inner.split(/\s+/).filter(Boolean).length);
    }
    textOnly = content.replace(/```[\s\S]*?```/g, '');
  }
  const words = textOnly.split(/\s+/).filter(Boolean).length;
  const normalMins = words / 200.0;
  const codeMins = codeWordCount / 50.0;
  const mins = Math.max(1, Math.round((normalMins + codeMins) || 1));
  return mins;
}

export async function updatePost(id: number, data: Partial<InsertPost>) {
  const db = await getDb();
  if (!db) return undefined;
  
  // Before updating, store a version of the current post
  try {
    const current = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
    if (current.length > 0) {
      const p = current[0];
      await db.insert(postVersions).values({ postId: p.id, userId: p.userId, title: p.title, content: p.content, contentType: p.contentType });
    }
  } catch (err) {
    console.warn('[PostVersion] Failed to store version before update', err);
  }

  await db.update(posts).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(posts.id, id));
  return getPostById(id);
}

export async function publishScheduledPosts() {
  const db = await getDb();
  if (!db) return [];
  const now = new Date().toISOString();
  const rows = await db.select().from(posts).where(and(eq(posts.published, 0), sql`${posts.scheduledAt} <= ${now}`));
  const publishedIds: number[] = [];
  for (const r of rows) {
    await db.update(posts).set({ published: 1, scheduledAt: null }).where(eq(posts.id, r.id));
    publishedIds.push(r.id);
    // optional: notify author about publish
    try {
      await createNotification({ userId: r.userId, type: 'publish', postId: r.id, actorId: r.userId });
    } catch (err) {
      console.warn('[Scheduler] failed to create publish notification', err);
    }
  }
  return publishedIds;
}

export async function createPostVersion(postId: number, userId?: number) {
  const db = await getDb();
  if (!db) return undefined;
  const current = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
  if (current.length === 0) return undefined;
  const p = current[0];
  const result = await db.insert(postVersions).values({ postId: p.id, userId: userId ?? p.userId, title: p.title, content: p.content, contentType: p.contentType });
  const id = Number((result as any).insertId || 0);
  return id;
}

export async function getPostVersions(postId: number, limit: number = 20, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(postVersions).where(eq(postVersions.postId, postId)).orderBy(desc(postVersions.createdAt)).limit(limit).offset(offset);
}

export async function deletePost(id: number) {
  const db = await getDb();
  if (!db) {
    console.error('[deletePost] Database not available');
    return;
  }
  
  console.log(`[deletePost] Starting deletion for post ${id}`);
  
  try {
    // Каскадное удаление всех связанных данных поста
    // 1. Получаем все комментарии к посту
    const postComments = await db.select({ id: comments.id }).from(comments).where(eq(comments.postId, id));
    const commentIds = postComments.map(c => c.id);
    console.log(`[deletePost] Found ${commentIds.length} comments to delete`);
    
    // 2. Удаляем реакции на комментарии
    if (commentIds.length > 0) {
      await db.delete(commentReactions).where(inArray(commentReactions.commentId, commentIds));
      console.log(`[deletePost] Deleted comment reactions`);
    }
    
    // 3. Удаляем комментарии
    await db.delete(comments).where(eq(comments.postId, id));
    console.log(`[deletePost] Deleted comments`);
    
    // 4. Удаляем теги поста
    await db.delete(postTags).where(eq(postTags.postId, id));
    console.log(`[deletePost] Deleted post tags`);
    
    // 5. Удаляем лайки
    await db.delete(likes).where(eq(likes.postId, id));
    console.log(`[deletePost] Deleted likes`);
    
    // 6. Удаляем закладки
    await db.delete(bookmarks).where(eq(bookmarks.postId, id));
    console.log(`[deletePost] Deleted bookmarks`);
    
    // 7. Удаляем уведомления связанные с постом
    await db.delete(notifications).where(eq(notifications.postId, id));
    console.log(`[deletePost] Deleted notifications`);
    
    // 8. Удаляем версии поста
    await db.delete(postVersions).where(eq(postVersions.postId, id));
    console.log(`[deletePost] Deleted post versions`);
    
    // 9. Удаляем просмотры
    await db.delete(postViews).where(eq(postViews.postId, id));
    console.log(`[deletePost] Deleted post views`);
    
    // 10. Наконец удаляем сам пост
    await db.delete(posts).where(eq(posts.id, id));
    console.log(`[deletePost] Deleted post ${id} successfully`);
  } catch (error) {
    console.error(`[deletePost] Error deleting post ${id}:`, error);
    throw error;
  }
}

export async function getPublishedPosts(options: {
  limit?: number;
  offset?: number;
  sortBy?: 'new' | 'popular' | 'trending';
  tagId?: number;
  categoryId?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  
  const { limit = 20, offset = 0, sortBy = 'new', tagId, categoryId } = options;
  
  // Count both old likes and new reactions (emoji)
  const likeCountExpr = sql<number>`(
    (SELECT COUNT(*) FROM ${likes} WHERE ${likes.postId} = ${posts.id}) +
    (SELECT COUNT(*) FROM ${postReactions} WHERE ${postReactions.postId} = ${posts.id})
  )`;
  const commentCountExpr = sql<number>`(SELECT COUNT(*) FROM ${comments} WHERE ${comments.postId} = ${posts.id})`;
  
  if (tagId) {
    const results = await db.select({
      post: posts,
      author: users,
      category: categories,
      likeCount: likeCountExpr,
      commentCount: commentCountExpr,
    })
      .from(posts)
      .innerJoin(users, eq(posts.userId, users.id))
      .innerJoin(postTags, eq(posts.id, postTags.postId))
      .leftJoin(categories, eq(posts.categoryId, categories.id))
      .where(and(eq(posts.published, 1), eq(postTags.tagId, tagId), categoryId ? eq(posts.categoryId, categoryId) : sql`1=1`))
        .orderBy(sortBy === 'new' ? desc(posts.createdAt) : 
                 sortBy === 'popular' ? desc(likeCountExpr) :
                 desc(sql`(
                   (${likeCountExpr} * 0.7 + ${commentCountExpr} * 0.3) / ((strftime('%s','now') - strftime('%s', ${posts.createdAt})) / 3600.0 + 2)
                 )`))
      .limit(limit)
      .offset(offset);
    return results;
  }
  
  let whereConditions = [eq(posts.published, 1)];
  if (categoryId) {
    whereConditions.push(eq(posts.categoryId, categoryId));
  }

  const results = await db.select({
    post: posts,
    author: users,
    category: categories,
    likeCount: likeCountExpr,
    commentCount: commentCountExpr,
  })
    .from(posts)
    .innerJoin(users, eq(posts.userId, users.id))
    .leftJoin(categories, eq(posts.categoryId, categories.id))
    .where(and(...whereConditions))
      .orderBy(sortBy === 'new' ? desc(posts.createdAt) : 
               sortBy === 'popular' ? desc(likeCountExpr) :
               desc(sql`(
                 (${likeCountExpr} * 0.7 + ${commentCountExpr} * 0.3) / ((strftime('%s','now') - strftime('%s', ${posts.createdAt})) / 3600.0 + 2)
               )`))
    .limit(limit)
    .offset(offset);
  
  return results;
}

export async function addPageView(postId: number) {
  const db = await getDb();
  if (!db) return;
  const day = new Date().toISOString().slice(0, 10);
  // Try to increment existing row
  const existing = await db.select().from(postViews).where(and(eq(postViews.postId, postId), eq(postViews.day, day))).limit(1);
  if (existing.length > 0) {
    await db.update(postViews).set({ views: sql<number>`${postViews.views} + 1` }).where(and(eq(postViews.postId, postId), eq(postViews.day, day)));
  } else {
    await db.insert(postViews).values({ postId, day, views: 1 });
  }
}

export async function getPostViews(postId: number, days: number = 30) {
  const db = await getDb();
  if (!db) return [];
  const results = await db.select().from(postViews).where(eq(postViews.postId, postId)).orderBy(desc(postViews.day)).limit(days);
  return results;
}

export async function getViewsAggregated(postId: number, days: number = 30) {
  const db = await getDb();
  if (!db) return [];
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  const sinceIso = since.toISOString().slice(0, 10);

  // Build list of days
  const dayList: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    dayList.push(d.toISOString().slice(0, 10));
  }

  const rows = await db.select().from(postViews).where(and(eq(postViews.postId, postId), sql`${postViews.day} >= ${sinceIso}`)).orderBy(desc(postViews.day));
  // Map days to counts
  const map: Record<string, number> = {};
  for (const r of rows) map[r.day] = Number(r.views);
  return dayList.map((d) => ({ day: d, views: Number(map[d] || 0) }));
}

export async function getTopPostsForUser(userId: number, days: number = 30, limit: number = 3) {
  const db = await getDb();
  if (!db) return [];
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  const sinceIso = since.toISOString().slice(0, 10);

  const results = await db.select({ post: posts, totalViews: sql<number>`SUM(${postViews.views})`})
    .from(posts)
    .leftJoin(postViews, eq(postViews.postId, posts.id))
    .where(and(eq(posts.userId, userId), sql`${postViews.day} >= ${sinceIso}`))
    .groupBy(posts.id)
    .orderBy(desc(sql<number>`SUM(${postViews.views})`))
    .limit(limit);
  return results.map((r: any) => ({ post: r.post, views: Number(r.totalViews || 0) }));
}

export async function getViewsForUser(userId: number, days: number = 30) {
  const db = await getDb();
  if (!db) return 0;
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  const sinceIso = since.toISOString().slice(0, 10);
  const res = await db.select({ total: sql<number>`SUM(${postViews.views})` }).from(postViews).innerJoin(posts, eq(postViews.postId, posts.id)).where(and(eq(posts.userId, userId), sql`${postViews.day} >= ${sinceIso}`));
  return Number(res[0]?.total || 0);
}

export async function getTopAuthors(days: number = 30, limit: number = 3) {
  const db = await getDb();
  if (!db) return [];
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  const sinceIso = since.toISOString().slice(0, 10);

  const results = await db.select({ author: users, totalViews: sql<number>`SUM(${postViews.views})` })
    .from(users)
    .leftJoin(posts, eq(posts.userId, users.id))
    .leftJoin(postViews, eq(postViews.postId, posts.id))
    .where(sql`${postViews.day} >= ${sinceIso}`)
    .groupBy(users.id)
    .orderBy(desc(sql<number>`SUM(${postViews.views})`))
    .limit(limit);
  return results.map((r: any) => ({ user: r.author, views: Number(r.totalViews || 0) }));
}

export async function getUserPosts(userId: number, includeUnpublished: boolean = false) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = includeUnpublished 
    ? eq(posts.userId, userId)
    : and(eq(posts.userId, userId), eq(posts.published, 1));
  
  // Count both old likes and new reactions (emoji)
  const likeCountExpr = sql<number>`(
    (SELECT COUNT(*) FROM ${likes} WHERE ${likes.postId} = ${posts.id}) +
    (SELECT COUNT(*) FROM ${postReactions} WHERE ${postReactions.postId} = ${posts.id})
  )`;
  const commentCountExpr = sql<number>`(SELECT COUNT(*) FROM ${comments} WHERE ${comments.postId} = ${posts.id})`;
  
  return db.select({
    id: posts.id,
    title: posts.title,
    content: posts.content,
    contentType: posts.contentType,
    excerpt: posts.excerpt,
    published: posts.published,
    createdAt: posts.createdAt,
    updatedAt: posts.updatedAt,
    userId: posts.userId,
    categoryId: posts.categoryId,
    scheduledAt: posts.scheduledAt,
    featured: posts.featured,
    likeCount: likeCountExpr,
    commentCount: commentCountExpr,
  })
  .from(posts)
  .where(conditions)
  .orderBy(desc(posts.createdAt));
}

export async function searchPosts(query: string, limit: number = 20) {
  const db = await getDb();
  if (!db) return [];
  
  const searchPattern = `%${query}%`;
  
  return db.select({
    post: posts,
    author: users,
    category: categories,
    likeCount: sql<number>`(
      (SELECT COUNT(*) FROM ${likes} WHERE ${likes.postId} = ${posts.id}) +
      (SELECT COUNT(*) FROM ${postReactions} WHERE ${postReactions.postId} = ${posts.id})
    )`,
    commentCount: sql<number>`(SELECT COUNT(*) FROM ${comments} WHERE ${comments.postId} = ${posts.id})`,
  })
    .from(posts)
    .innerJoin(users, eq(posts.userId, users.id))
    .leftJoin(categories, eq(posts.categoryId, categories.id))
    .where(
      and(
        eq(posts.published, 1),
        or(
          like(posts.title, searchPattern),
          like(posts.content, searchPattern)
        )
      )
    )
    .orderBy(desc(posts.createdAt))
    .limit(limit);
}

// ============= COMMENT OPERATIONS =============

export async function createComment(data: InsertComment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const normalized: any = { ...data };
  // Allow parentId support: if null/undefined, set to null
  if (normalized.parentId === undefined) normalized.parentId = null;
  const [result] = await db.insert(comments).values(normalized).returning({ id: comments.id });
  const insertId = Number(result.id);
  
  // Log action
  await logAction({
    action: 'comment_created',
    userId: normalized.userId,
    targetType: 'comment',
    targetId: insertId,
    details: { postId: normalized.postId, parentId: normalized.parentId, contentLength: normalized.content?.length },
  });
  
  // If this is a top-level comment (no parent), notify post owner
  if (!normalized.parentId) {
    try {
      const postResults = await db.select().from(posts).where(eq(posts.id, normalized.postId)).limit(1);
      if (postResults.length > 0) {
        const postOwner = postResults[0];
        if (postOwner.userId !== normalized.userId) {
          await createNotification({ userId: postOwner.userId, type: 'comment', postId: normalized.postId, actorId: normalized.userId });
        }
      }
    } catch (err) {
      console.warn('[Notification] Failed to create comment notification', err);
    }
  }
  // If this comment is a reply, notify the parent comment owner
  if (normalized.parentId) {
    try {
      const parentCommentRes = await db.select().from(comments).where(eq(comments.id, normalized.parentId)).limit(1);
      if (parentCommentRes.length > 0) {
        const parentComment = parentCommentRes[0];
        if (parentComment.userId !== normalized.userId) {
          await createNotification({ userId: parentComment.userId, type: 'reply', postId: normalized.postId, actorId: normalized.userId });
        }
      }
    } catch (err) {
      console.warn('[Notification] Failed to create reply notification', err);
    }
  }
  return insertId;
}

export async function getCommentsByPostId(postId: number) {
  const db = await getDb();
  if (!db) return [];
  const replyCountExpr = sql<number>`(SELECT COUNT(*) FROM ${comments} AS sub WHERE sub.parentId = ${comments}.id)`;
  const reactionCountsExpr = sql<string>`(
    SELECT json_object(
      'heart', (SELECT COUNT(*) FROM ${commentReactions} AS cr WHERE cr.commentId = ${comments}.id AND cr.reactionType = 'heart'),
      'laugh', (SELECT COUNT(*) FROM ${commentReactions} AS cr WHERE cr.commentId = ${comments}.id AND cr.reactionType = 'laugh'),
      'ok', (SELECT COUNT(*) FROM ${commentReactions} AS cr WHERE cr.commentId = ${comments}.id AND cr.reactionType = 'ok'),
      'thumbs_down', (SELECT COUNT(*) FROM ${commentReactions} AS cr WHERE cr.commentId = ${comments}.id AND cr.reactionType = 'thumbs_down')
    )
  )`;
  
  return db.select({
    comment: comments,
    author: users,
    replyCount: replyCountExpr,
    reactionCounts: reactionCountsExpr,
  })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.postId, postId))
    .orderBy(desc(comments.createdAt));
}

export async function getRepliesByCommentId(commentId: number) {
  const db = await getDb();
  if (!db) return [];
  const reactionCountsExpr = sql<string>`(
    SELECT json_object(
      'heart', (SELECT COUNT(*) FROM ${commentReactions} AS cr WHERE cr.commentId = ${comments}.id AND cr.reactionType = 'heart'),
      'laugh', (SELECT COUNT(*) FROM ${commentReactions} AS cr WHERE cr.commentId = ${comments}.id AND cr.reactionType = 'laugh'),
      'ok', (SELECT COUNT(*) FROM ${commentReactions} AS cr WHERE cr.commentId = ${comments}.id AND cr.reactionType = 'ok'),
      'thumbs_down', (SELECT COUNT(*) FROM ${commentReactions} AS cr WHERE cr.commentId = ${comments}.id AND cr.reactionType = 'thumbs_down')
    )
  )`;
  
  return db.select({ 
    comment: comments, 
    author: users,
    reactionCounts: reactionCountsExpr,
  })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.parentId, commentId))
    .orderBy(desc(comments.createdAt));
}

export async function deleteComment(id: number) {
  const db = await getDb();
  if (!db) return;
  
  await db.delete(comments).where(eq(comments.id, id));
}

export async function getCommentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(comments).where(eq(comments.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============= COMMENT REACTION OPERATIONS =============

export async function addCommentReaction(data: InsertCommentReaction) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if user already reacted
  const existing = await db
    .select()
    .from(commentReactions)
    .where(and(
      eq(commentReactions.commentId, data.commentId),
      eq(commentReactions.userId, data.userId)
    ))
    .limit(1);

  if (existing.length > 0) {
    const existingReaction = existing[0];
    // If same reaction type, remove it (toggle off)
    if (existingReaction.reactionType === data.reactionType) {
      await db.delete(commentReactions).where(eq(commentReactions.id, existingReaction.id));
      return { removed: true };
    }
    // If different reaction type, update it
    await db
      .update(commentReactions)
      .set({ reactionType: data.reactionType })
      .where(eq(commentReactions.id, existingReaction.id));
    return { updated: true };
  }

  // Add new reaction
  const [result] = await db
    .insert(commentReactions)
    .values(data)
    .returning({ id: commentReactions.id });
  
  return { id: Number(result.id), created: true };
}

export async function getCommentReactionCounts(commentId: number) {
  const db = await getDb();
  if (!db) return { counts: { heart: 0, laugh: 0, ok: 0, thumbs_down: 0 }, total: 0 } as any;
  // Return counts for each supported emoji reaction
  const emojis = ['heart', 'laugh', 'ok', 'thumbs_down'];
  const counts: Record<string, number> = {};
  let total = 0;
  for (const e of emojis) {
    const res = await db
      .select({ count: count() })
      .from(commentReactions)
      .where(and(
        eq(commentReactions.commentId, commentId),
        eq(commentReactions.reactionType, e)
      ));
    const val = Number(res[0]?.count || 0);
    counts[e] = val;
    total += val;
  }

  return { counts, total } as any;
}

export async function getUserCommentReaction(commentId: number, userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(commentReactions)
    .where(and(
      eq(commentReactions.commentId, commentId),
      eq(commentReactions.userId, userId)
    ))
    .limit(1);

  return result.length > 0 ? result[0].reactionType : null;
}

// ============= POST REACTION OPERATIONS =============

export async function addPostReaction(data: InsertPostReaction) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(postReactions)
    .where(and(eq(postReactions.postId, data.postId), eq(postReactions.userId, data.userId)))
    .limit(1);

  if (existing.length > 0) {
    const existingReaction = existing[0];
    if (existingReaction.reactionType === data.reactionType) {
      await db.delete(postReactions).where(eq(postReactions.id, existingReaction.id));
      return { removed: true };
    }
    await db.update(postReactions).set({ reactionType: data.reactionType }).where(eq(postReactions.id, existingReaction.id));
    return { updated: true };
  }

  const [result] = await db.insert(postReactions).values(data).returning({ id: postReactions.id });
  return { id: Number(result.id), created: true };
}

export async function getPostReactionCounts(postId: number) {
  const db = await getDb();
  if (!db) return { counts: { heart: 0, laugh: 0, ok: 0, thumbs_down: 0 }, total: 0 } as any;
  const emojis = ['heart', 'laugh', 'ok', 'thumbs_down'];
  const counts: Record<string, number> = {};
  let total = 0;
  for (const e of emojis) {
    const res = await db.select({ count: count() }).from(postReactions).where(and(eq(postReactions.postId, postId), eq(postReactions.reactionType, e)));
    const val = Number(res[0]?.count || 0);
    counts[e] = val;
    total += val;
  }
  return { counts, total } as any;
}

export async function getUserPostReaction(postId: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(postReactions).where(and(eq(postReactions.postId, postId), eq(postReactions.userId, userId))).limit(1);
  return result.length > 0 ? result[0].reactionType : null;
}


// ============= LIKE OPERATIONS =============

export async function toggleLike(postId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await db.select()
    .from(likes)
    .where(and(eq(likes.postId, postId), eq(likes.userId, userId)))
    .limit(1);
  
  if (existing.length > 0) {
    await db.delete(likes).where(eq(likes.id, existing[0].id));
    await logAction({
      action: 'like_removed',
      userId,
      targetType: 'post',
      targetId: postId,
    });
    return { liked: false };
  } else {
    await db.insert(likes).values({ postId, userId });
    await logAction({
      action: 'like_added',
      userId,
      targetType: 'post',
      targetId: postId,
    });
    // notify post owner
    try {
      const postRes = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
      if (postRes.length > 0 && postRes[0].userId !== userId) {
        await createNotification({ userId: postRes[0].userId, type: 'like', postId, actorId: userId });
      }
    } catch (err) {
      console.warn('[Notification] Failed to create like notification', err);
    }
    return { liked: true };
  }
}

export async function getLikeCount(postId: number) {
  const db = await getDb();
  if (!db) return 0;
  
  // Count old likes
  const likesResult = await db.select({ count: sql<number>`count(*)` })
    .from(likes)
    .where(eq(likes.postId, postId));
  
  // Count new reactions (emoji)
  const reactionsResult = await db.select({ count: sql<number>`count(*)` })
    .from(postReactions)
    .where(eq(postReactions.postId, postId));
  
  return Number(likesResult[0]?.count || 0) + Number(reactionsResult[0]?.count || 0);
}

export async function getCommentCount(postId: number) {
  const db = await getDb();
  if (!db) return 0;
  
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(comments)
    .where(eq(comments.postId, postId));
  
  return Number(result[0]?.count || 0);
}

// ============= FOLLOW OPERATIONS =============

export async function isFollowingUser(followerId: number, followingId: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(follows).where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId))).limit(1);
  return result.length > 0;
}

export async function toggleFollow(followerId: number, followingId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (followerId === followingId) return { following: false };

  const exists = await isFollowingUser(followerId, followingId);
  if (exists) {
    await db.delete(follows).where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
    await logAction({
      action: 'user_unfollowed',
      userId: followerId,
      targetType: 'user',
      targetId: followingId,
    });
    return { following: false };
  }
  await db.insert(follows).values({ followerId, followingId });
  await logAction({
    action: 'user_followed',
    userId: followerId,
    targetType: 'user',
    targetId: followingId,
  });
  // create a follow notification for the followed user
  try {
    await createNotification({ userId: followingId, type: 'follow', actorId: followerId });
  } catch (err) {
    console.warn('[Notification] Failed to create follow notification', err);
  }
  return { following: true };
}

export async function getFollowersCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const res = await db.select({ count: sql<number>`count(*)`}).from(follows).where(eq(follows.followingId, userId));
  return Number(res[0]?.count || 0);
}

export async function getFollowingCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const res = await db.select({ count: sql<number>`count(*)`}).from(follows).where(eq(follows.followerId, userId));
  return Number(res[0]?.count || 0);
}

export async function getFollowingIdsForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const results = await db.select({ id: follows.followingId }).from(follows).where(eq(follows.followerId, userId));
  return results.map((r: any) => r.id);
}

export async function getFollowers(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const results = await db
    .select({
      follower: users,
      followedAt: follows.createdAt,
    })
    .from(follows)
    .innerJoin(users, eq(follows.followerId, users.id))
    .where(eq(follows.followingId, userId))
    .orderBy(desc(follows.createdAt));
  return results;
}

export async function getFollowing(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const results = await db
    .select({
      following: users,
      followedAt: follows.createdAt,
    })
    .from(follows)
    .innerJoin(users, eq(follows.followingId, users.id))
    .where(eq(follows.followerId, userId))
    .orderBy(desc(follows.createdAt));
  return results;
}

// ============= NOTIFICATION OPERATIONS =============

export async function createNotification(notification: { userId: number; type: string; postId?: number | null; actorId?: number | null; }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const res = await db.insert(notifications).values({
    userId: notification.userId,
    type: notification.type,
    postId: notification.postId ?? null,
    actorId: notification.actorId ?? null,
  });
  // Publish real-time notification to SSE listeners
  try {
    publishNotification(notification.userId, { userId: notification.userId, type: notification.type, postId: notification.postId, actorId: notification.actorId, id: Number((res as any).insertId || 0) });
  } catch (err) {
    console.warn('[Notification] Failed to publish SSE', err);
  }
  // Optionally send email if configured and user has an email
  try {
    if ((process.env.SEND_NOTIFICATION_EMAILS === '1' || ENV.sendNotificationEmails) && notification.userId) {
      const user = await db.select().from(users).where(eq(users.id, notification.userId)).limit(1);
      if (user.length > 0 && user[0].email) {
        const to = user[0].email;
        const subject = `New ${notification.type} on BLOZHIK`;
        const text = `${notification.type} notification from ${notification.actorId ?? 'someone'} on post ${notification.postId ?? ''}`;
        await sendNotificationEmail(to, subject, text);
      }
    }
  } catch (err) {
    console.warn('[Email] Failed to send notification email', err);
  }
  return Number((res as any).insertId || 0);
}

export async function getNotificationsForUser(userId: number, limit: number = 50, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];
  
  const results = await db
    .select({
      notification: notifications,
      actor: users,
      post: posts,
    })
    .from(notifications)
    .leftJoin(users, eq(notifications.actorId, users.id))
    .leftJoin(posts, eq(notifications.postId, posts.id))
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit)
    .offset(offset);
  
  return results;
}

export async function markNotificationRead(notificationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(notifications).set({ read: 1 }).where(eq(notifications.id, notificationId));
}

export async function markAllNotificationsRead(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(notifications).set({ read: 1 }).where(eq(notifications.userId, userId));
}

export async function deleteNotification(notificationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(notifications).where(eq(notifications.id, notificationId));
}

export async function deleteAllNotifications(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(notifications).where(eq(notifications.userId, userId));
}

export async function getUnreadNotificationCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const res = await db.select({ count: sql<number>`count(*)`}).from(notifications).where(and(eq(notifications.userId, userId), eq(notifications.read, 0)));
  return Number(res[0]?.count || 0);
}

// ============= BOOKMARK OPERATIONS =============

export async function addBookmark(userId: number, postId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(bookmarks).values({ userId, postId });
  const insertId = Number((result as any).insertId || 0);
  return insertId;
}

export async function removeBookmark(userId: number, postId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(bookmarks).where(and(eq(bookmarks.userId, userId), eq(bookmarks.postId, postId)));
}

export async function isPostBookmarkedByUser(userId: number, postId: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(bookmarks).where(and(eq(bookmarks.userId, userId), eq(bookmarks.postId, postId))).limit(1);
  return result.length > 0;
}

export async function getBookmarksForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const results = await db
    .select({
      post: posts,
      bookmarkedAt: bookmarks.createdAt,
      author: users,
    })
    .from(bookmarks)
    .innerJoin(posts, eq(bookmarks.postId, posts.id))
    .innerJoin(users, eq(posts.userId, users.id))
    .where(eq(bookmarks.userId, userId))
    .orderBy(desc(bookmarks.createdAt));
  return results;
}

// ============= CATEGORY OPERATIONS =============

export async function createCategory(data: { name: string; slug: string; description?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(categories).values(data).returning();
  return result;
}

export async function getCategoryBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const res = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  return res.length > 0 ? res[0] : undefined;
}

export async function getAllCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).orderBy(desc(categories.createdAt));
}

export async function getPopularCategories(limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  // Count posts per category
  const results = await db.select({ category: categories, postCount: sql<number>`(SELECT COUNT(*) FROM ${posts} WHERE ${posts.categoryId} = ${categories.id})`})
    .from(categories)
    .orderBy(desc(sql`(${sql<number>`(SELECT COUNT(*) FROM ${posts} WHERE ${posts.categoryId} = ${categories.id})`})`))
    .limit(limit);
  return results.map((r: any) => ({ category: r.category, postCount: Number(r.postCount) }));
}

export async function setPostCategory(postId: number, categoryId: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(posts).set({ categoryId: categoryId ?? null }).where(eq(posts.id, postId));
}

export async function getCategoryById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const res = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  return res.length > 0 ? res[0] : undefined;
}


export async function isPostLikedByUser(postId: number, userId: number) {
  const db = await getDb();
  if (!db) return false;
  
  const result = await db.select()
    .from(likes)
    .where(and(eq(likes.postId, postId), eq(likes.userId, userId)))
    .limit(1);
  
  return result.length > 0;
}

// ============= TAG OPERATIONS =============

export async function createTag(name: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  try {
    const result = await db.insert(tags).values({ name });
    const insertId = Number((result as any).insertId || 0);
    return insertId;
  } catch (error) {
    const existing = await db.select().from(tags).where(eq(tags.name, name)).limit(1);
    if (existing.length > 0) return existing[0].id;
    throw error;
  }
}

export async function getOrCreateTags(tagNames: string[]) {
  const db = await getDb();
  if (!db) return [];
  
  const tagIds: number[] = [];
  
  for (const name of tagNames) {
    const tagId = await createTag(name.toLowerCase().trim());
    tagIds.push(tagId);
  }
  
  return tagIds;
}

export async function addTagsToPost(postId: number, tagIds: number[]) {
  const db = await getDb();
  if (!db) return;
  
  await db.delete(postTags).where(eq(postTags.postId, postId));
  
  if (tagIds.length > 0) {
    await db.insert(postTags).values(
      tagIds.map(tagId => ({ postId, tagId }))
    );
  }
}

export async function getPostTags(postId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select({ tag: tags })
    .from(postTags)
    .innerJoin(tags, eq(postTags.tagId, tags.id))
    .where(eq(postTags.postId, postId));
}

export async function getPopularTags(limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select({
    tag: tags,
    postCount: sql<number>`count(${postTags.postId})`,
  })
    .from(tags)
    .leftJoin(postTags, eq(tags.id, postTags.tagId))
    .groupBy(tags.id)
    .orderBy(desc(sql<number>`count(${postTags.postId})`))
    .limit(limit);
}

export async function getTrendingTags(days: number = 7, limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  // calculate tag counts for posts in the last `days` days
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceIso = since.toISOString();
  // join postTags with posts to limit by recent posts
  const results = await db.select({ tag: tags, count: sql<number>`count(${postTags.postId})`})
    .from(tags)
    .innerJoin(postTags, eq(tags.id, postTags.tagId))
    .innerJoin(posts, eq(postTags.postId, posts.id))
    .where(and(eq(posts.published, 1), sql`${posts.createdAt} >= ${sinceIso}`))
    .groupBy(tags.id)
    .orderBy(desc(sql<number>`count(${postTags.postId})`))
    .limit(limit);
  return results.map((r: any) => ({ name: r.tag.name, id: r.tag.id, count: Number(r.count) }));
}

export async function getTagByName(name: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(tags).where(eq(tags.name, name)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getSimilarPosts(postId: number, limit: number = 4) {
  const db = await getDb();
  if (!db) return [];
  
  // Get tags for the current post
  const currentPostTags = await getPostTags(postId);
  if (currentPostTags.length === 0) return [];
  
  const tagIds = currentPostTags.map(pt => pt.tag.id);
  
  // Find posts that share tags, excluding current post
  const likeCountExpr = sql<number>`(
    (SELECT COUNT(*) FROM ${likes} WHERE ${likes.postId} = ${posts.id}) +
    (SELECT COUNT(*) FROM ${postReactions} WHERE ${postReactions.postId} = ${posts.id})
  )`;
  const commentCountExpr = sql<number>`(SELECT COUNT(*) FROM ${comments} WHERE ${comments.postId} = ${posts.id})`;
  
  const results = await db.select({
    post: posts,
    author: users,
    sharedTags: sql<number>`COUNT(DISTINCT ${postTags.tagId})`,
    likeCount: likeCountExpr,
    commentCount: commentCountExpr,
  })
    .from(posts)
    .innerJoin(users, eq(posts.userId, users.id))
    .innerJoin(postTags, eq(posts.id, postTags.postId))
    .where(and(
      eq(posts.published, 1),
      sql`${postTags.tagId} IN (${sql.join(tagIds.map(id => sql`${id}`), sql`, `)})`,
      sql`${posts.id} != ${postId}`
    ))
    .groupBy(posts.id)
    .limit(limit);
  
  return results;
}

// Admin functions
export async function getUsers(filters: { page?: number; limit?: number; search?: string; role?: string; banned?: boolean }) {
  const db = await getDb();
  if (!db) return { users: [], total: 0 };

  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const offset = (page - 1) * limit;

  let query = db.select({
    id: users.id,
    openId: users.openId,
    name: users.name,
    email: users.email,
    username: users.username,
    role: users.role,
    isBanned: users.isBanned,
    banReason: users.banReason,
    bannedAt: users.bannedAt,
    createdAt: users.createdAt,
    lastSignedIn: users.lastSignedIn,
  }).from(users);

  let whereConditions = [];

  if (filters.search) {
    whereConditions.push(or(
      like(users.name, `%${filters.search}%`),
      like(users.email, `%${filters.search}%`),
      like(users.username, `%${filters.search}%`)
    ));
  }

  if (filters.role) {
    whereConditions.push(eq(users.role, filters.role));
  }

  if (filters.banned !== undefined) {
    whereConditions.push(eq(users.isBanned, filters.banned ? 1 : 0));
  }

  if (whereConditions.length > 0) {
    const filteredConditions = whereConditions.filter(Boolean) as any[];
    query = query.where(and(...filteredConditions)) as any;
  }

  const usersList = await query.limit(limit).offset(offset).orderBy(desc(users.createdAt));
  const total = await db.select({ count: count() }).from(users);

  return { users: usersList, total: total[0].count };
}

export async function changeUserRole(userId: number, role: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(users).set({ role }).where(eq(users.id, userId));

  // Create audit log
  await createAuditLog('user_role_changed', userId, { role });
}

export async function getAuditLogs(filters: { page?: number; limit?: number; userId?: number; action?: string }) {
  const db = await getDb();
  if (!db) return { logs: [], total: 0 };

  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const offset = (page - 1) * limit;

  // JOIN with users table to get username
  const baseQuery = db
    .select({
      id: auditLogs.id,
      userId: auditLogs.userId,
      username: users.username,
      name: users.name,
      action: auditLogs.action,
      targetType: auditLogs.targetType,
      targetId: auditLogs.targetId,
      details: auditLogs.details,
      ipAddress: auditLogs.ipAddress,
      userAgent: auditLogs.userAgent,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.userId, users.id));

  let whereConditions = [];

  if (filters.userId) {
    whereConditions.push(eq(auditLogs.userId, filters.userId));
  }

  if (filters.action) {
    whereConditions.push(eq(auditLogs.action, filters.action));
  }

  let query: any = baseQuery;
  if (whereConditions.length > 0) {
    query = baseQuery.where(and(...whereConditions));
  }

  const logs = await query.limit(limit).offset(offset).orderBy(desc(auditLogs.createdAt));
  const total = await db.select({ count: count() }).from(auditLogs);

  return { logs, total: total[0].count };
}

export async function getAdminStatistics() {
  const db = await getDb();
  if (!db) return {};

  const userCount = await db.select({ count: count() }).from(users);
  const postCount = await db.select({ count: count() }).from(posts);
  const commentCount = await db.select({ count: count() }).from(comments);
  const reportCount = await db.select({ count: count() }).from(reports).where(eq(reports.status, 'open'));
  
  // Total likes count (old likes + new reactions)
  const likesCount = await db.select({ count: count() }).from(likes);
  const reactionsCount = await db.select({ count: count() }).from(postReactions);
  const totalLikes = Number(likesCount[0].count) + Number(reactionsCount[0].count);
  
  // Banned users count
  const bannedCount = await db.select({ count: count() }).from(users).where(eq(users.isBanned, true));
  
  // Active users in last 7 days (users who created posts, comments, or likes)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoIso = sevenDaysAgo.toISOString();
  
  const activeUsersFromPosts = await db.selectDistinct({ userId: posts.authorId }).from(posts).where(sql`${posts.createdAt} >= ${sevenDaysAgoIso}`);
  const activeUsersFromComments = await db.selectDistinct({ userId: comments.userId }).from(comments).where(sql`${comments.createdAt} >= ${sevenDaysAgoIso}`);
  const activeUsersFromLikes = await db.selectDistinct({ userId: likes.userId }).from(likes).where(sql`${likes.createdAt} >= ${sevenDaysAgoIso}`);
  
  const uniqueActiveUsers = new Set([
    ...activeUsersFromPosts.map(u => u.userId),
    ...activeUsersFromComments.map(u => u.userId),
    ...activeUsersFromLikes.map(u => u.userId)
  ]);
  
  // New users in last 7 days
  const newUsersCount = await db.select({ count: count() }).from(users).where(sql`${users.createdAt} >= ${sevenDaysAgoIso}`);

  return {
    totalUsers: userCount[0].count,
    totalPosts: postCount[0].count,
    totalComments: commentCount[0].count,
    totalLikes: totalLikes,
    pendingReports: reportCount[0].count,
    bannedUsers: bannedCount[0].count,
    activeUsersLast7Days: uniqueActiveUsers.size,
    newUsersLast7Days: newUsersCount[0].count,
  };
}

export async function getAdminStatsOverview() {
  // Returns simple overview stats
  return await getAdminStatistics();
}

export async function getAdminStatsUsers(days: number = 30) {
  const db = await getDb();
  if (!db) return { users: [], total: 0 };
  // new users per day for `days` period
  const since = new Date();
  since.setDate(since.getDate() - days + 1);
  const sinceIso = since.toISOString().slice(0, 10);

  const rows = await db.select({ date: sql<string>`strftime('%Y-%m-%d', ${users.createdAt})`, count: sql<number>`count(*)`})
    .from(users)
    .where(sql`${users.createdAt} >= ${sinceIso}`)
    .groupBy(sql`strftime('%Y-%m-%d', ${users.createdAt})`)
    .orderBy(sql`strftime('%Y-%m-%d', ${users.createdAt})`);

  return { users: rows };
}

export async function getAdminStatsContent(days: number = 30) {
  const db = await getDb();
  if (!db) return { posts: [], comments: [] };
  const since = new Date();
  since.setDate(since.getDate() - days + 1);
  const sinceIso = since.toISOString().slice(0,10);

  const postsRows = await db.select({ date: sql<string>`strftime('%Y-%m-%d', ${posts.createdAt})`, count: sql<number>`count(*)`})
    .from(posts)
    .where(sql`${posts.createdAt} >= ${sinceIso}`)
    .groupBy(sql`strftime('%Y-%m-%d', ${posts.createdAt})`)
    .orderBy(sql`strftime('%Y-%m-%d', ${posts.createdAt})`);

  const commentsRows = await db.select({ date: sql<string>`strftime('%Y-%m-%d', ${comments.createdAt})`, count: sql<number>`count(*)`})
    .from(comments)
    .where(sql`${comments.createdAt} >= ${sinceIso}`)
    .groupBy(sql`strftime('%Y-%m-%d', ${comments.createdAt})`)
    .orderBy(sql`strftime('%Y-%m-%d', ${comments.createdAt})`);

  return { posts: postsRows, comments: commentsRows };
}

export async function getAdminStatsEngagement(days: number = 30) {
  const db = await getDb();
  if (!db) return {};
  // avg likes and comments per post in the period
  const since = new Date();
  since.setDate(since.getDate() - days + 1);
  const sinceIso = since.toISOString();

  const totalPostsRes = await db.select({ totalPosts: sql<number>`count(*)` }).from(posts).where(sql`${posts.createdAt} >= ${sinceIso}`);
  const totalPosts = Number(totalPostsRes[0]?.totalPosts || 0);
  
  // Count both old likes and new reactions
  const totalLikesRes = await db.select({ totalLikes: sql<number>`count(*)` }).from(likes).innerJoin(posts, eq(likes.postId, posts.id)).where(sql`${posts.createdAt} >= ${sinceIso}`);
  const totalReactionsRes = await db.select({ totalReactions: sql<number>`count(*)` }).from(postReactions).innerJoin(posts, eq(postReactions.postId, posts.id)).where(sql`${posts.createdAt} >= ${sinceIso}`);
  const totalLikes = Number(totalLikesRes[0]?.totalLikes || 0) + Number(totalReactionsRes[0]?.totalReactions || 0);
  
  const totalCommentsRes = await db.select({ totalComments: sql<number>`count(*)` }).from(comments).innerJoin(posts, eq(comments.postId, posts.id)).where(sql`${posts.createdAt} >= ${sinceIso}`);
  const totalComments = Number(totalCommentsRes[0]?.totalComments || 0);

  return {
    avgLikesPerPost: totalPosts > 0 ? totalLikes / totalPosts : 0,
    avgCommentsPerPost: totalPosts > 0 ? totalComments / totalPosts : 0,
  };
}

export async function getPostsForAdmin(filters: { page?: number; limit?: number; search?: string; published?: boolean }) {
  const db = await getDb();
  if (!db) return { posts: [], total: 0 };

  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const offset = (page - 1) * limit;

  const likeCountExpr = sql<number>`(
    (SELECT COUNT(*) FROM ${likes} WHERE ${likes.postId} = ${posts.id}) +
    (SELECT COUNT(*) FROM ${postReactions} WHERE ${postReactions.postId} = ${posts.id})
  )`;
  const commentCountExpr = sql<number>`(SELECT COUNT(*) FROM ${comments} WHERE ${comments.postId} = ${posts.id})`;
  const viewCountExpr = sql<number>`(SELECT COALESCE(SUM(views), 0) FROM ${postViews} WHERE ${postViews.postId} = ${posts.id})`;

  let whereConditions = [];

  if (filters.search) {
    whereConditions.push(like(posts.title, `%${filters.search}%`));
  }

  if (filters.published !== undefined) {
    whereConditions.push(eq(posts.published, filters.published ? 1 : 0));
  }

  const baseQuery = db.select({
    id: posts.id,
    title: posts.title,
    published: posts.published,
    createdAt: posts.createdAt,
    userId: posts.userId,
    userName: users.name,
    likeCount: likeCountExpr,
    commentCount: commentCountExpr,
    viewCount: viewCountExpr,
    featured: posts.featured,
  }).from(posts).leftJoin(users, eq(posts.userId, users.id));

  let query: any = baseQuery;
  if (whereConditions.length > 0) {
    query = baseQuery.where(and(...whereConditions));
  }

  const postsList = await query.limit(limit).offset(offset).orderBy(desc(posts.createdAt));
  const totalRes = await db.select({ total: sql<number>`count(*)` }).from(posts);

  return { posts: postsList, total: Number(totalRes[0]?.total || 0) };
}

// Backwards-compatible wrapper called by router
export async function getPostsAdmin(filters: { page?: number; limit?: number; search?: string; published?: boolean; authorId?: number }) {
  // map filters if necessary
  return await getPostsForAdmin({ page: filters.page, limit: filters.limit, search: filters.search, published: filters.published });
}

export async function deletePostAdmin(postId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  console.log(`[deletePostAdmin] Deleting post ${postId}`);
  // Delete associated content and create audit log
  await deletePost(postId);
  // Создаем audit log
  await createAuditLog('post_deleted', null, { postId }, 'post', postId);
  console.log(`[deletePostAdmin] Post ${postId} deleted and audit log created`);
}

export async function featurePost(postId: number, featured: boolean) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.update(posts).set({ featured: featured ? 1 : 0 }).where(eq(posts.id, postId));
  await createAuditLog(featured ? 'post_featured' : 'post_unfeatured', postId, { featured });
}

export async function getCommentsAdmin(filters: { page?: number; limit?: number; postId?: number; authorId?: number; search?: string }) {
  const db = await getDb();
  if (!db) return { comments: [], total: 0 };
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const offset = (page - 1) * limit;

  let whereConditions = [];
  if (filters.postId) whereConditions.push(eq(comments.postId, filters.postId));
  if (filters.authorId) whereConditions.push(eq(comments.userId, filters.authorId));
  if (filters.search) whereConditions.push(like(comments.content, `%${filters.search}%`));

  const baseQuery = db.select({ 
    comment: comments, 
    author: users, 
    post: posts,
  })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .leftJoin(posts, eq(comments.postId, posts.id));

  let query: any = baseQuery;
  if (whereConditions.length > 0) {
    query = baseQuery.where(and(...whereConditions));
  }

  const list = await query.orderBy(desc(comments.createdAt)).limit(limit).offset(offset);
  
  // Get reports count for each comment
  const commentsWithReports = await Promise.all(list.map(async (item: any) => {
    const reportsCount = await db.select({ count: sql<number>`count(*)` })
      .from(reports)
      .where(and(
        eq(reports.targetType, 'comment'),
        eq(reports.targetId, item.comment.id),
        eq(reports.status, 'open')
      ));
    
    return {
      ...item,
      reportsCount: Number(reportsCount[0]?.count || 0),
    };
  }));
  
  const totalRes = await db.select({ total: sql<number>`count(*)` }).from(comments);
  return { comments: commentsWithReports, total: Number(totalRes[0]?.total || 0) };
}

export async function deleteCommentAdmin(commentId: number) {
  await deleteComment(commentId);
  await createAuditLog('comment_deleted', commentId, {});
}

// Announcements
export async function getAnnouncements() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(announcements).orderBy(desc(announcements.createdAt));
}

export async function getActiveAnnouncements(userId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  const now = new Date().toISOString();
  const allAnnouncements = await db.select().from(announcements).orderBy(desc(announcements.createdAt));
  
  // Filter active announcements
  return allAnnouncements.filter(announcement => {
    // Check date range
    const isActive = 
      (!announcement.startDate || announcement.startDate <= now) &&
      (!announcement.endDate || announcement.endDate >= now);
    
    if (!isActive) return false;
    
    // Check target audience
    if (announcement.targetAudience === 'all') return true;
    
    // Check if specific users are targeted
    if (announcement.targetUserIds) {
      try {
        const targetIds = JSON.parse(announcement.targetUserIds);
        if (Array.isArray(targetIds) && userId && targetIds.includes(userId)) {
          return true;
        }
      } catch (e) {
        console.error('Failed to parse targetUserIds', e);
      }
    }
    
    if (announcement.targetAudience === 'admins' && userId) {
      // TODO: check if user is admin
      return false; // For now, skip admin-only announcements in public API
    }
    if (announcement.targetAudience === 'new_users' && userId) {
      // TODO: check if user is new (e.g., created within last 7 days)
      return true;
    }
    
    return announcement.targetAudience === 'all';
  });
}

export async function createAnnouncement(input: { title: string; content: string; type: string; startDate?: string; endDate?: string; targetAudience?: string; targetUserIds?: string }) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const [result] = await db.insert(announcements).values(input).returning();
  await createAuditLog('announcement_created', result.id, { title: input.title });
  return result;
}

export async function updateAnnouncement(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.update(announcements).set(data).where(eq(announcements.id, id));
  await createAuditLog('announcement_updated', id, { data });
}

export async function deleteAnnouncement(id: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.delete(announcements).where(eq(announcements.id, id));
  await createAuditLog('announcement_deleted', id, {});
}

// Helper function for audit logs
export async function createAuditLog(
  action: string, 
  userId?: number | null, 
  details?: any,
  targetType?: string,
  targetId?: number
) {
  const db = await getDb();
  if (!db) return;

  await db.insert(auditLogs).values({
    action,
    userId: userId ?? null,
    targetType: targetType ?? null,
    targetId: targetId ?? null,
    details: JSON.stringify(details),
  });
}

// ============= REPORTS OPERATIONS =============

export async function createReport(data: Omit<InsertReport, 'id' | 'createdAt'>) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const result = await db.insert(reports).values(data).returning();
  return result[0];
}

export async function getReports(options: {
  status?: 'open' | 'resolved' | 'dismissed';
  targetType?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const { status, targetType, limit = 20, offset = 0 } = options;

  let conditions = [];
  if (status) conditions.push(eq(reports.status, status));
  if (targetType) conditions.push(eq(reports.targetType, targetType));

  const results = await db
    .select()
    .from(reports)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(reports.createdAt))
    .limit(limit)
    .offset(offset);

  return results;
}

export async function resolveReport(reportId: number, resolvedBy: number, action?: string) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  await db.update(reports)
    .set({
      status: 'resolved',
      resolvedBy,
      resolvedAt: new Date().toISOString(),
      action
    })
    .where(eq(reports.id, reportId));

  await createAuditLog('report_resolved', resolvedBy, { reportId, action });
}

export async function dismissReport(reportId: number, dismissedBy: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  await db.update(reports)
    .set({
      status: 'dismissed',
      resolvedBy: dismissedBy,
      resolvedAt: new Date().toISOString()
    })
    .where(eq(reports.id, reportId));

  await createAuditLog('report_dismissed', dismissedBy, { reportId });
}

// ============= BLOCKS OPERATIONS =============

export async function blockUser(userId: number, blockedUserId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Check if already blocked
  const existing = await db
    .select()
    .from(blocks)
    .where(and(eq(blocks.userId, userId), eq(blocks.blockedUserId, blockedUserId)))
    .limit(1);

  if (existing.length > 0) return existing[0];

  const result = await db.insert(blocks).values({ userId, blockedUserId }).returning();
  return result[0];
}

export async function unblockUser(userId: number, blockedUserId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  await db.delete(blocks)
    .where(and(eq(blocks.userId, userId), eq(blocks.blockedUserId, blockedUserId)));
}

export async function getBlockedUsers(userId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const results = await db
    .select()
    .from(blocks)
    .where(eq(blocks.userId, userId))
    .orderBy(desc(blocks.createdAt));

  return results;
}

export async function isBlocked(userId: number, blockedUserId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const result = await db
    .select()
    .from(blocks)
    .where(
      or(
        and(eq(blocks.userId, userId), eq(blocks.blockedUserId, blockedUserId)),
        and(eq(blocks.userId, blockedUserId), eq(blocks.blockedUserId, userId))
      )
    )
    .limit(1);

  return result.length > 0;
}

// ============= BADGES OPERATIONS =============

export async function getBadges() {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const results = await db.select().from(badges);
  return results;
}

export async function getUserBadges(userId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const results = await db
    .select({
      id: userBadges.id,
      badgeId: userBadges.badgeId,
      earnedAt: userBadges.earnedAt,
      name: badges.name,
      description: badges.description,
      icon: badges.icon,
    })
    .from(userBadges)
    .innerJoin(badges, eq(userBadges.badgeId, badges.id))
    .where(eq(userBadges.userId, userId))
    .orderBy(desc(userBadges.earnedAt));

  return results;
}

export async function awardBadge(userId: number, badgeId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Check if user already has this badge
  const existing = await db
    .select()
    .from(userBadges)
    .where(and(eq(userBadges.userId, userId), eq(userBadges.badgeId, badgeId)))
    .limit(1);

  if (existing.length > 0) return existing[0];

  const result = await db.insert(userBadges).values({ userId, badgeId }).returning();
  
  // Create notification
  await createNotification({
    userId,
    type: 'badge_earned',
    actorId: badgeId, // store badge id in actorId
  });

  return result[0];
}

export async function checkAndAwardBadges(userId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Get all badges and user's current badges
  const allBadges = await getBadges();
  const currentBadges = await getUserBadges(userId);
  const currentBadgeIds = new Set(currentBadges.map(b => b.badgeId));

  // Get user stats
  const userPosts = await db.select().from(posts).where(and(eq(posts.userId, userId), eq(posts.published, 1)));
  const userComments = await db.select().from(comments).where(eq(comments.userId, userId));
  const userLikes = await db
    .select({ count: count() })
    .from(likes)
    .innerJoin(posts, eq(likes.postId, posts.id))
    .where(eq(posts.userId, userId));

  const totalLikes = userLikes[0]?.count ?? 0;

  // Check each badge requirement
  for (const badge of allBadges) {
    if (currentBadgeIds.has(badge.id)) continue; // Already has it

    const req = JSON.parse(badge.requirement);
    let shouldAward = false;

    switch (req.type) {
      case 'posts_count':
        shouldAward = userPosts.length >= req.value;
        break;
      case 'comments_count':
        shouldAward = userComments.length >= req.value;
        break;
      case 'likes_received':
        shouldAward = totalLikes >= req.value;
        break;
      case 'followers_count':
        const followers = await db.select({ count: count() }).from(follows).where(eq(follows.followingId, userId));
        shouldAward = (followers[0]?.count ?? 0) >= req.value;
        break;
    }

    if (shouldAward) {
      await awardBadge(userId, badge.id);
    }
  }
}

// ============= BAN OPERATIONS =============

/**
 * Ban a user temporarily or permanently
 */
export async function banUser(
  userId: number,
  reason: string,
  days?: number, // undefined = permanent ban
  bannedBy?: number
) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const bannedAt = new Date().toISOString();
  const bannedUntil = days ? new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString() : null;

  await db.update(users)
    .set({
      isBanned: 1,
      banReason: reason,
      bannedAt,
      bannedUntil,
    })
    .where(eq(users.id, userId));

  // Log the ban
  await logAction({
    userId: bannedBy ?? null,
    action: 'user_banned',
    targetType: 'user',
    targetId: userId,
    details: { reason, days, bannedUntil, permanent: !days },
  });

  return { success: true, bannedUntil };
}

/**
 * Unban a user
 */
export async function unbanUser(userId: number, unbannedBy?: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  await db.update(users)
    .set({
      isBanned: 0,
      banReason: null,
      bannedAt: null,
      bannedUntil: null,
    })
    .where(eq(users.id, userId));

  // Log the unban
  await logAction({
    userId: unbannedBy ?? null,
    action: 'user_unbanned',
    targetType: 'user',
    targetId: userId,
    details: {},
  });

  return { success: true };
}

/**
 * Check if user is currently banned (handles expired bans)
 */
export async function checkUserBanStatus(userId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const user = await db.select({
    isBanned: users.isBanned,
    banReason: users.banReason,
    bannedAt: users.bannedAt,
    bannedUntil: users.bannedUntil,
  })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user[0] || !user[0].isBanned) {
    return { isBanned: false };
  }

  // Check if temporary ban has expired
  if (user[0].bannedUntil) {
    const expiryDate = new Date(user[0].bannedUntil);
    const now = new Date();
    
    if (now >= expiryDate) {
      // Auto-unban
      await unbanUser(userId);
      return { isBanned: false };
    }

    // Calculate remaining time
    const remainingMs = expiryDate.getTime() - now.getTime();
    const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
    const remainingHours = Math.ceil(remainingMs / (60 * 60 * 1000));
    const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));

    return {
      isBanned: true,
      isPermanent: false,
      reason: user[0].banReason,
      bannedAt: user[0].bannedAt,
      bannedUntil: user[0].bannedUntil,
      remainingMs,
      remainingDays,
      remainingHours,
      remainingMinutes,
    };
  }

  // Permanent ban
  return {
    isBanned: true,
    isPermanent: true,
    reason: user[0].banReason,
    bannedAt: user[0].bannedAt,
  };
}

/**
 * Get all active bans
 */
export async function getActiveBans() {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const bans = await db.select({
    userId: users.id,
    username: users.username,
    email: users.email,
    banReason: users.banReason,
    bannedAt: users.bannedAt,
    bannedUntil: users.bannedUntil,
  })
    .from(users)
    .where(eq(users.isBanned, 1));

  // Filter out expired bans
  const now = new Date();
  return bans.filter(ban => {
    if (!ban.bannedUntil) return true; // Permanent
    return new Date(ban.bannedUntil) > now;
  });
}


