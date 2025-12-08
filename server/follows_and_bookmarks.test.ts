import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import { getDb } from './db';
import * as db from './db';
import Database from 'better-sqlite3';

const TMP_DB = './tmp_test.db';

async function resetTmpDb() {
  if (fs.existsSync(TMP_DB)) fs.unlinkSync(TMP_DB);
  const conn = new Database(TMP_DB);
  const sql = `
    CREATE TABLE users (id INTEGER PRIMARY KEY, openId TEXT UNIQUE, name TEXT, email TEXT UNIQUE, loginMethod TEXT, role TEXT DEFAULT 'user', username TEXT UNIQUE, passwordHash TEXT, bio TEXT, avatarUrl TEXT, isBanned INTEGER DEFAULT 0, banReason TEXT, bannedAt TEXT, createdAt TEXT DEFAULT CURRENT_TIMESTAMP, updatedAt TEXT DEFAULT CURRENT_TIMESTAMP, lastSignedIn TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE posts (id INTEGER PRIMARY KEY, userId INTEGER, title TEXT, content TEXT, contentType TEXT DEFAULT 'plaintext', excerpt TEXT, published INTEGER DEFAULT 1, createdAt TEXT DEFAULT CURRENT_TIMESTAMP, categoryId INTEGER, scheduledAt TEXT, updatedAt TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE follows (followerId INTEGER NOT NULL, followingId INTEGER NOT NULL, createdAt TEXT DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(followerId, followingId));
    CREATE TABLE bookmarks (id INTEGER PRIMARY KEY, userId INTEGER NOT NULL, postId INTEGER NOT NULL, createdAt TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE notifications (id INTEGER PRIMARY KEY, userId INTEGER NOT NULL, type TEXT NOT NULL, postId INTEGER, actorId INTEGER, read INTEGER DEFAULT 0 NOT NULL, createdAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL);
    CREATE UNIQUE INDEX IF NOT EXISTS user_post_unique ON bookmarks (userId, postId);
  `;
  conn.exec(sql);
  conn.exec("INSERT INTO users (id, openId, username, name, email) VALUES (1, 'user1', 'u1', 'User 1', 'u1@example.com')");
  conn.exec("INSERT INTO users (id, openId, username, name, email) VALUES (2, 'user2', 'u2', 'User 2', 'u2@example.com')");
  conn.exec("INSERT INTO posts (id, userId, title) VALUES (1, 1, 'Post1')");
  conn.close();
  fs.chmodSync(TMP_DB, 0o666);
}

describe('Follows and Bookmarks DB functions', () => {
  beforeEach(async () => {
    await resetTmpDb();
    process.env.DATABASE_URL = TMP_DB;
    db.resetDb();
    await getDb();
  });
  afterEach(() => {
    if (fs.existsSync(TMP_DB)) fs.unlinkSync(TMP_DB);
  });

  it('should toggle follow', async () => {
    const res1 = await db.toggleFollow(1, 2);
    expect(res1.following).toBe(true);
    expect(await db.isFollowingUser(1, 2)).toBe(true);
    const followersCount = await db.getFollowersCount(2);
    expect(followersCount).toBe(1);
    const res2 = await db.toggleFollow(1, 2);
    expect(res2.following).toBe(false);
    expect(await db.isFollowingUser(1, 2)).toBe(false);
    const followersCount2 = await db.getFollowersCount(2);
    expect(followersCount2).toBe(0);
  });

  it('should add and remove bookmark', async () => {
    await db.addBookmark(1, 1);
    expect(await db.isPostBookmarkedByUser(1, 1)).toBe(true);
    const bookmarks = await db.getBookmarksForUser(1);
    expect(bookmarks.length).toBe(1);
    await db.removeBookmark(1, 1);
    expect(await db.isPostBookmarkedByUser(1, 1)).toBe(false);
  });
});
