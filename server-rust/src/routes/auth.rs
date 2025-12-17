use axum::{extract::Extension, Json, response::IntoResponse, http::StatusCode, routing::post, Router};
use serde::Deserialize;
use crate::db::{SqlitePool, get_user_by_email, create_user};
use bcrypt::{hash, verify};

#[derive(Deserialize)]
struct RegisterPayload {
    email: String,
    username: String,
    password: String,
}

pub fn router() -> Router {
    Router::new().route("/register", post(register))
}

async fn register(Extension(pool): Extension<SqlitePool>, Json(payload): Json<RegisterPayload>) -> impl IntoResponse {
    // check existing
    match get_user_by_email(&pool, &payload.email).await {
        Ok(Some(_)) => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({"error":"email exists"}))),
        Ok(None) => (),
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error": format!("db err: {}", e)}))),
    }

    let hashed = match hash(&payload.password, 10) {
        Ok(h) => h,
        Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error":"hash failed"}))),
    };

    match create_user(&pool, None, &payload.email, &payload.username, &hashed).await {
        Ok(id) => (StatusCode::OK, Json(serde_json::json!({"id": id}))),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error": format!("db err: {}", e)}))),
    }
}
