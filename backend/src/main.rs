use blozhik_backend::{api, db};
use ntex::web;
use ntex::http::Method;

#[ntex::main]
async fn main() -> std::io::Result<()> {
    // Load environment variables
    dotenv::dotenv().ok();

    // Initialize database
    let pool = db::create_pool().await.expect("Failed to create database pool");
    db::run_migrations(&pool).await.expect("Failed to run migrations");

    println!("🚀 Starting Blozhik backend server on http://127.0.0.1:8080");

    // Start HTTP server
    web::HttpServer::new(move || {
        web::App::new()
            .state(pool.clone())
            // Configure CORS
            .wrap(
                web::middleware::DefaultHeaders::new()
                    .header("Access-Control-Allow-Origin", "http://localhost:5173")
                    .header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
                    .header("Access-Control-Allow-Headers", "Content-Type, Authorization")
                    .header("Access-Control-Allow-Credentials", "true")
            )
            // API routes
            .service(
                web::scope("/api")
                    .configure(api::router::configure)
            )
            // Health check
            .route("/health", web::get().to(|| async { web::HttpResponse::Ok().body("OK") }))
            // Handle OPTIONS preflight requests
            .default_service(web::route().method(Method::OPTIONS).to(|| async {
                web::HttpResponse::Ok().finish()
            }))
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}
