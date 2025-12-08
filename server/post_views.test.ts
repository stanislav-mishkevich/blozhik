import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import Database from 'better-sqlite3';
import { getDb } from './db';
import * as db from './db';

const TMP_DB = './tmp_post_views.db';

async function resetTmpDb() {
  if (fs.existsSync(TMP_DB)) fs.unlinkSync(TMP_DB);
  const conn = new Database(TMP_DB);
  const sql = `
    CREATE TABLE posts (id INTEGER PRIMARY KEY, userId INTEGER, title TEXT, content TEXT, contentType TEXT, published INTEGER DEFAULT 0, createdAt TEXT DEFAULT CURRENT_TIMESTAMP, updatedAt TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE post_views (id INTEGER PRIMARY KEY, postId INTEGER NOT NULL, day TEXT NOT NULL, views INTEGER DEFAULT 0 NOT NULL, createdAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL);
  `;
  conn.exec(sql);
  conn.exec("INSERT INTO posts (id, userId, title, content, contentType, published) VALUES (1, 1, 'Hello', 'World', 'plaintext', 1)");
  conn.close();
}

describe('Post Views', () => {
  beforeEach(async () => {
    db.resetDb();
    await resetTmpDb();
    process.env.DATABASE_URL = TMP_DB;
    await getDb();
  });
  afterEach(() => {
    if (fs.existsSync(TMP_DB)) fs.unlinkSync(TMP_DB);
  });

  it('should add and retrieve daily page views', async () => {
    await db.addPageView(1);
    await db.addPageView(1);
    const views = await db.getPostViews(1, 7);
    expect(views.length).toBeGreaterThan(0);
    expect(Number(views[0].views)).toBeGreaterThanOrEqual(2);
  });
});
