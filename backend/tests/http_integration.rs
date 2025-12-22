use tempfile::NamedTempFile;
use std::env;
use std::net::TcpListener;
use reqwest::Client;

use blozhik_backend::db;

pub async fn spawn_server() -> String {
    // bind to an available port
    let listener = TcpListener::bind("127.0.0.1:0").expect("bind");
    let addr = listener.local_addr().unwrap();

    // start server in background with a /health endpoint for readiness
    let server = std::thread::spawn(move || {
        // start a new ntex runtime in this thread and block on the server
        ntex::rt::System::new("test-server").block_on(async move {
            ntex::web::HttpServer::new(move || {
                ntex::web::App::new()
                    .service(
                        ntex::web::scope("/api").configure(|cfg| {
                            // register API routes (posts, comments, reactions)
                            blozhik_backend::api::posts::routes(cfg);
                            blozhik_backend::api::comments::routes(cfg);
                            blozhik_backend::api::reactions::routes(cfg);
                        }),
                    )
                    .service(
                        ntex::web::resource("/health").route(ntex::web::get().to(|| async { ntex::web::HttpResponse::Ok().finish() })),
                    )
            })
            .listen(listener)
            .unwrap()
            .run()
            .await
            .unwrap();
        });
    });

    // wait for server readiness by polling /health
    let client_check = Client::new();
    let health_url = format!("http://{}/health", addr);
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
            Err(_) => { /* not ready yet */ }
        }
        tokio::time::sleep(std::time::Duration::from_millis(100)).await;
    }
    assert!(ready, "server did not become ready in time");

    // detach server thread; return address as string
    std::mem::drop(server);
    format!("{}", addr)
}

#[tokio::test]
async fn http_create_publish_flow() {
    // prepare DB
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

    // Start the HTTP server in test mode
    let addr = spawn_server().await;

    // perform HTTP requests
    let client = Client::new();
    let base = format!("http://{}", addr);

    // create post
    let resp = client.post(&format!("{}/api/posts", base))
        .json(&serde_json::json!({"title": "Hello","body_markdown":"Content"}))
        .send()
        .await
        .expect("post");
    if resp.status().as_u16() != 201 {
        let status = resp.status().as_u16();
        let txt = resp.text().await.unwrap_or_else(|_| "<no body>".to_string());
        panic!("unexpected status {}: {}", status, txt);
    }

    // list posts
    let resp2 = client.get(&format!("{}/api/posts", base))
        .send()
        .await
        .expect("get");
    assert_eq!(resp2.status().as_u16(), 200);
}
