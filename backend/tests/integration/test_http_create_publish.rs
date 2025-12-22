use tempfile::NamedTempFile;
use std::env;

#[ntex::test]
async fn http_create_publish_flow() {
    // prepare DB
    let tmp = NamedTempFile::new().unwrap();
    let path = tmp.path().to_string_lossy().to_string();
    let database_url = format!("sqlite://{}", path);
    env::set_var("DATABASE_URL", &database_url);

    let pool = backend::db::create_pool().await.expect("create pool");
    backend::db::run_migrations(&pool).await.expect("migrate");

    // start test server
    let srv = ntex::web::test::start(move || {
        backend::api::router::app_factory_with_pool(pool.clone())
    });

    // create post
    let req = srv.post("/api/posts").send_json(&serde_json::json!({"title": "Hello","body_markdown":"Content"}));
    let mut resp = req.await.unwrap();
    assert_eq!(resp.status().as_u16(), 201);

    // list posts
    let mut resp2 = srv.get("/api/posts").send().await.unwrap();
    assert_eq!(resp2.status().as_u16(), 200);
}
