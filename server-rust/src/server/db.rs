use anyhow::Result;
use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use std::path::Path;
use once_cell::sync::OnceCell;
use std::sync::Mutex;
use std::cell::RefCell;

thread_local! {
    static THREAD_DB_PATH: RefCell<Option<String>> = RefCell::new(None);
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct User {
    pub id: i64,
    pub open_id: String,
    pub email: Option<String>,
    pub username: Option<String>,
    pub password_hash: Option<String>,
    pub name: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Post {
    pub id: i64,
    pub author_open_id: String,
    pub title: String,
    pub content: String,
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Comment {
    pub id: i64,
    pub post_id: i64,
    pub author_open_id: String,
    pub content: String,
    pub created_at: Option<String>,
}

fn db_path() -> String {
    // prefer thread-local DB path (per-test), then stored global DB path, then env var
    if let Some(p) = THREAD_DB_PATH.with(|c| c.borrow().clone()) {
        return p;
    }
    std::env::var("DATABASE_PATH").unwrap_or_else(|_| "./blozhik.db".to_string())
}

static DB: OnceCell<Mutex<Connection>> = OnceCell::new();
static DB_PATH_CELL: OnceCell<Mutex<String>> = OnceCell::new();

fn conn() -> Result<std::sync::MutexGuard<'static, Connection>> {
    let db_mutex = DB.get().ok_or_else(|| anyhow::anyhow!("DB not initialized"))?;
    Ok(db_mutex.lock().expect("db mutex poisoned"))
}

// Public accessor for the global connection mutex guard.
pub fn get_conn() -> Result<std::sync::MutexGuard<'static, Connection>> {
    conn()
}

pub fn init_db() -> Result<()> {
    let path = db_path();
    // set thread-local DB path for callers in this thread (tests)
    THREAD_DB_PATH.with(|c| *c.borrow_mut() = Some(path.clone()));
    if !Path::new(&path).exists() {
        // file will be created by opening connection
    }
    // If DB already initialized, do not replace global connection here (tests use open_conn())
    if DB.get().is_some() {
        return Ok(());
    }
        // ensure tables exist on the new connection
        guard.execute_batch(
            "CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            openId TEXT NOT NULL UNIQUE,
            email TEXT UNIQUE,
            username TEXT UNIQUE,
            passwordHash TEXT,
            name TEXT,
            createdAt TEXT DEFAULT (datetime('now'))
        );",
        )?;
        guard.execute_batch(
            "CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            token TEXT NOT NULL UNIQUE,
            openId TEXT NOT NULL,
            expiresAt TEXT
        );",
        )?;
        guard.execute_batch(
            "CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            authorOpenId TEXT NOT NULL,
            title TEXT NOT NULL,
            content TEXT,
            createdAt TEXT DEFAULT (datetime('now'))
        );",
        )?;
        guard.execute_batch(
            "CREATE TABLE IF NOT EXISTS comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            postId INTEGER NOT NULL,
            authorOpenId TEXT NOT NULL,
            content TEXT,
            createdAt TEXT DEFAULT (datetime('now'))
        );",
        )?;
        guard.execute_batch(
            "CREATE TABLE IF NOT EXISTS follows (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            followerOpenId TEXT NOT NULL,
            targetOpenId TEXT NOT NULL,
            createdAt TEXT DEFAULT (datetime('now'))
        );",
        )?;
        guard.execute_batch(
            "CREATE TABLE IF NOT EXISTS bookmarks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userOpenId TEXT NOT NULL,
            postId INTEGER NOT NULL,
            createdAt TEXT DEFAULT (datetime('now'))
        );",
        )?;
        guard.execute_batch(
            "CREATE TABLE IF NOT EXISTS drafts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            authorOpenId TEXT NOT NULL,
            title TEXT,
            content TEXT,
            createdAt TEXT DEFAULT (datetime('now')),
            updatedAt TEXT
        );",
        )?;
        guard.execute_batch(
            "CREATE TABLE IF NOT EXISTS reactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            postId INTEGER NOT NULL,
            userOpenId TEXT NOT NULL,
            reaction TEXT NOT NULL,
            createdAt TEXT DEFAULT (datetime('now')),
            UNIQUE(postId, userOpenId, reaction)
        );",
        )?;
        return Ok(());
    }

    let connection = Connection::open(&path)?;

    connection.execute_batch(
        "CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            openId TEXT NOT NULL UNIQUE,
            email TEXT UNIQUE,
            username TEXT UNIQUE,
            passwordHash TEXT,
            name TEXT,
            createdAt TEXT DEFAULT (datetime('now'))
        );",
    )?;

    connection.execute_batch(
        "CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            token TEXT NOT NULL UNIQUE,
            openId TEXT NOT NULL,
            expiresAt TEXT
        );",
    )?;

    connection.execute_batch(
        "CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            authorOpenId TEXT NOT NULL,
            title TEXT NOT NULL,
            content TEXT,
            createdAt TEXT DEFAULT (datetime('now'))
        );",
    )?;

    connection.execute_batch(
        "CREATE TABLE IF NOT EXISTS comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            postId INTEGER NOT NULL,
            authorOpenId TEXT NOT NULL,
            content TEXT,
            createdAt TEXT DEFAULT (datetime('now'))
        );",
    )?;

    connection.execute_batch(
        "CREATE TABLE IF NOT EXISTS follows (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            followerOpenId TEXT NOT NULL,
            targetOpenId TEXT NOT NULL,
            createdAt TEXT DEFAULT (datetime('now'))
        );",
    )?;

    connection.execute_batch(
        "CREATE TABLE IF NOT EXISTS bookmarks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userOpenId TEXT NOT NULL,
            postId INTEGER NOT NULL,
            createdAt TEXT DEFAULT (datetime('now'))
        );",
    )?;

    connection.execute_batch(
        "CREATE TABLE IF NOT EXISTS drafts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            authorOpenId TEXT NOT NULL,
            title TEXT,
            content TEXT,
            createdAt TEXT DEFAULT (datetime('now')),
            updatedAt TEXT
        );",
    )?;

    connection.execute_batch(
        "CREATE TABLE IF NOT EXISTS reactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            postId INTEGER NOT NULL,
            userOpenId TEXT NOT NULL,
            reaction TEXT NOT NULL,
            createdAt TEXT DEFAULT (datetime('now')),
            UNIQUE(postId, userOpenId, reaction)
        );",
    )?;

    DB.set(Mutex::new(connection)).ok();
    Ok(())
}

pub fn get_user_by_email(email: &str) -> Result<Option<User>> {
    let conn = open_conn()?;
    let mut stmt = conn.prepare("SELECT id, openId, email, username, passwordHash, name FROM users WHERE email = ?1")?;
    let row = stmt
        .query_row(params![email], |r| {
            Ok(User {
                id: r.get::<_, i64>(0)?,
                open_id: r.get::<_, String>(1)?,
                email: r.get::<_, Option<String>>(2)?,
                username: r.get::<_, Option<String>>(3)?,
                password_hash: r.get::<_, Option<String>>(4)?,
                name: r.get::<_, Option<String>>(5)?,
            })
        })
        .optional()?;
    Ok(row)
}

pub fn get_user_by_username(username: &str) -> Result<Option<User>> {
    let conn = open_conn()?;
    let mut stmt = conn.prepare("SELECT id, openId, email, username, passwordHash, name FROM users WHERE username = ?1")?;
    let row = stmt
        .query_row(params![username], |r| {
            Ok(User {
                id: r.get::<_, i64>(0)?,
                open_id: r.get::<_, String>(1)?,
                email: r.get::<_, Option<String>>(2)?,
                username: r.get::<_, Option<String>>(3)?,
                password_hash: r.get::<_, Option<String>>(4)?,
                name: r.get::<_, Option<String>>(5)?,
            })
        })
        .optional()?;
    Ok(row)
}

pub fn get_user_by_openid(open_id: &str) -> Result<Option<User>> {
    let conn = open_conn()?;
    let mut stmt = conn.prepare("SELECT id, openId, email, username, passwordHash, name FROM users WHERE openId = ?1")?;
    let row = stmt
        .query_row(params![open_id], |r| {
            Ok(User {
                id: r.get::<_, i64>(0)?,
                open_id: r.get::<_, String>(1)?,
                email: r.get::<_, Option<String>>(2)?,
                username: r.get::<_, Option<String>>(3)?,
                password_hash: r.get::<_, Option<String>>(4)?,
                name: r.get::<_, Option<String>>(5)?,
            })
        })
        .optional()?;
    Ok(row)
}

pub fn get_user_by_id(id: i64) -> Result<Option<User>> {
    let conn = open_conn()?;
    let mut stmt = conn.prepare("SELECT id, openId, email, username, passwordHash, name FROM users WHERE id = ?1")?;
    let row = stmt
        .query_row(params![id], |r| {
            Ok(User {
                id: r.get::<_, i64>(0)?,
                open_id: r.get::<_, String>(1)?,
                email: r.get::<_, Option<String>>(2)?,
                username: r.get::<_, Option<String>>(3)?,
                password_hash: r.get::<_, Option<String>>(4)?,
                name: r.get::<_, Option<String>>(5)?,
            })
        })
        .optional()?;
    Ok(row)
}

pub fn upsert_user_openid(open_id: &str, email: Option<&str>, username: Option<&str>, password_hash: Option<&str>, name: Option<&str>) -> Result<i64> {
    let conn = open_conn()?;

    conn.execute(
        "INSERT OR IGNORE INTO users (openId, email, username, passwordHash, name) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![open_id, email, username, password_hash, name],
    )?;

    conn.execute(
        "UPDATE users SET email = COALESCE(?2, email), username = COALESCE(?3, username), passwordHash = COALESCE(?4, passwordHash), name = COALESCE(?5, name) WHERE openId = ?1",
        params![open_id, email, username, password_hash, name],
    )?;

    let mut stmt = conn.prepare("SELECT id FROM users WHERE openId = ?1")?;
    let id: i64 = stmt.query_row(params![open_id], |r| r.get(0))?;
    Ok(id)
}

pub fn update_user_last_signed_in(open_id: &str) -> Result<()> {
    let conn = open_conn()?;
    conn.execute(
        "UPDATE users SET createdAt = datetime('now') WHERE openId = ?1",
        params![open_id],
    )?;
    Ok(())
}

pub fn create_session(token: &str, open_id: &str, expires_at: Option<&str>) -> Result<()> {
    let conn = open_conn()?;
    conn.execute(
        "INSERT INTO sessions (token, openId, expiresAt) VALUES (?1, ?2, ?3)",
        params![token, open_id, expires_at],
    )?;
    Ok(())
}

pub fn get_openid_by_session(token: &str) -> Result<Option<String>> {
    let conn = open_conn()?;
    let mut stmt = conn.prepare("SELECT openId, expiresAt FROM sessions WHERE token = ?1")?;
    let row = stmt.query_row(params![token], |r| Ok((r.get::<_, String>(0)?, r.get::<_, Option<String>>(1)?))).optional()?;
    if let Some((open_id, _expires_at)) = row {
        return Ok(Some(open_id));
    }
    Ok(None)
}

pub fn delete_session(token: &str) -> Result<()> {
    let conn = open_conn()?;
    conn.execute("DELETE FROM sessions WHERE token = ?1", params![token])?;
    Ok(())
}

pub fn create_post(author_open_id: &str, title: &str, content: &str) -> Result<i64> {
    let conn = open_conn()?;
    conn.execute(
        "INSERT INTO posts (authorOpenId, title, content) VALUES (?1, ?2, ?3)",
        params![author_open_id, title, content],
    )?;
    let id = conn.last_insert_rowid();
    Ok(id)
}

pub fn get_post_by_id(id: i64) -> Result<Option<Post>> {
    let conn = open_conn()?;
    let mut stmt = conn.prepare("SELECT id, authorOpenId, title, content, createdAt FROM posts WHERE id = ?1")?;
    let row = stmt
        .query_row(params![id], |r| {
            Ok(Post {
                id: r.get::<_, i64>(0)?,
                author_open_id: r.get::<_, String>(1)?,
                title: r.get::<_, String>(2)?,
                content: r.get::<_, String>(3)?,
                created_at: r.get::<_, Option<String>>(4)?,
            })
        })
        .optional()?;
    Ok(row)
}

pub fn list_posts() -> Result<Vec<Post>> {
    let conn = open_conn()?;
    let mut stmt = conn.prepare("SELECT id, authorOpenId, title, content, createdAt FROM posts ORDER BY id DESC LIMIT 100")?;
    let mut rows = stmt.query([])?;
    let mut out = Vec::new();
    while let Some(r) = rows.next()? {
        out.push(Post {
            id: r.get::<_, i64>(0)?,
            author_open_id: r.get::<_, String>(1)?,
            title: r.get::<_, String>(2)?,
            content: r.get::<_, String>(3)?,
            created_at: r.get::<_, Option<String>>(4)?,
        });
    }
    Ok(out)
}

pub fn create_comment(post_id: i64, author_open_id: &str, content: &str) -> Result<i64> {
    let conn = open_conn()?;
    conn.execute(
        "INSERT INTO comments (postId, authorOpenId, content) VALUES (?1, ?2, ?3)",
        params![post_id, author_open_id, content],
    )?;
    Ok(conn.last_insert_rowid())
}

pub fn list_comments_for_post(post_id: i64) -> Result<Vec<Comment>> {
    let conn = open_conn()?;
    let mut stmt = conn.prepare("SELECT id, postId, authorOpenId, content, createdAt FROM comments WHERE postId = ?1 ORDER BY id ASC LIMIT 500")?;
    let mut rows = stmt.query(params![post_id])?;
    let mut out = Vec::new();
    while let Some(r) = rows.next()? {
        out.push(Comment {
            id: r.get::<_, i64>(0)?,
            post_id: r.get::<_, i64>(1)?,
            author_open_id: r.get::<_, String>(2)?,
            content: r.get::<_, String>(3)?,
            created_at: r.get::<_, Option<String>>(4)?,
        });
    }
    Ok(out)
}

// Follows
pub fn follow_user(follower_open_id: &str, target_open_id: &str) -> Result<i64> {
    let conn = open_conn()?;
    conn.execute(
        "INSERT INTO follows (followerOpenId, targetOpenId) VALUES (?1, ?2)",
        params![follower_open_id, target_open_id],
    )?;
    Ok(conn.last_insert_rowid())
}

pub fn unfollow_user(follower_open_id: &str, target_open_id: &str) -> Result<()> {
    let conn = open_conn()?;
    conn.execute(
        "DELETE FROM follows WHERE followerOpenId = ?1 AND targetOpenId = ?2",
        params![follower_open_id, target_open_id],
    )?;
    Ok(())
}

pub fn list_followers(target_open_id: &str) -> Result<Vec<String>> {
    let conn = open_conn()?;
    let mut stmt = conn.prepare("SELECT followerOpenId FROM follows WHERE targetOpenId = ?1 ORDER BY id DESC LIMIT 100")?;
    let mut rows = stmt.query(params![target_open_id])?;
    let mut out = Vec::new();
    while let Some(r) = rows.next()? {
        out.push(r.get::<_, String>(0)?);
    }
    Ok(out)
}

// Bookmarks
pub fn add_bookmark(user_open_id: &str, post_id: i64) -> Result<i64> {
    let conn = open_conn()?;
    conn.execute(
        "INSERT INTO bookmarks (userOpenId, postId) VALUES (?1, ?2)",
        params![user_open_id, post_id],
    )?;
    Ok(conn.last_insert_rowid())
}

pub fn remove_bookmark(user_open_id: &str, post_id: i64) -> Result<()> {
    let conn = conn()?;
    conn.execute(
        "DELETE FROM bookmarks WHERE userOpenId = ?1 AND postId = ?2",
        params![user_open_id, post_id],
    )?;
    Ok(())
}

pub fn list_bookmarks(user_open_id: &str, limit: i64) -> Result<Vec<i64>> {
    let conn = conn()?;
    let mut stmt = conn.prepare("SELECT postId FROM bookmarks WHERE userOpenId = ?1 ORDER BY id DESC LIMIT ?2")?;
    let mut rows = stmt.query(params![user_open_id, limit])?;
    let mut out = Vec::new();
    while let Some(r) = rows.next()? {
        out.push(r.get::<_, i64>(0)?);
    }
    Ok(out)
}

// Drafts
pub fn create_draft(author_open_id: &str, title: Option<&str>, content: Option<&str>) -> Result<i64> {
    let conn = conn()?;
    conn.execute(
        "INSERT INTO drafts (authorOpenId, title, content) VALUES (?1, ?2, ?3)",
        params![author_open_id, title, content],
    )?;
    Ok(conn.last_insert_rowid())
}

pub fn update_draft(draft_id: i64, title: Option<&str>, content: Option<&str>) -> Result<()> {
    let conn = conn()?;
    conn.execute(
        "UPDATE drafts SET title = COALESCE(?2, title), content = COALESCE(?3, content), updatedAt = datetime('now') WHERE id = ?1",
        params![draft_id, title, content],
    )?;
    Ok(())
}

pub fn get_draft_by_id(draft_id: i64) -> Result<Option<(i64, String, Option<String>, Option<String>, Option<String>)>> {
    let conn = conn()?;
    let mut stmt = conn.prepare("SELECT id, authorOpenId, title, content, updatedAt FROM drafts WHERE id = ?1")?;
    let row = stmt.query_row(params![draft_id], |r| {
        Ok((
            r.get::<_, i64>(0)?,
            r.get::<_, String>(1)?,
            r.get::<_, Option<String>>(2)?,
            r.get::<_, Option<String>>(3)?,
            r.get::<_, Option<String>>(4)?,
        ))
    }).optional()?;
    Ok(row)
}

pub fn list_drafts_for_user(author_open_id: &str, limit: i64) -> Result<Vec<(i64, Option<String>, Option<String>)>> {
    let conn = conn()?;
    let mut stmt = conn.prepare("SELECT id, title, content FROM drafts WHERE authorOpenId = ?1 ORDER BY id DESC LIMIT ?2")?;
    let mut rows = stmt.query(params![author_open_id, limit])?;
    let mut out = Vec::new();
    while let Some(r) = rows.next()? {
        out.push((r.get::<_, i64>(0)?, r.get::<_, Option<String>>(1)?, r.get::<_, Option<String>>(2)?));
    }
    Ok(out)
}

// Reactions
pub fn add_reaction(post_id: i64, user_open_id: &str, reaction: &str) -> Result<i64> {
    let conn = conn()?;
    conn.execute(
        "INSERT OR IGNORE INTO reactions (postId, userOpenId, reaction) VALUES (?1, ?2, ?3)",
        params![post_id, user_open_id, reaction],
    )?;
    Ok(conn.last_insert_rowid())
}

pub fn remove_reaction(post_id: i64, user_open_id: &str, reaction: &str) -> Result<()> {
    let conn = conn()?;
    conn.execute(
        "DELETE FROM reactions WHERE postId = ?1 AND userOpenId = ?2 AND reaction = ?3",
        params![post_id, user_open_id, reaction],
    )?;
    Ok(())
}

pub fn count_reactions(post_id: i64) -> Result<i64> {
    let conn = conn()?;
    let mut stmt = conn.prepare("SELECT COUNT(*) FROM reactions WHERE postId = ?1")?;
    let cnt: i64 = stmt.query_row(params![post_id], |r| r.get(0))?;
    Ok(cnt)
}

pub fn list_reactions_for_post(post_id: i64) -> Result<Vec<(String, String)>> {
    let conn = conn()?;
    let mut stmt = conn.prepare("SELECT userOpenId, reaction FROM reactions WHERE postId = ?1 ORDER BY id ASC")?;
    let mut rows = stmt.query(params![post_id])?;
    let mut out = Vec::new();
    while let Some(r) = rows.next()? {
        out.push((r.get::<_, String>(0)?, r.get::<_, String>(1)?));
    }
    Ok(out)
}

// Public helper to open an independent Connection to the same DB file.
// This is useful for submodules that need their own connection scope.
pub fn open_conn() -> Result<Connection> {
    let path = db_path();
    let conn = Connection::open(path)?;
    Ok(conn)
}

// Public helper to execute a batch SQL on the global connection.
pub fn execute_batch_sql(sql: &str) -> Result<()> {
    let conn = conn()?;
    conn.execute_batch(sql)?;
    Ok(())
}
 
