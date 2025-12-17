mod app;
mod db;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    tracing::info!("starting server setup");
    match db::init_db().await {
        Ok(pool) => {
            let _ = app::app(pool);
            tracing::info!("app constructed");
        }
        Err(e) => tracing::error!("failed init db: {}", e),
    }

    tracing::info!("server initialized (tests spawn server)");
}
