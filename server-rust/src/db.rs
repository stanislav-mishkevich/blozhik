use sqlx::{SqlitePool, FromRow};
use std::env;

#[derive(Debug, FromRow, serde::Serialize)]
pub struct User {
    pub id: i64,
    pub open_id: Option<String>,
    pub email: Option<String>,
    pub username: Option<String>,
    pub password_hash: Option<String>,
    pub name: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

pub async fn init_db() -> anyhow::Result<SqlitePool> {
    let db_url = env::var("DATABASE_URL").unwrap_or_else(|_| "./blozhik.db".to_string());
    let file_path = db_url.replace("sqlite:", "").replace("file:", "");
    let pool = SqlitePool::connect(&format!("sqlite://{}", file_path)).await?;

    // Create minimal users table if not exists
    sqlx::query(r#"
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            open_id TEXT,
            email TEXT UNIQUE,
            username TEXT,
            password_hash TEXT,
            name TEXT,
            created_at TEXT,
            updated_at TEXT
        )
    "#)
    .execute(&pool)
    .await?;

    Ok(pool)
}

pub async fn get_user_by_email(pool: &SqlitePool, email: &str) -> anyhow::Result<Option<User>> {
    let rec = sqlx::query_as::<_, User>("SELECT * FROM users WHERE email = ? LIMIT 1")
        .bind(email)
        .fetch_optional(pool)
        .await?;
    Ok(rec)
}

pub async fn get_user_by_id(pool: &SqlitePool, id: i64) -> anyhow::Result<Option<User>> {
    let rec = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = ? LIMIT 1")
        .bind(id)
        .fetch_optional(pool)
        .await?;
    Ok(rec)
}

pub async fn create_user(pool: &SqlitePool, open_id: Option<&str>, email: &str, username: &str, password_hash: &str) -> anyhow::Result<i64> {
    let now = chrono::Utc::now().to_rfc3339();
    let res = sqlx::query("INSERT INTO users (open_id, email, username, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)")
        .bind(open_id)
        .bind(email)
        .bind(username)
        .bind(password_hash)
        .bind(&now)
        .bind(&now)
        .execute(pool)
        .await?;
    Ok(res.last_insert_rowid())
}