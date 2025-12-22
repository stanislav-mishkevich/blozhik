use crate::helpers::init_tracing;
use tempfile::NamedTempFile;
use std::env;
use serde::{Deserialize};
use serde_json::json;

#[derive(Deserialize)]
struct ProfileResp { id: i64, username: String, follower_count: i64 }

#[tokio::test]
async fn profile_follow_flow() {
    init_tracing();

    let tmp = NamedTempFile::new().unwrap();
    let path = tmp.path().to_string_lossy().to_string();
    let database_url = format!("sqlite://{}", path);
    env::set_var("DATABASE_URL", &database_url);

    let pool = backend::db::create_pool().await.expect("create pool");
    backend::db::run_migrations(&pool).await.expect("migrate");

    let addr = backend::tests::http_integration::spawn_server().await;

    // create two users: alice and bob
    sqlx::query("INSERT INTO users (username, display_name, email, role) VALUES (?1, ?2, ?3, ?4)")
        .bind("alice")
        .bind("Alice")
        .bind("alice@example.com")
        .bind("reader")
        .execute(&pool)
        .await
        .expect("insert alice");

    sqlx::query("INSERT INTO users (username, display_name, email, role) VALUES (?1, ?2, ?3, ?4)")
        .bind("bob")
        .bind("Bob")
        .bind("bob@example.com")
        .bind("reader")
        .execute(&pool)
        .await
        .expect("insert bob");

    let alice_id: i64 = sqlx::query_scalar("SELECT id FROM users WHERE username = ?1").bind("alice").fetch_one(&pool).await.expect("alice id");
    let bob_id: i64 = sqlx::query_scalar("SELECT id FROM users WHERE username = ?1").bind("bob").fetch_one(&pool).await.expect("bob id");

    // create JWT for alice
    let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "test-secret".to_string());
    let token = backend::auth::jwt::encode_jwt(&alice_id.to_string(), &secret, 3600).expect("encode jwt");

    let client = reqwest::Client::new();

    // alice follows bob
    let res = client.post(&format!("http://{}/api/profiles/{}/follow", addr, "bob"))
        .header("Authorization", format!("Bearer {}", token))
        .json(&json!({"follow": true}))
        .send().await.expect("follow request");
    assert_eq!(res.status(), 200);

    // get bob profile and check follower_count == 1
    let res2 = client.get(&format!("http://{}/api/profiles/{}", addr, "bob")).send().await.expect("profile request");
    assert_eq!(res2.status(), 200);
    let p: serde_json::Value = res2.json().await.expect("profile json");
    let followers = p.get("follower_count").and_then(|v| v.as_i64()).expect("follower_count");
    assert_eq!(followers, 1);

    // alice unfollows bob
    let res3 = client.post(&format!("http://{}/api/profiles/{}/follow", addr, "bob"))
        .header("Authorization", format!("Bearer {}", token))
        .json(&json!({"follow": false}))
        .send().await.expect("unfollow request");
    assert_eq!(res3.status(), 200);

    // get bob profile and check follower_count == 0
    let res4 = client.get(&format!("http://{}/api/profiles/{}", addr, "bob")).send().await.expect("profile request");
    assert_eq!(res4.status(), 200);
    let p2: serde_json::Value = res4.json().await.expect("profile json");
    let followers2 = p2.get("follower_count").and_then(|v| v.as_i64()).expect("follower_count");
    assert_eq!(followers2, 0);
}
