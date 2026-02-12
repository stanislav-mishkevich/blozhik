import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import bcrypt from "bcryptjs";
import * as db from "./db";
import { users, categories, posts, comments, likes, commentReactions, follows, bookmarks, notifications, postVersions, reports } from "../drizzle/schema";
import { eq, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import MarkdownIt from "markdown-it";
import hljs from "markdown-it-highlightjs";
import { cache } from "./_core/cache";
import { logAction } from "./_core/auditLog";

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
}).use(hljs);

// Helper to generate excerpt from content
function generateExcerpt(content: string, maxLength: number = 150): string {
  const plainText = content.replace(/<[^>]*>/g, '').replace(/[#*_~`]/g, '');
  return plainText.length > maxLength 
    ? plainText.substring(0, maxLength).trim() + '...' 
    : plainText;
}

export const appRouter = router({
    analytics: router({
      postViews: publicProcedure
        .input(z.object({ postId: z.number(), days: z.number().optional() }))
        .query(async ({ input }) => {
          return await db.getViewsAggregated(input.postId, input.days ?? 30);
        }),
      topPosts: protectedProcedure
        .input(z.object({ days: z.number().optional(), limit: z.number().optional() }).optional())
        .query(async ({ ctx, input }) => {
          if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
          return await db.getTopPostsForUser(ctx.user.id, input?.days ?? 30, input?.limit ?? 3);
        }),
      authorViews: publicProcedure
        .input(z.object({ userId: z.number(), days: z.number().optional() }))
        .query(async ({ input }) => {
          return { views: await db.getViewsForUser(input.userId, input.days ?? 30) };
        }),
      topAuthors: publicProcedure
        .input(z.object({ days: z.number().optional(), limit: z.number().optional() }).optional())
        .query(async ({ input }) => {
          return await db.getTopAuthors(input?.days ?? 30, input?.limit ?? 3);
        }),
    }),
  system: systemRouter,
  
  // ============= AUTH ROUTER =============
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    
    logout: publicProcedure.mutation(async ({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      
      // Log logout
      if (ctx.user) {
        await logAction({
          action: 'user_logout',
          userId: ctx.user.id,
        });
      }
      
      return { success: true } as const;
    }),
    
    register: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(6),
        username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens and underscores'),
      }))
      .mutation(async ({ input }) => {
        const existingEmail = await db.getUserByEmail(input.email);
        if (existingEmail) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Email already registered' });
        }
        
        if (/\s/.test(input.username)) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Username cannot contain spaces' });
        }
        
        const existingUsername = await db.getUserByUsername(input.username);
        if (existingUsername) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Username already taken' });
        }
        
        const passwordHash = await bcrypt.hash(input.password, 10);
        const openId = `email_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        
        await db.upsertUser({
          openId,
          email: input.email,
          username: input.username,
          passwordHash,
          loginMethod: 'email',
        });
        
        // Get the created user to log with ID
        const newUser = await db.getUserByEmail(input.email);
        if (newUser) {
          await logAction({
            action: 'user_register',
            userId: newUser.id,
            details: { email: input.email, username: input.username },
          });
        }
        
        return { success: true };
      }),
    
    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = await db.getUserByEmail(input.email);
        if (!user || !user.passwordHash) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid credentials' });
        }
        
        const validPassword = await bcrypt.compare(input.password, user.passwordHash);
        if (!validPassword) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid credentials' });
        }
        
        // Create session token and set cookie
        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || user.username || "",
          expiresInMs: ONE_YEAR_MS,
        });
        
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        
        // Update last signed in
        await db.upsertUser({
          openId: user.openId,
          lastSignedIn: new Date().toISOString(),
        });
        
        // Log login
        await logAction({
          action: 'user_login',
          userId: user.id,
          details: { email: input.email },
        });
        
        return { 
          success: true,
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            name: user.name,
          }
        };
      }),
  }),
  
  // ============= USER ROUTER =============
  user: router({
    getProfile: publicProcedure
      .input(z.object({ 
        userId: z.number().optional(),
        username: z.string().optional(),
      }))
      .query(async ({ input, ctx }) => {
        let user;
        if (input.username) {
          user = await db.getUserByUsername(input.username);
        } else if (input.userId) {
          user = await db.getUserById(input.userId);
        }
        
        if (!user) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
        }
        
        const stats = await db.getUserStats(user.id);
        const followers = await db.getFollowersCount(user.id);
        const following = await db.getFollowingCount(user.id);
        const bookmarksCount = await db.getBookmarkCount(user.id);
        const viewsLast30d = await db.getViewsForUser(user.id, 30);
        
        const isFollowing = ctx.user ? await db.isFollowingUser(ctx.user.id, user.id) : false;
        return {
          id: user.id,
          username: user.username,
          name: user.name,
          bio: user.bio,
          avatarUrl: user.avatarUrl,
          createdAt: user.createdAt,
          stats,
          followers,
          following,
          bookmarks: bookmarksCount,
          views: viewsLast30d,
          isFollowing,
        };
      }),
    
    updateProfile: protectedProcedure
      .input(z.object({
        username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens and underscores').optional(),
        name: z.string().max(100).optional(),
        bio: z.string().max(500).optional(),
        avatarUrl: z.string().optional(), // Allow both URLs and data URLs
      }))
      .mutation(async ({ ctx, input }) => {
        if (input.username) {
          if (/\s/.test(input.username)) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'Username cannot contain spaces' });
          }
          
          const existing = await db.getUserByUsername(input.username);
          if (existing && existing.id !== ctx.user.id) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'Username already taken' });
          }
        }
        
        const updated = await db.updateUser(ctx.user.id, input);
        return updated;
      }),
    
    changePassword: protectedProcedure
      .input(z.object({
        oldPassword: z.string(),
        newPassword: z.string().min(6),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserById(ctx.user.id);
        if (!user || !user.passwordHash) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot change password' });
        }
        
        const validPassword = await bcrypt.compare(input.oldPassword, user.passwordHash);
        if (!validPassword) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid old password' });
        }
        
        const newPasswordHash = await bcrypt.hash(input.newPassword, 10);
        await db.updateUser(ctx.user.id, { passwordHash: newPasswordHash });
        
        return { success: true };
      }),
      getAvatarUploadUrl: protectedProcedure
        .input(z.object({ contentType: z.string().optional() }))
        .mutation(async ({ ctx, input }) => {
          const key = `avatars/${ctx.user.id}/${Date.now()}`;
          try {
            const url = await (await import('./_core/s3')).getSignedUploadUrl(key, input.contentType ?? 'image/png');
            return { url, key };
          } catch (error) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'S3 not configured' });
          }
        }),
  }),

  // ============= FOLLOW ROUTER =============
  follow: router({
    toggle: protectedProcedure
      .input(z.object({ followingId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const result = await db.toggleFollow(ctx.user.id, input.followingId);
        return result;
      }),
    getCounts: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        const followers = await db.getFollowersCount(input.userId);
        const following = await db.getFollowingCount(input.userId);
        return { followers, following };
      }),
    isFollowing: publicProcedure
      .input(z.object({ followerId: z.number(), followingId: z.number() }))
      .query(async ({ input }) => {
        return { isFollowing: await db.isFollowingUser(input.followerId, input.followingId) };
      }),
    getFollowers: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        const followers = await db.getFollowers(input.userId);
        return followers;
      }),
    getFollowing: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        const following = await db.getFollowing(input.userId);
        return following;
      }),
  }),
  
  // ============= POST ROUTER =============
  post: router({
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1).max(200),
        content: z.string().min(1),
        contentType: z.enum(['plaintext', 'markdown']),
        tags: z.array(z.string()).max(10),
        published: z.boolean().default(false),
        categoryId: z.number().nullable().optional(),
        scheduledAt: z.string().nullable().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const excerpt = generateExcerpt(input.content);
        
        const postId = await db.createPost({
          userId: ctx.user.id,
          title: input.title,
          content: input.content,
          contentType: input.contentType,
          excerpt,
          published: input.published ? 1 : 0,
          categoryId: input.categoryId ?? null,
          scheduledAt: input.scheduledAt ?? null,
        });
        
        if (input.tags.length > 0) {
          const tagIds = await db.getOrCreateTags(input.tags);
          await db.addTagsToPost(postId, tagIds);
        }
        
        // Check and award badges
        await db.checkAndAwardBadges(ctx.user.id);
        
        return { postId };
      }),
    
    update: protectedProcedure
      .input(z.object({
        postId: z.number(),
        title: z.string().min(1).max(200).optional(),
        content: z.string().min(1).optional(),
        contentType: z.enum(['plaintext', 'markdown']).optional(),
        tags: z.array(z.string()).max(10).optional(),
        published: z.boolean().optional(),
        categoryId: z.number().nullable().optional(),
        scheduledAt: z.string().nullable().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const post = await db.getPostById(input.postId);
        if (!post) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Post not found' });
        }
        if (post.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
        }
        
        const updateData: any = {};
        if (input.title !== undefined) updateData.title = input.title;
        if (input.content !== undefined) {
          updateData.content = input.content;
          updateData.excerpt = generateExcerpt(input.content);
        }
        if (input.contentType !== undefined) updateData.contentType = input.contentType;
        if (input.published !== undefined) updateData.published = input.published ? 1 : 0;
        if (input.categoryId !== undefined) {
          updateData.categoryId = input.categoryId === null ? null : input.categoryId;
        }
        if (input.scheduledAt !== undefined) {
          updateData.scheduledAt = input.scheduledAt === null ? null : input.scheduledAt;
        }
        
        // Убедимся, что в updateData нет undefined значений
        Object.keys(updateData).forEach(key => {
          if (updateData[key] === undefined) {
            delete updateData[key];
          }
        });
        
        await db.updatePost(input.postId, updateData);
        
        if (input.tags) {
          const tagIds = await db.getOrCreateTags(input.tags);
          await db.addTagsToPost(input.postId, tagIds);
        }
        
        // Check and award badges if published
        if (input.published) {
          await db.checkAndAwardBadges(ctx.user.id);
        }
        
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ postId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const post = await db.getPostById(input.postId);
        if (!post) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Post not found' });
        }
        if (post.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
        }
        
        await db.deletePost(input.postId);
        return { success: true };
      }),
    
    getById: publicProcedure
      .input(z.object({ postId: z.number() }))
      .query(async ({ input, ctx }) => {
        const post = await db.getPostById(input.postId);
        if (!post) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Post not found' });
        }
        
        const author = await db.getUserById(post.userId);
        const tags = await db.getPostTags(post.id);
        const category = post.categoryId ? await db.getCategoryById(post.categoryId) : null;
        const likeCount = await db.getLikeCount(post.id);
        const commentCount = await db.getCommentCount(post.id);
        const isLiked = ctx.user ? await db.isPostLikedByUser(post.id, ctx.user.id) : false;
        const isBookmarked = ctx.user ? await db.isPostBookmarkedByUser(ctx.user.id, post.id) : false;
        
        let renderedContent = post.content;
        // Render markdown for both markdown and plaintext (plaintext uses basic markdown formatting)
        if (post.contentType === 'markdown' || post.contentType === 'plaintext') {
          renderedContent = md.render(post.content);
        }
        
        // Record a page view for analytics (best effort)
        try { await db.addPageView(post.id); } catch (err) { console.warn('[Analytics] Failed to add page view', err); }
        // Post reaction counts and user's reaction (emoji)
        const postReactionCounts = await db.getPostReactionCounts(post.id);
        const userPostReaction = ctx.user ? await db.getUserPostReaction(post.id, ctx.user.id) : null;

        return {
          post: { ...post, renderedContent, published: Boolean(post.published) },
          author,
          tags: tags.map(t => t.tag),
          likeCount,
          commentCount,
          isLiked,
          isBookmarked,
          reactionCounts: postReactionCounts.counts,
          reactionTotal: postReactionCounts.total,
          userReaction: userPostReaction,
          category,
          readingTime: await db.estimateReadingTime(post.content, post.contentType),
        };
      }),
    // Post reactions (emoji)
    react: protectedProcedure
      .input(z.object({ postId: z.number(), reactionType: z.enum(['heart', 'laugh', 'ok', 'thumbs_down']) }))
      .mutation(async ({ ctx, input }) => {
        const post = await db.getPostById(input.postId);
        if (!post) throw new TRPCError({ code: 'NOT_FOUND', message: 'Post not found' });
        const result = await db.addPostReaction({ postId: input.postId, userId: ctx.user.id, reactionType: input.reactionType } as any);
        const counts = await db.getPostReactionCounts(input.postId);
        return { ...result, counts };
      }),

    getReaction: publicProcedure
      .input(z.object({ postId: z.number(), userId: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        const userId = input.userId ?? ctx.user?.id;
        if (!userId) return { reaction: null };
        const reaction = await db.getUserPostReaction(input.postId, userId);
        return { reaction };
      }),
    
    getSimilar: publicProcedure
      .input(z.object({ postId: z.number(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        const results = await db.getSimilarPosts(input.postId, input.limit || 4);
        
        const postsWithDetails = await Promise.all(results.map(async (result) => {
          const tags = await db.getPostTags(result.post.id);
          
          return {
            post: { ...result.post, published: Boolean(result.post.published) },
            author: result.author,
            tags: tags.map(t => t.tag),
            likeCount: Number(result.likeCount),
            commentCount: Number(result.commentCount),
            readingTime: await db.estimateReadingTime(result.post.content, result.post.contentType),
          };
        }));
        
        return postsWithDetails;
      }),
    
    getFeed: publicProcedure
      .input(z.object({
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
        sortBy: z.enum(['new', 'popular', 'trending']).default('new'),
        tagId: z.number().optional(),
        followingOnly: z.boolean().optional(),
        categoryId: z.number().optional(),
      }))
      .query(async ({ input, ctx }) => {
        // Cache trending posts for 1 hour
        const cacheKey = `trending:${input.sortBy}:${input.tagId || 'all'}:${input.categoryId || 'all'}:${input.limit}:${input.offset}`;
        
        if (input.sortBy === 'trending' && !input.followingOnly) {
          const cached = cache.get<any[]>(cacheKey);
          if (cached) {
            return cached;
          }
        }
        
        const results = await db.getPublishedPosts({
          limit: input.limit,
          offset: input.offset,
          sortBy: input.sortBy,
          tagId: input.tagId,
          categoryId: input.categoryId,
        });
        // If followingOnly, filter posts by authors the current user follows
        let filteredResults = results;
        if (input.followingOnly && ctx.user) {
          const followedIds = await db.getFollowingIdsForUser(ctx.user.id);
          filteredResults = results.filter(r => followedIds.includes(r.author.id));
        }
        
        const postsWithDetails = await Promise.all(filteredResults.map(async (result) => {
          const tags = await db.getPostTags(result.post.id);
          const isLiked = ctx.user ? await db.isPostLikedByUser(result.post.id, ctx.user.id) : false;
          const isBookmarked = ctx.user ? await db.isPostBookmarkedByUser(ctx.user.id, result.post.id) : false;
          
          return {
            post: { ...result.post, published: Boolean(result.post.published) },
            author: result.author,
            tags: tags.map(t => t.tag),
            likeCount: Number(result.likeCount),
            commentCount: Number(result.commentCount),
            isLiked,
            isBookmarked,
            readingTime: await db.estimateReadingTime(result.post.content, result.post.contentType),
          };
        }));
        
        // Cache trending results
        if (input.sortBy === 'trending' && !input.followingOnly) {
          cache.set(cacheKey, postsWithDetails, 60); // Cache for 60 minutes
        }
        
        return postsWithDetails;
      }),
    
    getUserPosts: publicProcedure
      .input(z.object({ 
        userId: z.number(),
        includeUnpublished: z.boolean().default(false),
      }))
      .query(async ({ input, ctx }) => {
        const canSeeUnpublished = ctx.user?.id === input.userId;
        const posts = await db.getUserPosts(
          input.userId, 
          input.includeUnpublished && canSeeUnpublished
        );
        
        return posts;
      }),
    getViews: publicProcedure
      .input(z.object({ postId: z.number(), days: z.number().optional() }))
      .query(async ({ input }) => {
        return await db.getPostViews(input.postId, input.days ?? 30);
      }),
      getVersions: publicProcedure
        .input(z.object({ postId: z.number() }))
        .query(async ({ input }) => {
          return await db.getPostVersions(input.postId);
        }),
      revertToVersion: protectedProcedure
        .input(z.object({ postId: z.number(), versionId: z.number() }))
        .mutation(async ({ ctx, input }) => {
          const post = await db.getPostById(input.postId);
          if (!post) throw new TRPCError({ code: 'NOT_FOUND', message: 'Post not found' });
          if (post.userId !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
          const versions = await db.getPostVersions(input.postId);
          const version = versions.find((v: any) => v.id === input.versionId);
          if (!version) throw new TRPCError({ code: 'NOT_FOUND', message: 'Version not found' });
          // create current version before reverting
          await db.createPostVersion(post.id, ctx.user.id);
          // update post with version data
          await db.updatePost(post.id, { 
            title: version.title ?? undefined, 
            content: version.content ?? undefined, 
            contentType: version.contentType ?? undefined 
          });
          return { success: true };
        }),
    grammarCheck: publicProcedure
      .input(z.object({ text: z.string(), language: z.string().optional() }))
      .query(async ({ input }) => {
        try {
          const { checkGrammar } = await import('./_core/grammar');
          const data = await checkGrammar(input.text, input.language ?? 'en-US');
          return data;
        } catch (err) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Grammar check failed' });
        }
      }),
    getDiff: publicProcedure
      .input(z.object({ postId: z.number(), versionId: z.number().optional() }))
      .query(async ({ input }) => {
        try {
          const { postId, versionId } = input;
          const post = await db.getPostById(postId);
          if (!post) throw new TRPCError({ code: 'NOT_FOUND', message: 'Post not found' });
          if (!versionId) {
            // diff between the latest stored version and current
            const versions = await db.getPostVersions(postId);
            if (!versions || versions.length === 0) return { diff: '' };
            const latest = versions[0];
            const baseContent = latest.content || '';
            const headContent = post.content || '';
            const { createPatch } = await import('diff') as any;
            const patch = createPatch(`post-${postId}`, baseContent, headContent, latest.createdAt, post.updatedAt);
            return { diff: patch };
          } else {
            const base = await db.getPostVersions(postId);
            const baseV = base.find((v: any) => v.id === versionId);
            if (!baseV) throw new TRPCError({ code: 'NOT_FOUND', message: 'Version not found' });
            const head = await db.getPostVersions(postId);
            const headV = head[0];
            const baseContent = baseV.content || '';
            const headContent = headV ? (headV.content || '') : '';
            const { createPatch } = await import('diff') as any;
            const patch = createPatch(`post-${postId}`, baseContent, headContent, baseV.createdAt, headV?.createdAt || 'HEAD');
            return { diff: patch };
          }
        } catch (err) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to compute diff' });
        }
      }),
    saveDraft: protectedProcedure
      .input(z.object({
        postId: z.number().optional(),
        title: z.string().optional(),
        content: z.string().optional(),
        contentType: z.enum(['plaintext', 'markdown']).optional(),
        tags: z.array(z.string()).optional(),
        categoryId: z.number().nullable().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
        const postId = await db.saveDraft({
          postId: input.postId,
          userId: ctx.user.id,
          title: input.title ?? '',
          content: input.content ?? '',
          contentType: input.contentType ?? 'markdown',
          categoryId: input.categoryId ?? null,
        });
        if (input.tags && input.tags.length > 0) {
          const tagIds = await db.getOrCreateTags(input.tags);
          await db.addTagsToPost(postId, tagIds);
        }
        return { postId };
      }),
    getDrafts: protectedProcedure
      .input(z.object({ limit: z.number().optional(), offset: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
        const limit = input?.limit ?? 20;
        const offset = input?.offset ?? 0;
        return db.getDraftsForUser(ctx.user.id, limit, offset);
      }),
    getImageUploadUrl: protectedProcedure
      .input(z.object({ contentType: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const key = `post-images/${ctx.user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}`;
        try {
          const url = await (await import('./_core/s3')).getSignedUploadUrl(key, input.contentType ?? 'image/jpeg');
          return { url, key };
        } catch (error) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'S3 not configured' });
        }
      }),
  }),
  
  // ============= COMMENT ROUTER =============
  comment: router({
    create: protectedProcedure
      .input(z.object({
        postId: z.number(),
        content: z.string().min(1).max(1000),
        parentId: z.number().nullable().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const post = await db.getPostById(input.postId);
        if (!post) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Post not found' });
        }
        
        const commentId = await db.createComment({
          postId: input.postId,
          userId: ctx.user.id,
          content: input.content,
          parentId: input.parentId ?? null,
        } as any);
        
        // Check and award badges
        await db.checkAndAwardBadges(ctx.user.id);
        
        return { commentId };
      }),
    
    delete: protectedProcedure
      .input(z.object({ commentId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const comment = await db.getCommentById(input.commentId);
        if (!comment) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Comment not found' });
        }
        
        const post = await db.getPostById(comment.postId);
        const isAuthor = comment.userId === ctx.user.id;
        const isPostOwner = post?.userId === ctx.user.id;
        
        if (!isAuthor && !isPostOwner) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
        }
        
        await db.deleteComment(input.commentId);
        return { success: true };
      }),
    
    getByPostId: publicProcedure
      .input(z.object({ postId: z.number() }))
      .query(async ({ input }) => {
        const comments = await db.getCommentsByPostId(input.postId);
        return comments;
      }),
    getReplies: publicProcedure
      .input(z.object({ parentId: z.number() }))
      .query(async ({ input }) => {
        const replies = await db.getRepliesByCommentId(input.parentId);
        return replies;
      }),
    
    // Comment reactions (emoji reactions)
    react: protectedProcedure
      .input(z.object({ 
        commentId: z.number(),
        reactionType: z.enum(['heart', 'laugh', 'ok', 'thumbs_down'])
      }))
      .mutation(async ({ ctx, input }) => {
        const comment = await db.getCommentById(input.commentId);
        if (!comment) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Comment not found' });
        }
        
        const result = await db.addCommentReaction({
          commentId: input.commentId,
          userId: ctx.user.id,
          reactionType: input.reactionType
        } as any);
        const counts = await db.getCommentReactionCounts(input.commentId);
        return { ...result, counts };
      }),
    
    getReaction: publicProcedure
      .input(z.object({ 
        commentId: z.number(),
        userId: z.number().optional()
      }))
      .query(async ({ ctx, input }) => {
        const userId = input.userId ?? ctx.user?.id;
        if (!userId) return { reaction: null };
        
        const reaction = await db.getUserCommentReaction(input.commentId, userId);
        return { reaction };
      }),
  }),
  
  // ============= LIKE ROUTER =============
  like: router({
    toggle: protectedProcedure
      .input(z.object({ postId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const post = await db.getPostById(input.postId);
        if (!post) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Post not found' });
        }
        
        const result = await db.toggleLike(input.postId, ctx.user.id);
        const likeCount = await db.getLikeCount(input.postId);
        
        // Check and award badges for the post author
        if (post.userId) {
          await db.checkAndAwardBadges(post.userId);
        }
        
        return { ...result, likeCount };
      }),
  }),

  // ============= BOOKMARK ROUTER =============
  bookmark: router({
    toggle: protectedProcedure
      .input(z.object({ postId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const isBookmarked = await db.isPostBookmarkedByUser(ctx.user.id, input.postId);
        if (isBookmarked) {
          await db.removeBookmark(ctx.user.id, input.postId);
          return { bookmarked: false };
        } else {
          await db.addBookmark(ctx.user.id, input.postId);
          return { bookmarked: true };
        }
      }),
    list: publicProcedure
      .input(z.object({ userId: z.number().optional() }))
      .query(async ({ input, ctx }) => {
        const userId = input.userId ?? ctx.user?.id;
        if (!userId) throw new TRPCError({ code: 'BAD_REQUEST', message: 'userId is required' });
        return await db.getBookmarksForUser(userId);
      }),
  }),

  // ============= ANNOUNCEMENT ROUTER (PUBLIC) =============
  announcement: router({
    getActive: publicProcedure
      .query(async ({ ctx }) => {
        return await db.getActiveAnnouncements(ctx.user?.id);
      }),
  }),
  
  // ============= TAG ROUTER =============
  tag: router({
    getPopular: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(50).default(10) }))
      .query(async ({ input }) => {
        const tags = await db.getPopularTags(input.limit);
        return tags;
      }),
    
    getByName: publicProcedure
      .input(z.object({ name: z.string() }))
      .query(async ({ input }) => {
        const tag = await db.getTagByName(input.name);
        return tag;
      }),
    getTrending: publicProcedure
      .input(z.object({ days: z.number().optional(), limit: z.number().optional() }).optional())
      .query(async ({ input }) => {
        const days = input?.days ?? 7;
        const limit = input?.limit ?? 10;
        return await db.getTrendingTags(days, limit);
      }),
  }),

  // ============= CATEGORY ROUTER =============
  category: router({
    create: protectedProcedure
      .input(z.object({ name: z.string(), slug: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const category = await db.createCategory(input);
        return { id: category.id };
      }),
    list: publicProcedure
      .query(async () => {
        return await db.getAllCategories();
      }),
    getPopular: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(50).default(10) }))
      .query(async ({ input }) => {
        return await db.getPopularCategories(input.limit);
      }),
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const category = await db.getCategoryBySlug(input.slug);
        if (!category) throw new TRPCError({ code: 'NOT_FOUND', message: 'Category not found' });
        return category;
      }),
    setPostCategory: protectedProcedure
      .input(z.object({ postId: z.number(), categoryId: z.number().nullable() }))
      .mutation(async ({ ctx, input }) => {
        const post = await db.getPostById(input.postId);
        if (!post) throw new TRPCError({ code: 'NOT_FOUND', message: 'Post not found' });
        if (post.userId !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
        await db.setPostCategory(input.postId, input.categoryId);
        return { success: true };
      }),
  }),

  // ============= NOTIFICATION ROUTER =============
  notification: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().optional(), offset: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        const limit = input.limit ?? 50;
        const offset = input.offset ?? 0;
        return await db.getNotificationsForUser(ctx.user.id, limit, offset);
      }),
    markRead: protectedProcedure
      .input(z.object({ notificationId: z.number() }))
      .mutation(async ({ input }) => {
        await db.markNotificationRead(input.notificationId);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ notificationId: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteNotification(input.notificationId);
        return { success: true };
      }),
    unreadCount: protectedProcedure
      .query(async ({ ctx }) => {
        return { count: await db.getUnreadNotificationCount(ctx.user.id) };
      }),
    clearAll: protectedProcedure
      .mutation(async ({ ctx }) => {
        await db.deleteAllNotifications(ctx.user.id);
        return { success: true };
      }),
  }),
  
  // ============= SEARCH ROUTER =============
  search: router({
    posts: publicProcedure
      .input(z.object({
        query: z.string().min(1),
        limit: z.number().min(1).max(50).default(20),
      }))
      .query(async ({ input, ctx }) => {
        const results = await db.searchPosts(input.query, input.limit);
        
        const postsWithDetails = await Promise.all(results.map(async (result) => {
          const tags = await db.getPostTags(result.post.id);
          const isLiked = ctx.user ? await db.isPostLikedByUser(result.post.id, ctx.user.id) : false;
          
          return {
            post: result.post,
            author: result.author,
            tags: tags.map(t => t.tag),
            likeCount: Number(result.likeCount),
            commentCount: Number(result.commentCount),
            isLiked,
          };
        }));
        
        return postsWithDetails;
      }),
  }),

  // Admin panel routers
  admin: router({
    // User Management
    users: router({
      list: adminProcedure
        .input(z.object({
          role: z.string().optional(),
          status: z.enum(['active', 'banned', 'inactive']).optional(),
          limit: z.number().optional().default(50),
          offset: z.number().optional().default(0),
          search: z.string().optional(),
        }))
        .query(async ({ ctx, input }) => {
          return await db.getUsers(input);
        }),
      get: adminProcedure
        .input(z.object({ id: z.number() }))
        .query(async ({ ctx, input }) => {
          return await db.getUserById(input.id);
        }),
      create: adminProcedure
        .input(z.object({
          username: z.string().min(3).max(30),
          email: z.string().email(),
          password: z.string().min(8),
          name: z.string().optional(),
          bio: z.string().optional(),
          role: z.enum(['user', 'moderator', 'admin', 'superadmin', 'god']).default('user'),
        }))
        .mutation(async ({ ctx, input }) => {
          // Проверка прав: только superadmin и god могут создавать пользователей
          if (ctx.user.role !== 'superadmin' && ctx.user.role !== 'god') {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'Only super admins can create users' });
          }
          
          // God может создавать любые роли, superadmin - только до admin включительно
          if (input.role === 'superadmin' || input.role === 'god') {
            if (ctx.user.role !== 'god') {
              throw new TRPCError({ code: 'FORBIDDEN', message: 'Only god can create superadmins' });
            }
          }

          const passwordHash = await bcrypt.hash(input.password, 10);
          
          const dbConn = await db.getDb();
          if (!dbConn) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });

          const [newUser] = await dbConn.insert(users).values({
            username: input.username,
            email: input.email,
            passwordHash,
            name: input.name,
            bio: input.bio,
            role: input.role,
            openId: `local-${input.username}`,
            loginMethod: 'password',
          }).returning();

          await db.createAuditLog('user_created', ctx.user.id, {
            targetUserId: newUser.id,
            username: input.username,
            role: input.role,
          });

          return { success: true, userId: newUser.id };
        }),
      updateRole: adminProcedure
        .input(z.object({ userId: z.number(), role: z.string() }))
        .mutation(async ({ ctx, input }) => {
          await db.updateUser(input.userId, { role: input.role });
          return { success: true };
        }),
      ban: adminProcedure
        .input(z.object({ userId: z.number(), reason: z.string().optional() }))
        .mutation(async ({ ctx, input }) => {
          // TODO: Log to audit
          return await db.banUser(input.userId, input.reason || 'No reason provided');
        }),
      unban: adminProcedure
        .input(z.object({ userId: z.number() }))
        .mutation(async ({ ctx, input }) => {
          // TODO: Log to audit
          return await db.unbanUser(input.userId);
        }),
      delete: adminProcedure
        .input(z.object({ userId: z.number() }))
        .mutation(async ({ ctx, input }) => {
          const dbConn = await db.getDb();
          if (!dbConn) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
          
          console.log(`[admin.users.delete] Starting deletion for user ${input.userId}`);
          
          try {
            // 1. Получаем все посты пользователя и удаляем их каскадно
            const userPosts = await dbConn.select({ id: posts.id }).from(posts).where(eq(posts.userId, input.userId));
            console.log(`[admin.users.delete] Found ${userPosts.length} posts to delete`);
            for (const post of userPosts) {
              await db.deletePost(post.id); // Использует каскадное удаление
            }
            
            // 2. Удаляем комментарии пользователя (и реакции на них)
            const userComments = await dbConn.select({ id: comments.id }).from(comments).where(eq(comments.userId, input.userId));
            const commentIds = userComments.map(c => c.id);
            console.log(`[admin.users.delete] Found ${commentIds.length} comments to delete`);
            if (commentIds.length > 0) {
              await dbConn.delete(commentReactions).where(inArray(commentReactions.commentId, commentIds));
            }
            await dbConn.delete(comments).where(eq(comments.userId, input.userId));
            
            // 3. Удаляем лайки пользователя
            await dbConn.delete(likes).where(eq(likes.userId, input.userId));
            console.log(`[admin.users.delete] Deleted likes`);
            
            // 4. Удаляем реакции пользователя на комментарии
            await dbConn.delete(commentReactions).where(eq(commentReactions.userId, input.userId));
            console.log(`[admin.users.delete] Deleted comment reactions`);
            
            // 5. Удаляем подписки (где пользователь подписчик)
            await dbConn.delete(follows).where(eq(follows.followerId, input.userId));
            console.log(`[admin.users.delete] Deleted follows (as follower)`);
            
            // 6. Удаляем подписки (где пользователь автор)
            await dbConn.delete(follows).where(eq(follows.followingId, input.userId));
            console.log(`[admin.users.delete] Deleted follows (as following)`);
            
            // 7. Удаляем закладки пользователя
            await dbConn.delete(bookmarks).where(eq(bookmarks.userId, input.userId));
            console.log(`[admin.users.delete] Deleted bookmarks`);
            
            // 8. Удаляем уведомления для пользователя
            await dbConn.delete(notifications).where(eq(notifications.userId, input.userId));
            console.log(`[admin.users.delete] Deleted notifications`);
            
            // 9. Удаляем версии постов пользователя
            await dbConn.delete(postVersions).where(eq(postVersions.userId, input.userId));
            console.log(`[admin.users.delete] Deleted post versions`);
            
            // 10. Удаляем репорты от пользователя
            await dbConn.delete(reports).where(eq(reports.userId, input.userId));
            console.log(`[admin.users.delete] Deleted reports`);
            
            // 11. postViews не имеет userId - пропускаем
            // 12. Audit logs НЕ удаляем - они должны сохраниться для истории
            
            // 13. Наконец удаляем самого пользователя
            await dbConn.delete(users).where(eq(users.id, input.userId));
            console.log(`[admin.users.delete] User ${input.userId} deleted successfully`);
            
            return { success: true };
          } catch (error) {
            console.error(`[admin.users.delete] Error deleting user ${input.userId}:`, error);
            throw new TRPCError({ 
              code: 'INTERNAL_SERVER_ERROR', 
              message: `Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}` 
            });
          }
        }),
    }),

    // Ban Management
    bans: router({
      list: adminProcedure
        .query(async ({ ctx }) => {
          return await db.getActiveBans();
        }),
      ban: adminProcedure
        .input(z.object({ 
          userId: z.number(), 
          reason: z.string(),
          days: z.number().optional(), // undefined = permanent
        }))
        .mutation(async ({ ctx, input }) => {
          return await db.banUser(input.userId, input.reason, input.days, ctx.user?.id);
        }),
      unban: adminProcedure
        .input(z.object({ userId: z.number() }))
        .mutation(async ({ ctx, input }) => {
          return await db.unbanUser(input.userId, ctx.user?.id);
        }),
      checkStatus: publicProcedure
        .input(z.object({ userId: z.number() }))
        .query(async ({ input }) => {
          return await db.checkUserBanStatus(input.userId);
        }),
    }),

    // Content Management
    posts: router({
      list: adminProcedure
        .input(z.object({
          authorId: z.number().optional(),
          status: z.enum(['published', 'draft', 'scheduled']).optional(),
          limit: z.number().optional().default(50),
          offset: z.number().optional().default(0),
          search: z.string().optional(),
        }))
        .query(async ({ ctx, input }) => {
          return await db.getPostsAdmin(input);
        }),
      delete: adminProcedure
        .input(z.object({ postId: z.number(), reason: z.string().optional() }))
        .mutation(async ({ ctx, input }) => {
          console.log(`[admin.posts.delete] Deleting post ${input.postId}`);
          try {
            const result = await db.deletePostAdmin(input.postId);
            console.log(`[admin.posts.delete] Successfully deleted post ${input.postId}`);
            return result;
          } catch (error) {
            console.error(`[admin.posts.delete] Error deleting post ${input.postId}:`, error);
            throw error;
          }
        }),
      feature: adminProcedure
        .input(z.object({ postId: z.number(), featured: z.boolean() }))
        .mutation(async ({ ctx, input }) => {
          return await db.featurePost(input.postId, input.featured);
        }),
    }),

    comments: router({
      list: adminProcedure
        .input(z.object({
          postId: z.number().optional(),
          authorId: z.number().optional(),
          limit: z.number().optional().default(50),
          offset: z.number().optional().default(0),
          search: z.string().optional(),
        }))
        .query(async ({ ctx, input }) => {
          return await db.getCommentsAdmin(input);
        }),
      delete: adminProcedure
        .input(z.object({ commentId: z.number(), reason: z.string().optional() }))
        .mutation(async ({ ctx, input }) => {
          // TODO: Log to audit
          return await db.deleteCommentAdmin(input.commentId);
        }),
      hide: adminProcedure
        .input(z.object({ commentId: z.number(), hidden: z.boolean() }))
        .mutation(async ({ ctx, input }) => {
          // Feature not implemented yet - hidden field not in schema
          return { success: true };
        }),
    }),

    // Reports & Moderation
    reports: router({
      list: adminProcedure
        .input(z.object({
          status: z.enum(['open', 'resolved', 'dismissed']).optional(),
          targetType: z.enum(['post', 'comment', 'user']).optional(),
          limit: z.number().optional().default(50),
          offset: z.number().optional().default(0),
        }))
        .query(async ({ ctx, input }) => {
          return await db.getReports({
            status: input.status,
            targetType: input.targetType,
            limit: input.limit,
            offset: input.offset,
          });
        }),
      resolve: adminProcedure
        .input(z.object({ reportId: z.number(), action: z.string().optional() }))
        .mutation(async ({ ctx, input }) => {
          await db.resolveReport(input.reportId, ctx.user.id, input.action);
          return { success: true };
        }),
      dismiss: adminProcedure
        .input(z.object({ reportId: z.number() }))
        .mutation(async ({ ctx, input }) => {
          await db.dismissReport(input.reportId, ctx.user.id);
          return { success: true };
        }),
    }),

    // Statistics
    statistics: router({
      overview: adminProcedure
        .query(async ({ ctx }) => {
          return await db.getAdminStatsOverview();
        }),
      users: adminProcedure
        .input(z.object({ days: z.number().optional() }))
        .query(async ({ ctx, input }) => {
          return await db.getAdminStatsUsers(input.days ?? 30);
        }),
      content: adminProcedure
        .input(z.object({ days: z.number().optional() }))
        .query(async ({ ctx, input }) => {
          return await db.getAdminStatsContent(input.days ?? 30);
        }),
      engagement: adminProcedure
        .input(z.object({ days: z.number().optional() }))
        .query(async ({ ctx, input }) => {
          return await db.getAdminStatsEngagement(input.days ?? 30);
        }),
      userMetrics: adminProcedure
        .input(z.object({ days: z.number().optional() }))
        .query(async ({ ctx, input }) => {
          return await db.getAdminStatsUserMetrics(input.days ?? 30);
        }),
    }),

    // Audit Logs
    auditLogs: router({
      list: adminProcedure
        .input(z.object({
          adminId: z.number().optional(),
          action: z.string().optional(),
          limit: z.number().optional().default(50),
          offset: z.number().optional().default(0),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
        }))
        .query(async ({ ctx, input }) => {
          return await db.getAuditLogs(input);
        }),
      get: adminProcedure
        .input(z.object({ id: z.number() }))
        .query(async ({ ctx, input }) => {
          const logs = await db.getAuditLogs({ limit: 1 });
          return logs.logs.find((l: any) => l.id === input.id);
        }),
    }),

    // Settings
    settings: router({
      get: adminProcedure
        .query(async ({ ctx }) => {
          return { siteName: 'Blozhik', maintenanceMode: false };
        }),
      update: adminProcedure
        .input(z.object({
          siteName: z.string().optional(),
          siteDescription: z.string().optional(),
          contactEmail: z.string().optional(),
          registrationsEnabled: z.boolean().optional(),
          maxUploadSize: z.number().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
          return { success: true };
        }),
    }),

    // Announcements
    announcements: router({
      list: adminProcedure
        .query(async ({ ctx }) => {
          return await db.getAnnouncements();
        }),
      create: adminProcedure
        .input(z.object({
          title: z.string(),
          content: z.string(),
          type: z.enum(['info', 'warning', 'error', 'success']),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          targetAudience: z.enum(['all', 'new_users', 'admins']).optional(),
          targetUserIds: z.string().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
          // TODO: Log to audit
          return await db.createAnnouncement(input);
        }),
      update: adminProcedure
        .input(z.object({
          id: z.number(),
          title: z.string().optional(),
          content: z.string().optional(),
          type: z.enum(['info', 'warning', 'error', 'success']).optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          targetAudience: z.enum(['all', 'new_users', 'admins']).optional(),
          targetUserIds: z.string().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
          return await db.updateAnnouncement(input.id, input);
        }),
      delete: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ ctx, input }) => {
          // TODO: Log to audit
          return await db.deleteAnnouncement(input.id);
        }),
    }),

    // Categories
    categories: router({
      list: adminProcedure
        .query(async ({ ctx }) => {
          return await db.getAllCategories();
        }),
      create: adminProcedure
        .input(z.object({
          name: z.string(),
          slug: z.string(),
          description: z.string().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
          return await db.createCategory(input);
        }),
      update: adminProcedure
        .input(z.object({
          id: z.number(),
          name: z.string().optional(),
          slug: z.string().optional(),
          description: z.string().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
          const catDb = await db.getDb();
          if (!catDb) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
          const { id, ...updateData } = input;
          await catDb.update(categories).set(updateData).where(eq(categories.id, id));
          return { success: true };
        }),
      delete: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ ctx, input }) => {
          const catDb = await db.getDb();
          if (!catDb) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
          await catDb.delete(categories).where(eq(categories.id, input.id));
          return { success: true };
        }),
    }),
  }),
  
  // ============= REPORT ROUTER (PUBLIC) =============
  report: router({
    create: protectedProcedure
      .input(z.object({
        targetType: z.enum(['post', 'comment', 'user']),
        targetId: z.number(),
        reason: z.enum(['spam', 'offensive', 'harassment', 'adult', 'other']),
        description: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createReport({
          userId: ctx.user.id,
          targetType: input.targetType,
          targetId: input.targetId,
          reason: input.reason,
          description: input.description,
        });
      }),
  }),
  
  // ============= BLOCK ROUTER =============
  block: router({
    toggle: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // Check if already blocked
        const blocked = await db.isBlocked(ctx.user.id, input.userId);
        
        if (blocked) {
          await db.unblockUser(ctx.user.id, input.userId);
          return { blocked: false };
        } else {
          await db.blockUser(ctx.user.id, input.userId);
          return { blocked: true };
        }
      }),
    list: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getBlockedUsers(ctx.user.id);
      }),
    isBlocked: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ ctx, input }) => {
        return { blocked: await db.isBlocked(ctx.user.id, input.userId) };
      }),
  }),
  
  // ============= BADGE ROUTER =============
  badge: router({
    list: publicProcedure
      .query(async () => {
        return await db.getBadges();
      }),
    getUserBadges: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        return await db.getUserBadges(input.userId);
      }),
    checkAndAward: protectedProcedure
      .mutation(async ({ ctx }) => {
        await db.checkAndAwardBadges(ctx.user.id);
        return { success: true };
      }),
  }),
  // 'admin' defined earlier above as nested admin router; remove duplicate flat admin router to avoid collision
});

export type AppRouter = typeof appRouter;
