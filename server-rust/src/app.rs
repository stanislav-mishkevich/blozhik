use axum::Router;

use crate::routes::auth;

pub fn app(pool: sqlx::SqlitePool) -> Router {
    Router::new()
        .nest("/api/auth", auth::router())
        .layer(axum::extract::Extension(pool))
}