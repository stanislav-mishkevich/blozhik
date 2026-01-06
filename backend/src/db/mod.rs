pub use sqlx::sqlite::SqlitePool;
use std::env;

pub async fn create_pool() -> Result<SqlitePool, sqlx::Error> {
    let database_url = env::var("DATABASE_URL").unwrap_or_else(|_| "sqlite:./blozhik.db".to_string());
    let pool = SqlitePool::connect(&database_url).await?;
    Ok(pool)
}

pub async fn run_migrations(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    // Run migrations from backend/migrations
    sqlx::migrate!("./migrations").run(pool).await?;
    Ok(())
}
