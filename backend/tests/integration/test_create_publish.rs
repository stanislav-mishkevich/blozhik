use crate::helpers::init_tracing;
use tempfile::NamedTempFile;
use sqlx::SqlitePool;
use std::env;
use serde_json::json;
use serde::Deserialize;

#[derive(Deserialize)]
struct PostResp { id: i64, title: String }

#[tokio::test]
async fn create_publish_flow() {
    init_tracing();

    let tmp = NamedTempFile::new().unwrap();
    let path = tmp.path().to_string_lossy().to_string();
    let database_url = format!("sqlite://{}", path);
    env::set_var("DATABASE_URL", &database_url);

    let pool = backend::db::create_pool().await.expect("create pool");
    backend::db::run_migrations(&pool).await.expect("migrate");

    // Start the HTTP server in test mode
    let addr = backend::tests::http_integration::spawn_server().await;

    // Create post via HTTP API
    let client = reqwest::Client::new();
    let payload = json!({"title": "Integration Test", "body_markdown": "Hello from test"});
    let res = client.post(&format!("http://{}/api/posts", addr)).json(&payload).send().await.expect("request");
    assert_eq!(res.status(), 201);
    let body: PostResp = res.json().await.expect("json");
    assert_eq!(body.title, "Integration Test");

    // Fetch list
    let res2 = client.get(&format!("http://{}/api/posts", addr)).send().await.expect("list");
    assert_eq!(res2.status(), 200);
    let list: serde_json::Value = res2.json().await.expect("list json");
    assert!(list.get("items").is_some());
}
