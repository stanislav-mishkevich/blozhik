import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import Database from 'better-sqlite3';
import { getDb } from './db';
import * as db from './db';

const TMP_DB = './tmp_analytics.db';

async function resetTmpDb() {
  if (fs.existsSync(TMP_DB)) fs.unlinkSync(TMP_DB);
  const conn = new Database(TMP_DB);
  const sql = `
    CREATE TABLE users (id INTEGER PRIMARY KEY, openId TEXT UNIQUE, name TEXT, email TEXT UNIQUE, loginMethod TEXT, role TEXT DEFAULT 'user', username TEXT UNIQUE, passwordHash TEXT, bio TEXT, avatarUrl TEXT, isBanned INTEGER DEFAULT 0, banReason TEXT, bannedAt TEXT, createdAt TEXT DEFAULT CURRENT_TIMESTAMP, updatedAt TEXT DEFAULT CURRENT_TIMESTAMP, lastSignedIn TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE posts (id INTEGER PRIMARY KEY, userId INTEGER, title TEXT, content TEXT, contentType TEXT DEFAULT 'plaintext', excerpt TEXT, published INTEGER DEFAULT 1, createdAt TEXT DEFAULT CURRENT_TIMESTAMP, categoryId INTEGER, scheduledAt TEXT, updatedAt TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE post_views (id INTEGER PRIMARY KEY, postId INTEGER NOT NULL, day TEXT NOT NULL, views INTEGER DEFAULT 0 NOT NULL, createdAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL);
  `;
  conn.exec(sql);
  conn.exec("INSERT INTO users (id, openId, username, name, email) VALUES (1, 'user1', 'u1', 'User 1', 'u1@example.com')");
  conn.exec("INSERT INTO posts (id, userId, title, content, contentType, published) VALUES (1, 1, 'P1', 'c', 'plaintext', 1)");
  conn.exec("INSERT INTO post_views (postId, day, views) VALUES (1, date('now','-1 days'), 3)");
  conn.exec("INSERT INTO post_views (postId, day, views) VALUES (1, date('now'), 5)");
  conn.close();
}

describe('Analytics', () => {
  beforeEach(async () => {
    db.resetDb();
    await resetTmpDb();
    process.env.DATABASE_URL = TMP_DB;
    await getDb();
  });
  afterEach(() => {
    if (fs.existsSync(TMP_DB)) fs.unlinkSync(TMP_DB);
  });

  it('should return aggregated views for post', async () => {
    const agg = await db.getViewsAggregated(1, 2);
    expect(agg.length).toBe(2);
    expect(agg[0].views + agg[1].views).toBeGreaterThan(0);
  });

  it('should return top posts for user', async () => {
    const top = await db.getTopPostsForUser(1, 7, 3);
    expect(top.length).toBeGreaterThan(0);
    expect(top[0].views).toBeGreaterThan(0);
  });

  it('should return top authors', async () => {
    const authors = await db.getTopAuthors(7, 3);
    expect(authors.length).toBeGreaterThan(0);
    expect(authors[0].views).toBeGreaterThanOrEqual(0);
  });
});
