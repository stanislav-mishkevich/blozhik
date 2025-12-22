use crate::helpers::init_tracing;
use tempfile::NamedTempFile;
use std::env;
use serde::{Deserialize};
use serde_json::json;

#[derive(Deserialize)]
struct CommentResp { id: i64, body: String }

#[tokio::test]
async fn create_comment_flow() {
    init_tracing();

    let tmp = NamedTempFile::new().unwrap();
    let path = tmp.path().to_string_lossy().to_string();
    let database_url = format!("sqlite://{}", path);
    env::set_var("DATABASE_URL", &database_url);

    let pool = backend::db::create_pool().await.expect("create pool");
    backend::db::run_migrations(&pool).await.expect("migrate");

    let addr = backend::tests::http_integration::spawn_server().await;

    // create a test user (author) required by FK and auth
    sqlx::query("INSERT INTO users (username, display_name, email, role) VALUES (?1, ?2, ?3, ?4)")
        .bind("testuser")
        .bind("Test User")
        .bind("test@example.com")
        .bind("author")
        .execute(&pool)
        .await
        .expect("insert user");

    let user_id: i64 = sqlx::query_scalar("SELECT id FROM users WHERE username = ?1")
        .bind("testuser")
        .fetch_one(&pool)
        .await
        .expect("select user id");

    // create a JWT for the user
    let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "test-secret".to_string());
    let token = backend::auth::jwt::encode_jwt(&user_id.to_string(), &secret, 3600).expect("encode jwt");

    // create a post to comment on
    let client = reqwest::Client::new();
    let payload = json!({"title": "For comments", "body_markdown": "post body"});
    let res = client.post(&format!("http://{}/api/posts", addr)).json(&payload).send().await.expect("request");
    assert_eq!(res.status(), 201);
    let post: serde_json::Value = res.json().await.expect("json");
    let post_id = post.get("id").and_then(|v| v.as_i64()).expect("post id");

    // add comment with Authorization: Bearer <jwt>
    let comment_payload = json!({"body": "Nice post!"});
    let res2 = client.post(&format!("http://{}/api/posts/{}/comments", addr, post_id))
        .header("Authorization", format!("Bearer {}", token))
        .json(&comment_payload)
        .send()
        .await
        .expect("request");
    assert_eq!(res2.status(), 201);
    let comment: CommentResp = res2.json().await.expect("comment json");
    assert_eq!(comment.body, "Nice post!");
}
