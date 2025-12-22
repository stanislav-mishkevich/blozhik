use crate::helpers::init_tracing;
use tempfile::NamedTempFile;
use std::env;
use serde::{Deserialize};
use serde_json::json;

#[derive(Deserialize)]
struct SearchRespItem { id: i64, title: String, slug: Option<String> }

#[tokio::test]
async fn search_posts_flow() {
    init_tracing();

    let tmp = NamedTempFile::new().unwrap();
    let path = tmp.path().to_string_lossy().to_string();
    let database_url = format!("sqlite://{}", path);
    env::set_var("DATABASE_URL", &database_url);

    let pool = backend::db::create_pool().await.expect("create pool");
    backend::db::run_migrations(&pool).await.expect("migrate");

    let addr = backend::tests::http_integration::spawn_server().await;

    let client = reqwest::Client::new();
    // create two posts
    let p1 = json!({"title": "Rust FTS5 Guide", "body_markdown": "Search with SQLite FTS5"});
    let p2 = json!({"title": "Cooking Tips", "body_markdown": "How to cook"});

    let res1 = client.post(&format!("http://{}/api/posts", addr)).json(&p1).send().await.expect("request");
    assert_eq!(res1.status(), 201);
    let res2 = client.post(&format!("http://{}/api/posts", addr)).json(&p2).send().await.expect("request");
    assert_eq!(res2.status(), 201);

    // query search for "SQLite"
    let res = client.get(&format!("http://{}/api/search?q=SQLite", addr)).send().await.expect("request");
    assert_eq!(res.status(), 200);
    let body: serde_json::Value = res.json().await.expect("json");
    let items = body.get("items").and_then(|v| v.as_array()).expect("items array");
    assert!(items.len() >= 1);
}
