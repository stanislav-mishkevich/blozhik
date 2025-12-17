use axum::Json;
use serde::Serialize;

#[derive(Serialize)]
struct HealthResponse {
    status: &'static str,
}

pub async fn health_handler() -> Json<HealthResponse> {
    Json(HealthResponse { status: "ok" })
}
