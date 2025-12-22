use ntex::web::{self, HttpResponse};
use serde::Deserialize;
use crate::services::post_service::PostService;
use tracing::info;

#[derive(Deserialize)]
struct PostCreate {
    title: String,
    body_markdown: String,
    tags: Option<Vec<String>>,
}

pub fn routes(cfg: &mut web::ServiceConfig) {
    cfg.service(web::resource("/posts").route(web::post().to(create_post)).route(web::get().to(list_posts)));
}

async fn create_post(payload: web::types::Json<PostCreate>) -> HttpResponse {
    if payload.title.trim().is_empty() || payload.body_markdown.trim().is_empty() {
        return HttpResponse::BadRequest().body("title and body required");
    }
    // create pool per request (simple but acceptable for tests)
    let pool = match crate::db::create_pool().await {
        Ok(p) => p,
        Err(e) => return HttpResponse::InternalServerError().body(format!("db error: {}", e)),
    };
    if let Err(e) = crate::db::run_migrations(&pool).await {
        return HttpResponse::InternalServerError().body(format!("migrate error: {}", e));
    }
    let tags_ref = payload.tags.as_ref();
    match PostService::create(&pool, 1, &payload.title, &payload.body_markdown, tags_ref).await {
        Ok(post) => {
            info!(post_id = post.id, "post created via api");
            HttpResponse::Created().json(&post)
        },
        Err(e) => HttpResponse::InternalServerError().body(format!("db error: {}", e)),
    }
}

async fn list_posts() -> HttpResponse {
    let pool = match crate::db::create_pool().await {
        Ok(p) => p,
        Err(e) => return HttpResponse::InternalServerError().body(format!("db error: {}", e)),
    };
    match PostService::list(&pool, 1, 10).await {
        Ok(items) => {
            let body = serde_json::json!({"items": items});
            HttpResponse::Ok().json(&body)
        },
        Err(e) => HttpResponse::InternalServerError().body(format!("db error: {}", e)),
    }
}
