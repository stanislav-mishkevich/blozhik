import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import Database from 'better-sqlite3';
import { getDb } from './db';
import * as db from './db';

const TMP_DB = './tmp_post_versions.db';

async function resetTmpDb() {
  if (fs.existsSync(TMP_DB)) fs.unlinkSync(TMP_DB);
  const conn = new Database(TMP_DB);
  const sql = `
    CREATE TABLE users (id INTEGER PRIMARY KEY, openId TEXT UNIQUE, name TEXT, email TEXT UNIQUE, loginMethod TEXT, role TEXT DEFAULT 'user', username TEXT UNIQUE, passwordHash TEXT, bio TEXT, avatarUrl TEXT, isBanned INTEGER DEFAULT 0, banReason TEXT, bannedAt TEXT, createdAt TEXT DEFAULT CURRENT_TIMESTAMP, updatedAt TEXT DEFAULT CURRENT_TIMESTAMP, lastSignedIn TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE posts (id INTEGER PRIMARY KEY, userId INTEGER, title TEXT, content TEXT, contentType TEXT DEFAULT 'plaintext', excerpt TEXT, published INTEGER DEFAULT 0, createdAt TEXT DEFAULT CURRENT_TIMESTAMP, categoryId INTEGER, scheduledAt TEXT, updatedAt TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE post_versions (id INTEGER PRIMARY KEY, postId INTEGER NOT NULL, userId INTEGER, title TEXT, content TEXT, contentType TEXT, createdAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL);
  `;
  conn.exec(sql);
  conn.exec("INSERT INTO users (id, openId, username, name, email) VALUES (1, 'user1', 'u1', 'User 1', 'u1@example.com')");
  conn.close();
  fs.chmodSync(TMP_DB, 0o666);
}

describe('Post Versions', () => {
  beforeEach(async () => {
    await resetTmpDb();
    process.env.DATABASE_URL = TMP_DB;
    db.resetDb();
    await getDb();
  });
  afterEach(() => {
    if (fs.existsSync(TMP_DB)) fs.unlinkSync(TMP_DB);
  });

  it('should create a version on post update and allow listing versions', async () => {
    const postId = await db.createPost({ userId: 1, title: 'Hello', content: 'World', contentType: 'plaintext', published: 1 } as any);
    expect(postId).toBeGreaterThan(0);
    await db.updatePost(postId, { title: 'Hello Updated', content: 'World Updated' });
    const versions = await db.getPostVersions(postId);
    expect(versions.length).toBeGreaterThan(0);
    expect(versions[0].title).toBe('Hello');
  });
});
