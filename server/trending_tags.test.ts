import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import Database from 'better-sqlite3';
import { getDb } from './db';
import * as db from './db';

const TMP_DB = './tmp_trending_tags.db';

async function resetTmpDb() {
  if (fs.existsSync(TMP_DB)) fs.unlinkSync(TMP_DB);
  const conn = new Database(TMP_DB);
  const sql = `
    CREATE TABLE posts (id INTEGER PRIMARY KEY, userId INTEGER, title TEXT, content TEXT, contentType TEXT DEFAULT 'plaintext', excerpt TEXT, published INTEGER DEFAULT 1, createdAt TEXT DEFAULT CURRENT_TIMESTAMP, categoryId INTEGER, scheduledAt TEXT, updatedAt TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE tags (id INTEGER PRIMARY KEY, name TEXT, createdAt TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE postTags (postId INTEGER, tagId INTEGER, createdAt TEXT DEFAULT CURRENT_TIMESTAMP);
  `;
  conn.exec(sql);
  conn.exec("INSERT INTO posts (id, userId, title, content, contentType, published) VALUES (1,1,'P1','c','plaintext',1)");
  conn.exec("INSERT INTO tags (id, name) VALUES (1,'js')");
  conn.exec("INSERT INTO postTags (postId, tagId) VALUES (1,1)");
  conn.close();
}

describe('Trending Tags', () => {
  beforeEach(async () => {
    db.resetDb();
    await resetTmpDb();
    process.env.DATABASE_URL = TMP_DB;
    await getDb();
  });
  afterEach(() => {
    if (fs.existsSync(TMP_DB)) fs.unlinkSync(TMP_DB);
  });

  it('should return popular tags based on recent posts', async () => {
    const tags = await db.getTrendingTags(7, 10);
    expect(tags.length).toBeGreaterThan(0);
    expect(tags[0].name).toBe('js');
  });
});
