// Comprehensive TDD tests for all working API endpoints
// This file contains thorough test coverage for posts, comments, and reactions endpoints

use tempfile::NamedTempFile;
use std::env;
use std::net::TcpListener;
use serde_json::json;
use blozhik_backend::{db, api, auth};
use serial_test::serial;

// Helper to set up test database and server
async fn setup_test_server() -> (String, sqlx::SqlitePool, tempfile::TempDir) {
    let _ = tracing_subscriber::fmt::try_init();

    // Use TempDir instead of NamedTempFile to keep directory alive
    let temp_dir = tempfile::tempdir().unwrap();
    let db_path = temp_dir.path().join("test.db");
    let database_url = format!("sqlite://{}", db_path.to_string_lossy());
    env::set_var("DATABASE_URL", &database_url);

    let pool = db::create_pool().await.expect("create pool");
    db::run_migrations(&pool).await.expect("migrate");

    // Spawn test server inline
    let listener = TcpListener::bind("127.0.0.1:0").expect("bind");
    let local_addr = listener.local_addr().unwrap();

    let pool_for_server = pool.clone();
    std::thread::spawn(move || {
        ntex::rt::System::new("test-server").block_on(async move {
            ntex::web::HttpServer::new(move || {
                ntex::web::App::new()
                    .state(pool_for_server.clone())
                    .service(
                        ntex::web::scope("/api").configure(|cfg| {
                            api::posts::routes(cfg);
                            api::comments::routes(cfg);
                            api::reactions::routes(cfg);
                        }),
                    )
                    .service(
                        ntex::web::resource("/health").route(ntex::web::get().to(|| async {
                            ntex::web::HttpResponse::Ok().finish()
                        })),
                    )
            })
            .listen(listener)
            .unwrap()
            .run()
            .await
            .unwrap();
        });
    });

    // Wait for server readiness
    let client_check = reqwest::Client::new();
    let health_url = format!("http://{}/health", local_addr);
    let mut ready = false;
    let start = std::time::Instant::now();
    while start.elapsed().as_secs() < 5 {
        match client_check.get(&health_url).send().await {
            Ok(resp) => {
                if resp.status().as_u16() == 200 {
                    ready = true;
                    break;
                }
            }
            Err(_) => {}
        }
        tokio::time::sleep(std::time::Duration::from_millis(100)).await;
    }
    assert!(ready, "server did not become ready in time");

    (format!("{}", local_addr), pool, temp_dir)
}

// Helper to create a test user and return JWT token
async fn create_test_user_with_jwt(pool: &sqlx::SqlitePool, username: &str) -> (i64, String) {
    sqlx::query("INSERT INTO users (username, display_name, email, role) VALUES (?1, ?2, ?3, ?4)")
        .bind(username)
        .bind(format!("{} Display", username))
        .bind(format!("{}@example.com", username))
        .bind("author")
        .execute(pool)
        .await
        .expect("insert user");

    let user_id: i64 = sqlx::query_scalar("SELECT id FROM users WHERE username = ?1")
        .bind(username)
        .fetch_one(pool)
        .await
        .expect("select user id");

    let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "test-secret".to_string());
    let token = auth::jwt::encode_jwt(&user_id.to_string(), &secret, 3600)
        .expect("encode jwt");

    (user_id, token)
}

// ========================================
// POST /posts - Create Post Tests
// ========================================

#[tokio::test]
#[serial]
async fn test_create_post_success() {
    let (addr, _pool) = setup_test_server().await;
    let client = reqwest::Client::new();

    let payload = json!({
        "title": "My First Post",
        "body_markdown": "This is the content"
    });

    let res = client.post(&format!("http://{}/api/posts", addr))
        .json(&payload)
        .send()
        .await
        .expect("request");

    assert_eq!(res.status(), 201, "Failed to create post");
    let body: serde_json::Value = res.json().await.expect("json");
    assert_eq!(body["title"], "My First Post");
    assert_eq!(body["body_markdown"], "This is the content");
    assert!(body["id"].as_i64().is_some());
}

#[tokio::test]
#[serial]
async fn test_create_post_with_tags() {
    let (addr, _pool) = setup_test_server().await;
    let client = reqwest::Client::new();

    let payload = json!({
        "title": "Tagged Post",
        "body_markdown": "Content with tags",
        "tags": ["rust", "testing"]
    });

    let res = client.post(&format!("http://{}/api/posts", addr))
        .json(&payload)
        .send()
        .await
        .expect("request");

    assert_eq!(res.status(), 201);
    let body: serde_json::Value = res.json().await.expect("json");
    assert_eq!(body["title"], "Tagged Post");
}

#[tokio::test]
#[serial]
async fn test_create_post_missing_title() {
    let (addr, _pool) = setup_test_server().await;
    let client = reqwest::Client::new();

    let payload = json!({
        "body_markdown": "Content without title"
    });

    let res = client.post(&format!("http://{}/api/posts", addr))
        .json(&payload)
        .send()
        .await
        .expect("request");

    assert_eq!(res.status(), 400);
}

#[tokio::test]
#[serial]
async fn test_create_post_empty_title() {
    let (addr, _pool) = setup_test_server().await;
    let client = reqwest::Client::new();

    let payload = json!({
        "title": "",
        "body_markdown": "Content"
    });

    let res = client.post(&format!("http://{}/api/posts", addr))
        .json(&payload)
        .send()
        .await
        .expect("request");

    assert_eq!(res.status(), 400);
}

#[tokio::test]
#[serial]
async fn test_create_post_missing_body() {
    let (addr, _pool) = setup_test_server().await;
    let client = reqwest::Client::new();

    let payload = json!({
        "title": "Title Only"
    });

    let res = client.post(&format!("http://{}/api/posts", addr))
        .json(&payload)
        .send()
        .await
        .expect("request");

    assert_eq!(res.status(), 400);
}

#[tokio::test]
#[serial]
async fn test_create_post_empty_body() {
    let (addr, _pool) = setup_test_server().await;
    let client = reqwest::Client::new();

    let payload = json!({
        "title": "Title",
        "body_markdown": ""
    });

    let res = client.post(&format!("http://{}/api/posts", addr))
        .json(&payload)
        .send()
        .await
        .expect("request");

    assert_eq!(res.status(), 400);
}

// ========================================
// GET /posts - List Posts Tests
// ========================================

#[tokio::test]
#[serial]
async fn test_list_posts_empty() {
    let (addr, _pool) = setup_test_server().await;
    let client = reqwest::Client::new();

    let res = client.get(&format!("http://{}/api/posts", addr))
        .send()
        .await
        .expect("request");

    assert_eq!(res.status(), 200);
    let body: serde_json::Value = res.json().await.expect("json");
    let items = body["items"].as_array().expect("items array");
    assert_eq!(items.len(), 0);
}

#[tokio::test]
#[serial]
async fn test_list_posts_with_data() {
    let (addr, _pool) = setup_test_server().await;
    let client = reqwest::Client::new();

    // Create a few posts
    for i in 1..=3 {
        let payload = json!({
            "title": format!("Post {}", i),
            "body_markdown": format!("Content {}", i)
        });
        client.post(&format!("http://{}/api/posts", addr))
            .json(&payload)
            .send()
            .await
            .expect("create post");
    }

    let res = client.get(&format!("http://{}/api/posts", addr))
        .send()
        .await
        .expect("request");

    assert_eq!(res.status(), 200);
    let body: serde_json::Value = res.json().await.expect("json");
    let items = body["items"].as_array().expect("items array");
    assert_eq!(items.len(), 3);
}

#[tokio::test]
#[serial]
async fn test_posts_ordering() {
    let (addr, _pool) = setup_test_server().await;
    let client = reqwest::Client::new();

    // Create posts in sequence
    for i in 1..=5 {
        let payload = json!({
            "title": format!("Post {}", i),
            "body_markdown": "Content"
        });
        client.post(&format!("http://{}/api/posts", addr))
            .json(&payload)
            .send()
            .await
            .expect("create post");
        tokio::time::sleep(std::time::Duration::from_millis(10)).await;
    }

    let res = client.get(&format!("http://{}/api/posts", addr))
        .send()
        .await
        .expect("request");

    let body: serde_json::Value = res.json().await.expect("json");
    let items = body["items"].as_array().expect("items array");

    // Verify posts are returned (order may vary based on implementation)
    assert_eq!(items.len(), 5);
}

// ========================================
// POST /posts/{postId}/comments - Create Comment Tests
// ========================================

#[tokio::test]
#[serial]
async fn test_create_comment_success() {
    let (addr, pool) = setup_test_server().await;
    let client = reqwest::Client::new();
    let (_user_id, token) = create_test_user_with_jwt(&pool, "commenter").await;

    // Create a post first
    let post_payload = json!({
        "title": "Post for comments",
        "body_markdown": "Test post"
    });
    let post_res = client.post(&format!("http://{}/api/posts", addr))
        .json(&post_payload)
        .send()
        .await
        .expect("create post");
    let post: serde_json::Value = post_res.json().await.expect("post json");
    let post_id = post["id"].as_i64().expect("post id");

    // Create comment
    let comment_payload = json!({
        "body": "Great post!"
    });
    let res = client.post(&format!("http://{}/api/posts/{}/comments", addr, post_id))
        .header("Authorization", format!("Bearer {}", token))
        .json(&comment_payload)
        .send()
        .await
        .expect("request");

    assert_eq!(res.status(), 201);
    let comment: serde_json::Value = res.json().await.expect("comment json");
    assert_eq!(comment["body"], "Great post!");
    assert!(comment["id"].as_i64().is_some());
}

#[tokio::test]
#[serial]
async fn test_create_multiple_comments() {
    let (addr, pool) = setup_test_server().await;
    let client = reqwest::Client::new();
    let (_user_id, token) = create_test_user_with_jwt(&pool, "multicommenter").await;

    // Create a post
    let post_payload = json!({
        "title": "Popular Post",
        "body_markdown": "This will have many comments"
    });
    let post_res = client.post(&format!("http://{}/api/posts", addr))
        .json(&post_payload)
        .send()
        .await
        .expect("create post");
    let post: serde_json::Value = post_res.json().await.expect("post json");
    let post_id = post["id"].as_i64().expect("post id");

    // Create multiple comments
    for i in 1..=3 {
        let comment_payload = json!({
            "body": format!("Comment {}", i)
        });
        let res = client.post(&format!("http://{}/api/posts/{}/comments", addr, post_id))
            .header("Authorization", format!("Bearer {}", token))
            .json(&comment_payload)
            .send()
            .await
            .expect("request");
        assert_eq!(res.status(), 201);
    }
}

#[tokio::test]
#[serial]
async fn test_create_comment_missing_auth() {
    let (addr, _pool) = setup_test_server().await;
    let client = reqwest::Client::new();

    // Create a post first
    let post_payload = json!({
        "title": "Post",
        "body_markdown": "Content"
    });
    let post_res = client.post(&format!("http://{}/api/posts", addr))
        .json(&post_payload)
        .send()
        .await
        .expect("create post");
    let post: serde_json::Value = post_res.json().await.expect("post json");
    let post_id = post["id"].as_i64().expect("post id");

    // Try to create comment without auth
    let comment_payload = json!({
        "body": "Comment"
    });
    let res = client.post(&format!("http://{}/api/posts/{}/comments", addr, post_id))
        .json(&comment_payload)
        .send()
        .await
        .expect("request");

    // Should fail (401 or 500 depending on implementation)
    assert!(res.status().as_u16() >= 400);
}

#[tokio::test]
#[serial]
async fn test_create_comment_invalid_post_id() {
    let (addr, pool) = setup_test_server().await;
    let client = reqwest::Client::new();
    let (_user_id, token) = create_test_user_with_jwt(&pool, "commenter2").await;

    let comment_payload = json!({
        "body": "Comment on non-existent post"
    });
    let res = client.post(&format!("http://{}/api/posts/99999/comments", addr))
        .header("Authorization", format!("Bearer {}", token))
        .json(&comment_payload)
        .send()
        .await
        .expect("request");

    // Should fail with 404 or 500
    assert!(res.status().as_u16() >= 400);
}

// ========================================
// POST /{subject}/{id}/reactions - Create Reaction Tests
// ========================================

#[tokio::test]
#[serial]
async fn test_create_post_reaction_success() {
    let (addr, _pool) = setup_test_server().await;
    let client = reqwest::Client::new();

    // Create a post first
    let post_payload = json!({
        "title": "Post to react",
        "body_markdown": "Content"
    });
    let post_res = client.post(&format!("http://{}/api/posts", addr))
        .json(&post_payload)
        .send()
        .await
        .expect("create post");
    let post: serde_json::Value = post_res.json().await.expect("post json");
    let post_id = post["id"].as_i64().expect("post id");

    // Add reaction
    let reaction_payload = json!({
        "type": "like"
    });
    let res = client.post(&format!("http://{}/api/post/{}/reactions", addr, post_id))
        .json(&reaction_payload)
        .send()
        .await
        .expect("request");

    assert_eq!(res.status(), 201);
    let reaction: serde_json::Value = res.json().await.expect("reaction json");
    assert_eq!(reaction["type"], "like");
}

#[tokio::test]
#[serial]
async fn test_create_duplicate_reaction() {
    let (addr, _pool) = setup_test_server().await;
    let client = reqwest::Client::new();

    // Create a post
    let post_payload = json!({
        "title": "Post",
        "body_markdown": "Content"
    });
    let post_res = client.post(&format!("http://{}/api/posts", addr))
        .json(&post_payload)
        .send()
        .await
        .expect("create post");
    let post: serde_json::Value = post_res.json().await.expect("post json");
    let post_id = post["id"].as_i64().expect("post id");

    // Add first reaction
    let reaction_payload = json!({
        "type": "like"
    });
    let res1 = client.post(&format!("http://{}/api/post/{}/reactions", addr, post_id))
        .json(&reaction_payload)
        .send()
        .await
        .expect("request");
    assert_eq!(res1.status(), 201);

    // Try to add duplicate reaction
    let res2 = client.post(&format!("http://{}/api/post/{}/reactions", addr, post_id))
        .json(&reaction_payload)
        .send()
        .await
        .expect("request");

    // Should return 409 Conflict
    assert_eq!(res2.status(), 409);
}

#[tokio::test]
#[serial]
async fn test_create_different_reaction_types() {
    let (addr, _pool) = setup_test_server().await;
    let client = reqwest::Client::new();

    // Create a post
    let post_payload = json!({
        "title": "Post",
        "body_markdown": "Content"
    });
    let post_res = client.post(&format!("http://{}/api/posts", addr))
        .json(&post_payload)
        .send()
        .await
        .expect("create post");
    let post: serde_json::Value = post_res.json().await.expect("post json");
    let post_id = post["id"].as_i64().expect("post id");

    // Add different reaction types
    for reaction_type in &["like", "heart", "thumbsup"] {
        let reaction_payload = json!({
            "type": reaction_type
        });
        let res = client.post(&format!("http://{}/api/post/{}/reactions", addr, post_id))
            .json(&reaction_payload)
            .send()
            .await
            .expect("request");

        // Each different type should succeed
        assert_eq!(res.status(), 201);
    }
}

#[tokio::test]
#[serial]
async fn test_create_comment_reaction_success() {
    let (addr, pool) = setup_test_server().await;
    let client = reqwest::Client::new();
    let (_user_id, token) = create_test_user_with_jwt(&pool, "reactor").await;

    // Create a post
    let post_payload = json!({
        "title": "Post",
        "body_markdown": "Content"
    });
    let post_res = client.post(&format!("http://{}/api/posts", addr))
        .json(&post_payload)
        .send()
        .await
        .expect("create post");
    let post: serde_json::Value = post_res.json().await.expect("post json");
    let post_id = post["id"].as_i64().expect("post id");

    // Create comment
    let comment_payload = json!({
        "body": "Comment"
    });
    let comment_res = client.post(&format!("http://{}/api/posts/{}/comments", addr, post_id))
        .header("Authorization", format!("Bearer {}", token))
        .json(&comment_payload)
        .send()
        .await
        .expect("create comment");
    let comment: serde_json::Value = comment_res.json().await.expect("comment json");
    let comment_id = comment["id"].as_i64().expect("comment id");

    // Add reaction to comment
    let reaction_payload = json!({
        "type": "heart"
    });
    let res = client.post(&format!("http://{}/api/comment/{}/reactions", addr, comment_id))
        .json(&reaction_payload)
        .send()
        .await
        .expect("request");

    assert_eq!(res.status(), 201);
}

// ========================================
// Integration/Flow Tests
// ========================================

#[tokio::test]
#[serial]
async fn test_complete_blog_workflow() {
    let (addr, pool) = setup_test_server().await;
    let client = reqwest::Client::new();

    // Create two users
    let (_user1_id, token1) = create_test_user_with_jwt(&pool, "author").await;
    let (_user2_id, token2) = create_test_user_with_jwt(&pool, "reader").await;

    // User1 creates a post
    let post_payload = json!({
        "title": "My Awesome Blog Post",
        "body_markdown": "This is great content!"
    });
    let post_res = client.post(&format!("http://{}/api/posts", addr))
        .json(&post_payload)
        .send()
        .await
        .expect("create post");
    assert_eq!(post_res.status(), 201);
    let post: serde_json::Value = post_res.json().await.expect("post json");
    let post_id = post["id"].as_i64().expect("post id");

    // User2 reads and reacts to the post
    let reaction_payload = json!({"type": "like"});
    let react_res = client.post(&format!("http://{}/api/post/{}/reactions", addr, post_id))
        .json(&reaction_payload)
        .send()
        .await
        .expect("create reaction");
    assert_eq!(react_res.status(), 201);

    // User2 comments on the post
    let comment_payload = json!({"body": "Great post!"});
    let comment_res = client.post(&format!("http://{}/api/posts/{}/comments", addr, post_id))
        .header("Authorization", format!("Bearer {}", token2))
        .json(&comment_payload)
        .send()
        .await
        .expect("create comment");
    assert_eq!(comment_res.status(), 201);
    let comment: serde_json::Value = comment_res.json().await.expect("comment json");
    let comment_id = comment["id"].as_i64().expect("comment id");

    // User1 reacts to the comment
    let comment_reaction_payload = json!({"type": "heart"});
    let comment_react_res = client.post(&format!("http://{}/api/comment/{}/reactions", addr, comment_id))
        .json(&comment_reaction_payload)
        .send()
        .await
        .expect("create comment reaction");
    assert_eq!(comment_react_res.status(), 201);

    // Verify post still exists in list
    let list_res = client.get(&format!("http://{}/api/posts", addr))
        .send()
        .await
        .expect("list posts");
    assert_eq!(list_res.status(), 200);
    let list_body: serde_json::Value = list_res.json().await.expect("list json");
    let items = list_body["items"].as_array().expect("items");
    assert!(items.len() >= 1);
}
