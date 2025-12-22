use tempfile::NamedTempFile;
use std::env;
use blozhik_backend::db;
use blozhik_backend::services::post_service::PostService;

#[tokio::test]
async fn create_publish_flow() {
    let tmp = NamedTempFile::new().unwrap();
    let path = tmp.path().to_string_lossy().to_string();
    let database_url = format!("sqlite://{}", path);
    env::set_var("DATABASE_URL", &database_url);

    let pool = db::create_pool().await.expect("create pool");
    db::run_migrations(&pool).await.expect("migrate");

    // create an author user required by FK
    sqlx::query("INSERT INTO users (username, display_name, email, role) VALUES (?1, ?2, ?3, ?4)")
        .bind("author1")
        .bind("Author One")
        .bind("author@example.com")
        .bind("author")
        .execute(&pool)
        .await
        .expect("insert user");

    // Use PostService directly
    let post = PostService::create(&pool, 1, "Hello", "Content", None).await.expect("create");
    assert_eq!(post.title, "Hello");

    let list = PostService::list(&pool, 1, 10).await.expect("list");
    assert!(list.len() >= 1);
}
