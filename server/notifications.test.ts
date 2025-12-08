import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import Database from 'better-sqlite3';
import { getDb } from './db';
import * as db from './db';

const TMP_DB = './tmp_notifications.db';

async function resetTmpDb() {
  if (fs.existsSync(TMP_DB)) fs.unlinkSync(TMP_DB);
  const conn = new Database(TMP_DB);
  const sql = `
    CREATE TABLE users (id INTEGER PRIMARY KEY, openId TEXT UNIQUE, name TEXT, email TEXT UNIQUE, loginMethod TEXT, role TEXT DEFAULT 'user', username TEXT UNIQUE, passwordHash TEXT, bio TEXT, avatarUrl TEXT, isBanned INTEGER DEFAULT 0, banReason TEXT, bannedAt TEXT, createdAt TEXT DEFAULT CURRENT_TIMESTAMP, updatedAt TEXT DEFAULT CURRENT_TIMESTAMP, lastSignedIn TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE posts (id INTEGER PRIMARY KEY, userId INTEGER, title TEXT, content TEXT, contentType TEXT DEFAULT 'plaintext', excerpt TEXT, published INTEGER DEFAULT 1, createdAt TEXT DEFAULT CURRENT_TIMESTAMP, categoryId INTEGER, scheduledAt TEXT, updatedAt TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE follows (followerId INTEGER NOT NULL, followingId INTEGER NOT NULL, createdAt TEXT DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(followerId, followingId));
    CREATE TABLE notifications (id INTEGER PRIMARY KEY, userId INTEGER NOT NULL, type TEXT NOT NULL, postId INTEGER, actorId INTEGER, read INTEGER DEFAULT 0 NOT NULL, createdAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL);
  `;
  conn.exec(sql);
  conn.exec("INSERT INTO users (id, openId, username, name, email) VALUES (1, 'user1', 'u1', 'User 1', 'u1@example.com')");
  conn.exec("INSERT INTO users (id, openId, username, name, email) VALUES (2, 'user2', 'u2', 'User 2', 'u2@example.com')");
  conn.close();
}

describe('Notifications', () => {
  beforeEach(async () => {
    db.resetDb();
    await resetTmpDb();
    process.env.DATABASE_URL = TMP_DB;
    await getDb();
  });
  afterEach(() => {
    if (fs.existsSync(TMP_DB)) fs.unlinkSync(TMP_DB);
  });

  it('should create a notification when following a user', async () => {
    const res = await db.toggleFollow(1, 2);
    expect(res.following).toBe(true);
    const unread = await db.getUnreadNotificationCount(2);
    expect(unread).toBeGreaterThan(0);
    const notifications = await db.getNotificationsForUser(2);
    expect(notifications.length).toBeGreaterThan(0);
  });
});
