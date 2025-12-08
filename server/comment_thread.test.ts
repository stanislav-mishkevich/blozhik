import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import Database from 'better-sqlite3';
import { getDb } from './db';
import * as db from './db';

const TMP_DB = './tmp_comment_thread.db';

async function resetTmpDb() {
  if (fs.existsSync(TMP_DB)) fs.unlinkSync(TMP_DB);
  const conn = new Database(TMP_DB);
  const sql = `
    CREATE TABLE users (id INTEGER PRIMARY KEY, openId TEXT UNIQUE, name TEXT, email TEXT UNIQUE, loginMethod TEXT, role TEXT DEFAULT 'user', username TEXT UNIQUE, passwordHash TEXT, bio TEXT, avatarUrl TEXT, isBanned INTEGER DEFAULT 0, banReason TEXT, bannedAt TEXT, createdAt TEXT DEFAULT CURRENT_TIMESTAMP, updatedAt TEXT DEFAULT CURRENT_TIMESTAMP, lastSignedIn TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE posts (id INTEGER PRIMARY KEY, userId INTEGER, title TEXT, content TEXT, contentType TEXT DEFAULT 'plaintext', excerpt TEXT, published INTEGER DEFAULT 1, createdAt TEXT DEFAULT CURRENT_TIMESTAMP, categoryId INTEGER, scheduledAt TEXT, updatedAt TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE comments (id INTEGER PRIMARY KEY, postId INTEGER NOT NULL, userId INTEGER NOT NULL, content TEXT NOT NULL, parentId INTEGER, createdAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL, updatedAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL);
  `;
  conn.exec(sql);
  conn.exec("INSERT INTO users (id, openId, username, name, email) VALUES (1, 'user1', 'u1', 'User 1', 'u1@example.com')");
  conn.exec("INSERT INTO users (id, openId, username, name, email) VALUES (2, 'user2', 'u2', 'User 2', 'u2@example.com')");
  conn.exec("INSERT INTO posts (id, userId, title) VALUES (1, 1, 'Post1')");
  conn.close();
  fs.chmodSync(TMP_DB, 0o666);
}

describe('Comment Threading', () => {
  beforeEach(async () => {
    await resetTmpDb();
    process.env.DATABASE_URL = TMP_DB;
    db.resetDb();
    await getDb();
  });
  afterEach(() => {
    if (fs.existsSync(TMP_DB)) fs.unlinkSync(TMP_DB);
  });

  it('should create parent comment and nested reply', async () => {
    const parentId = await db.createComment({ postId: 1, userId: 1, content: 'Parent comment' } as any);
    const replyId = await db.createComment({ postId: 1, userId: 2, content: 'Reply', parentId } as any);
    expect(parentId).toBeGreaterThan(0);
    expect(replyId).toBeGreaterThan(0);
    const comments = await db.getCommentsByPostId(1);
    expect(comments.length).toBe(2);
    const replies = await db.getRepliesByCommentId(parentId);
    expect(replies.length).toBe(1);
    expect(replies[0].comment.content).toBe('Reply');
  });
});
