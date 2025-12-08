import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import Database from 'better-sqlite3';
import { getDb } from './db';
import * as db from './db';

const TMP_DB = './tmp_comment_notifications.db';

async function resetTmpDb() {
  if (fs.existsSync(TMP_DB)) fs.unlinkSync(TMP_DB);
  const conn = new Database(TMP_DB);
  const sql = `
    CREATE TABLE users (id INTEGER PRIMARY KEY, openId TEXT UNIQUE, name TEXT, email TEXT UNIQUE, loginMethod TEXT, role TEXT DEFAULT 'user', username TEXT UNIQUE, passwordHash TEXT, bio TEXT, avatarUrl TEXT, isBanned INTEGER DEFAULT 0, banReason TEXT, bannedAt TEXT, createdAt TEXT DEFAULT CURRENT_TIMESTAMP, updatedAt TEXT DEFAULT CURRENT_TIMESTAMP, lastSignedIn TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE posts (id INTEGER PRIMARY KEY, userId INTEGER, title TEXT, content TEXT, contentType TEXT DEFAULT 'plaintext', excerpt TEXT, published INTEGER DEFAULT 1, createdAt TEXT DEFAULT CURRENT_TIMESTAMP, categoryId INTEGER, scheduledAt TEXT, updatedAt TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE comments (id INTEGER PRIMARY KEY, postId INTEGER NOT NULL, userId INTEGER NOT NULL, content TEXT NOT NULL, parentId INTEGER, createdAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL, updatedAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL);
    CREATE TABLE notifications (id INTEGER PRIMARY KEY, userId INTEGER NOT NULL, type TEXT NOT NULL, postId INTEGER, actorId INTEGER, read INTEGER DEFAULT 0 NOT NULL, createdAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL);
  `;
  conn.exec(sql);
  conn.exec("INSERT INTO users (id, openId, username) VALUES (1, 'user1', 'u1')");
  conn.exec("INSERT INTO users (id, openId, username) VALUES (2, 'user2', 'u2')");
  conn.exec("INSERT INTO posts (id, userId, title) VALUES (1, 1, 'Post1')");
  conn.close();
}

describe('Comment notifications', () => {
  beforeEach(async () => {
    db.resetDb();
    await resetTmpDb();
    process.env.DATABASE_URL = TMP_DB;
    await getDb();
  });
  afterEach(() => {
    if (fs.existsSync(TMP_DB)) fs.unlinkSync(TMP_DB);
  });

  it('should notify post owner on new comment', async () => {
    const id = await db.createComment({ postId: 1, userId: 2, content: 'Nice post' } as any);
    expect(id).toBeGreaterThan(0);
    const unread = await db.getUnreadNotificationCount(1);
    expect(unread).toBeGreaterThan(0);
  });

  it('should notify parent comment owner on reply', async () => {
    const parentId = await db.createComment({ postId: 1, userId: 1, content: 'Parent comment' } as any);
    const replyId = await db.createComment({ postId: 1, userId: 2, content: 'Reply to parent', parentId } as any);
    expect(replyId).toBeGreaterThan(0);
    const unread = await db.getUnreadNotificationCount(1);
    expect(unread).toBeGreaterThan(0);
  });
});
