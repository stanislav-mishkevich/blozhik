import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import Database from 'better-sqlite3';
import { getDb } from './db';
import * as db from './db';

const TMP_DB = './tmp_notifications_clear.db';

async function resetTmpDb() {
  if (fs.existsSync(TMP_DB)) fs.unlinkSync(TMP_DB);
  const conn = new Database(TMP_DB);
  const sql = `
    CREATE TABLE users (id INTEGER PRIMARY KEY, openId TEXT UNIQUE, name TEXT, email TEXT UNIQUE, loginMethod TEXT, role TEXT DEFAULT 'user', username TEXT UNIQUE, passwordHash TEXT, bio TEXT, avatarUrl TEXT, isBanned INTEGER DEFAULT 0, banReason TEXT, bannedAt TEXT, createdAt TEXT DEFAULT CURRENT_TIMESTAMP, updatedAt TEXT DEFAULT CURRENT_TIMESTAMP, lastSignedIn TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE notifications (id INTEGER PRIMARY KEY, userId INTEGER NOT NULL, type TEXT NOT NULL, postId INTEGER, actorId INTEGER, read INTEGER DEFAULT 0 NOT NULL, createdAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL);
  `;
  conn.exec(sql);
  conn.exec("INSERT INTO users (id, openId, username, name, email) VALUES (1, 'user1', 'u1', 'User 1', 'u1@example.com')");
  conn.exec("INSERT INTO users (id, openId, username, name, email) VALUES (2, 'user2', 'u2', 'User 2', 'u2@example.com')");
  conn.close();
}

describe('Notification clear all', () => {
  beforeEach(async () => {
    db.resetDb();
    await resetTmpDb();
    process.env.DATABASE_URL = TMP_DB;
    await getDb();
  });
  afterEach(() => {
    if (fs.existsSync(TMP_DB)) fs.unlinkSync(TMP_DB);
  });

  it('should mark all notifications as read', async () => {
    const id1 = await db.createNotification({ userId: 1, type: 'follow', actorId: 2 });
    const id2 = await db.createNotification({ userId: 1, type: 'like', actorId: 2 });
    const unreadBefore = await db.getUnreadNotificationCount(1);
    expect(unreadBefore).toBe(2);
    await db.markAllNotificationsRead(1);
    const unreadAfter = await db.getUnreadNotificationCount(1);
    expect(unreadAfter).toBe(0);
  });
});
