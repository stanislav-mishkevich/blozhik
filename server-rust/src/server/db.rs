use anyhow::Result;
use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use std::path::Path;
use once_cell::sync::OnceCell;
use std::sync::Mutex;

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
    std::env::var("DATABASE_PATH").unwrap_or_else(|_| "./blozhik.db".to_string())
}

static DB: OnceCell<Mutex<Connection>> = OnceCell::new();

fn conn() -> Result<std::sync::MutexGuard<'static, Connection>> {
    let db_mutex = DB.get().ok_or_else(|| anyhow::anyhow!("DB not initialized"))?;
    Ok(db_mutex.lock().expect("db mutex poisoned"))
}

pub fn init_db() -> Result<()> {
    let path = db_path();
    if !Path::new(&path).exists() {
        // file will be created by opening connection
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

    DB.set(Mutex::new(connection)).ok();
    Ok(())
}

pub fn get_user_by_email(email: &str) -> Result<Option<User>> {
    let conn = conn()?;
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
    let conn = conn()?;
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
    let conn = conn()?;
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
    let conn = conn()?;
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
    let conn = conn()?;

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
    let conn = conn()?;
    conn.execute(
        "UPDATE users SET createdAt = datetime('now') WHERE openId = ?1",
        params![open_id],
    )?;
    Ok(())
}

pub fn create_session(token: &str, open_id: &str, expires_at: Option<&str>) -> Result<()> {
    let conn = conn()?;
    conn.execute(
        "INSERT INTO sessions (token, openId, expiresAt) VALUES (?1, ?2, ?3)",
        params![token, open_id, expires_at],
    )?;
    Ok(())
}

pub fn get_openid_by_session(token: &str) -> Result<Option<String>> {
    let conn = conn()?;
    let mut stmt = conn.prepare("SELECT openId, expiresAt FROM sessions WHERE token = ?1")?;
    let row = stmt.query_row(params![token], |r| Ok((r.get::<_, String>(0)?, r.get::<_, Option<String>>(1)?))).optional()?;
    if let Some((open_id, _expires_at)) = row {
        return Ok(Some(open_id));
    }
    Ok(None)
}

pub fn delete_session(token: &str) -> Result<()> {
    let conn = conn()?;
    conn.execute("DELETE FROM sessions WHERE token = ?1", params![token])?;
    Ok(())
}

pub fn create_post(author_open_id: &str, title: &str, content: &str) -> Result<i64> {
    let conn = conn()?;
    conn.execute(
        "INSERT INTO posts (authorOpenId, title, content) VALUES (?1, ?2, ?3)",
        params![author_open_id, title, content],
    )?;
    let id = conn.last_insert_rowid();
    Ok(id)
}

pub fn get_post_by_id(id: i64) -> Result<Option<Post>> {
    let conn = conn()?;
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
    let conn = conn()?;
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
    let conn = conn()?;
    conn.execute(
        "INSERT INTO comments (postId, authorOpenId, content) VALUES (?1, ?2, ?3)",
        params![post_id, author_open_id, content],
    )?;
    Ok(conn.last_insert_rowid())
}

pub fn list_comments_for_post(post_id: i64) -> Result<Vec<Comment>> {
    let conn = conn()?;
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
 
