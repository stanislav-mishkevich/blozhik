import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import Database from 'better-sqlite3';
import { getDb } from './db';
import * as db from './db';

const TMP_DB = './tmp_scheduler.db';

async function resetTmpDb() {
  if (fs.existsSync(TMP_DB)) fs.unlinkSync(TMP_DB);
  const conn = new Database(TMP_DB);
  const sql = `
    CREATE TABLE posts (id INTEGER PRIMARY KEY, userId INTEGER, title TEXT, content TEXT, contentType TEXT DEFAULT 'plaintext', excerpt TEXT, published INTEGER DEFAULT 0, createdAt TEXT DEFAULT CURRENT_TIMESTAMP, categoryId INTEGER, scheduledAt TEXT, updatedAt TEXT DEFAULT CURRENT_TIMESTAMP);
  `;
  conn.exec(sql);
  conn.exec("INSERT INTO posts (id, userId, title, content, contentType, published, scheduledAt) VALUES (1, 1, 'Scheduled', 'Content', 'plaintext', 0, datetime('now','-1 minute'))");
  conn.close();
}

describe('Scheduler', () => {
  beforeEach(async () => {
    db.resetDb();
    await resetTmpDb();
    process.env.DATABASE_URL = TMP_DB;
    await getDb();
  });
  afterEach(() => {
    if (fs.existsSync(TMP_DB)) fs.unlinkSync(TMP_DB);
  });

  it('should publish posts scheduled in the past', async () => {
    const published = await db.publishScheduledPosts();
    expect(published.length).toBeGreaterThan(0);
    const post = await db.getPostById(1);
    expect(post?.published).toBe(1);
  });
});
