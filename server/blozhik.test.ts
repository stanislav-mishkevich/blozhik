import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import bcrypt from "bcryptjs";
import * as db from "./db";
import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { getDb } from './db';

const TMP_DB = path.resolve(process.cwd(), `tmp_blozhik_test_${Date.now()}_${Math.random()}.db`);

async function resetTmpDb() {
  if (fs.existsSync(TMP_DB)) {
    fs.unlinkSync(TMP_DB);
  }
  const conn = new Database(TMP_DB);
  // Make sure the database file is writable
  fs.chmodSync(TMP_DB, 0o666);
  const sql = `
    CREATE TABLE users (id INTEGER PRIMARY KEY, openId TEXT UNIQUE, name TEXT, email TEXT UNIQUE, loginMethod TEXT, role TEXT DEFAULT 'user', username TEXT UNIQUE, passwordHash TEXT, bio TEXT, avatarUrl TEXT, isBanned INTEGER DEFAULT 0, banReason TEXT, bannedAt TEXT, createdAt TEXT DEFAULT CURRENT_TIMESTAMP, updatedAt TEXT DEFAULT CURRENT_TIMESTAMP, lastSignedIn TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE posts (id INTEGER PRIMARY KEY, userId INTEGER, title TEXT, content TEXT, contentType TEXT DEFAULT 'plaintext', excerpt TEXT, published INTEGER DEFAULT 1, createdAt TEXT DEFAULT CURRENT_TIMESTAMP, categoryId INTEGER, scheduledAt TEXT, updatedAt TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE comments (id INTEGER PRIMARY KEY, postId INTEGER NOT NULL, userId INTEGER NOT NULL, content TEXT NOT NULL, parentId INTEGER, createdAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL, updatedAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL);
    CREATE TABLE likes (id INTEGER PRIMARY KEY, postId INTEGER NOT NULL, userId INTEGER NOT NULL, createdAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL);
    CREATE TABLE notifications (id INTEGER PRIMARY KEY, userId INTEGER NOT NULL, type TEXT NOT NULL, postId INTEGER, actorId INTEGER, read INTEGER DEFAULT 0 NOT NULL, createdAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL);
    CREATE TABLE tags (id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE, createdAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL);
    CREATE TABLE postTags (postId INTEGER NOT NULL, tagId INTEGER NOT NULL, createdAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL, PRIMARY KEY(postId, tagId));
    CREATE TABLE post_versions (id INTEGER PRIMARY KEY, postId INTEGER NOT NULL, userId INTEGER, title TEXT, content TEXT, contentType TEXT, version INTEGER NOT NULL, createdAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL);
    CREATE TABLE follows (followerId INTEGER NOT NULL, followingId INTEGER NOT NULL, createdAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL, PRIMARY KEY(followerId, followingId));
    CREATE TABLE bookmarks (id INTEGER PRIMARY KEY, userId INTEGER NOT NULL, postId INTEGER NOT NULL, createdAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL);
    CREATE TABLE categories (id INTEGER PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, createdAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL);
    CREATE TABLE post_views (id INTEGER PRIMARY KEY, postId INTEGER NOT NULL, userId INTEGER, day TEXT NOT NULL, views INTEGER DEFAULT 0 NOT NULL, createdAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL);
    CREATE TABLE audit_logs (id INTEGER PRIMARY KEY, userId INTEGER, action TEXT NOT NULL, targetType TEXT, targetId INTEGER, details TEXT, ipAddress TEXT, userAgent TEXT, createdAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL);
    CREATE TABLE reports (id INTEGER PRIMARY KEY, userId INTEGER NOT NULL, targetType TEXT NOT NULL, targetId INTEGER NOT NULL, reason TEXT NOT NULL, description TEXT, status TEXT DEFAULT 'open' NOT NULL, resolvedBy INTEGER, resolvedAt TEXT, action TEXT, createdAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL);
    CREATE TABLE role_permissions (role TEXT NOT NULL, permission TEXT NOT NULL, grantedAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL, PRIMARY KEY(role, permission));
    CREATE TABLE user_permissions (userId INTEGER NOT NULL, permission TEXT NOT NULL, grantedAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL, PRIMARY KEY(userId, permission));
  `;
  conn.exec(sql);
  conn.close();
}

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createMockContext(user?: AuthenticatedUser): TrpcContext {
  return {
    user: user || null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("BLOZHIK - Authentication", () => {
  beforeEach(async () => {
    // Ensure any previous connection is closed
    db.resetDb();
    await resetTmpDb();
    process.env.DATABASE_URL = TMP_DB;
    // Force a new connection
    await getDb();
  });
  afterEach(() => {
    if (fs.existsSync(TMP_DB)) fs.unlinkSync(TMP_DB);
  });
  it("should register a new user", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.register({
      email: `test${Date.now()}@example.com`,
      password: "password123",
      username: `testuser${Date.now()}`,
    });

    expect(result.success).toBe(true);
  });

  it("should reject duplicate email registration", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const email = `duplicate${Date.now()}@example.com`;
    const username = `dupuser${Date.now()}`;

    await caller.auth.register({
      email,
      password: "password123",
      username,
    });

    await expect(
      caller.auth.register({
        email,
        password: "password456",
        username: `${username}2`,
      })
    ).rejects.toThrow("Email already registered");
  });

  it("should login with valid credentials", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const email = `login${Date.now()}@example.com`;
    const password = "password123";
    const username = `loginuser${Date.now()}`;

    await caller.auth.register({ email, password, username });

    const result = await caller.auth.login({ email, password });

    expect(result.success).toBe(true);
    expect(result.user.email).toBe(email);
  });

  it("should reject login with invalid password", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const email = `wrongpw${Date.now()}@example.com`;
    const username = `wrongpwuser${Date.now()}`;

    await caller.auth.register({
      email,
      password: "correctpassword",
      username,
    });

    await expect(
      caller.auth.login({ email, password: "wrongpassword" })
    ).rejects.toThrow("Invalid credentials");
  });
});

describe("BLOZHIK - Posts", () => {
  beforeEach(async () => {
    db.resetDb();
    await resetTmpDb();
    process.env.DATABASE_URL = TMP_DB;
    await getDb();
  });
  afterEach(() => {
    if (fs.existsSync(TMP_DB)) fs.unlinkSync(TMP_DB);
  });
  it("should create a new post", async () => {
    const email = `posttest${Date.now()}@example.com`;
    const username = `posttestuser${Date.now()}`;
    const passwordHash = await bcrypt.hash("password123", 10);
    const openId = `test_${Date.now()}`;

    await db.upsertUser({
      openId,
      email,
      username,
      passwordHash,
      loginMethod: "email",
    });

    const user = (await db.getUserByEmail(email)) as AuthenticatedUser;
    const ctx = createMockContext(user);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.post.create({
      title: "Test Post",
      content: "This is a test post content",
      contentType: "plaintext",
      tags: ["test"],
      published: true,
    });

    expect(result.postId).toBeGreaterThan(0);
  });

  it("should create a markdown post", async () => {
    const email = `mdtest${Date.now()}@example.com`;
    const username = `mduser${Date.now()}`;
    const passwordHash = await bcrypt.hash("password123", 10);
    const openId = `md_${Date.now()}`;

    await db.upsertUser({
      openId,
      email,
      username,
      passwordHash,
      loginMethod: "email",
    });

    const user = (await db.getUserByEmail(email)) as AuthenticatedUser;
    const ctx = createMockContext(user);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.post.create({
      title: "Markdown Post",
      content: "# Heading\n\n**Bold text**",
      contentType: "markdown",
      tags: [],
      published: true,
    });

    expect(result.postId).toBeGreaterThan(0);

    const post = await caller.post.getById({ postId: result.postId });
    expect(post.post.contentType).toBe("markdown");
    expect(post.post.renderedContent).toContain("<h1>");
  });

  it("should save a draft post", async () => {
    const email = `draft${Date.now()}@example.com`;
    const username = `draftuser${Date.now()}`;
    const passwordHash = await bcrypt.hash("password123", 10);
    const openId = `draft_${Date.now()}`;

    await db.upsertUser({
      openId,
      email,
      username,
      passwordHash,
      loginMethod: "email",
    });

    const user = (await db.getUserByEmail(email)) as AuthenticatedUser;
    const ctx = createMockContext(user);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.post.create({
      title: "Draft Post",
      content: "This is a draft",
      contentType: "plaintext",
      tags: [],
      published: false,
    });

    const post = await caller.post.getById({ postId: result.postId });
    expect(post.post.published).toBe(false);
  });
});

describe("BLOZHIK - Comments", () => {
  beforeEach(async () => {
    db.resetDb();
    await resetTmpDb();
    process.env.DATABASE_URL = TMP_DB;
    await getDb();
  });
  afterEach(() => {
    if (fs.existsSync(TMP_DB)) fs.unlinkSync(TMP_DB);
  });
  it("should create a comment on a post", async () => {
    const email = `comment${Date.now()}@example.com`;
    const username = `commentuser${Date.now()}`;
    const passwordHash = await bcrypt.hash("password123", 10);
    const openId = `comment_${Date.now()}`;

    await db.upsertUser({
      openId,
      email,
      username,
      passwordHash,
      loginMethod: "email",
    });

    const user = (await db.getUserByEmail(email)) as AuthenticatedUser;
    const ctx = createMockContext(user);
    const caller = appRouter.createCaller(ctx);

    const postResult = await caller.post.create({
      title: "Post for Comments",
      content: "Test content",
      contentType: "plaintext",
      tags: [],
      published: true,
    });

    const commentResult = await caller.comment.create({
      postId: postResult.postId,
      content: "This is a test comment",
    });

    expect(commentResult.commentId).toBeGreaterThan(0);

    const comments = await caller.comment.getByPostId({ postId: postResult.postId });
    expect(comments.length).toBeGreaterThan(0);
  });
});

describe("BLOZHIK - Search", () => {
  beforeEach(async () => {
    db.resetDb();
    await resetTmpDb();
    process.env.DATABASE_URL = TMP_DB;
    await getDb();
  });
  afterEach(() => {
    if (fs.existsSync(TMP_DB)) fs.unlinkSync(TMP_DB);
  });
  it("should search posts by title", async () => {
    const email = `search${Date.now()}@example.com`;
    const username = `searchuser${Date.now()}`;
    const passwordHash = await bcrypt.hash("password123", 10);
    const openId = `search_${Date.now()}`;

    await db.upsertUser({
      openId,
      email,
      username,
      passwordHash,
      loginMethod: "email",
    });

    const user = (await db.getUserByEmail(email)) as AuthenticatedUser;
    const ctx = createMockContext(user);
    const caller = appRouter.createCaller(ctx);

    const uniqueTerm = `UNIQUE${Date.now()}`;
    await caller.post.create({
      title: `Test Post ${uniqueTerm}`,
      content: "Search test content",
      contentType: "plaintext",
      tags: [],
      published: true,
    });

    const results = await caller.search.posts({
      query: uniqueTerm,
      limit: 20,
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].post.title).toContain(uniqueTerm);
  });
});

describe("BLOZHIK - User Profile", () => {
  beforeEach(async () => {
    db.resetDb();
    await resetTmpDb();
    process.env.DATABASE_URL = TMP_DB;
    await getDb();
  });
  afterEach(() => {
    if (fs.existsSync(TMP_DB)) fs.unlinkSync(TMP_DB);
  });
  it("should get user profile with statistics", async () => {
    const email = `profile${Date.now()}@example.com`;
    const username = `profileuser${Date.now()}`;
    const passwordHash = await bcrypt.hash("password123", 10);
    const openId = `profile_${Date.now()}`;

    await db.upsertUser({
      openId,
      email,
      username,
      passwordHash,
      loginMethod: "email",
    });

    const user = (await db.getUserByEmail(email)) as AuthenticatedUser;
    const ctx = createMockContext(user);
    const caller = appRouter.createCaller(ctx);

    const profile = await caller.user.getProfile({ userId: user.id });

    expect(profile.id).toBe(user.id);
    expect(profile.username).toBe(username);
    expect(profile.stats).toBeDefined();
    expect(profile.stats.postCount).toBeGreaterThanOrEqual(0);
  });
});
