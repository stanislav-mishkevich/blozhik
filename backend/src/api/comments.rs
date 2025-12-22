use ntex::web::{HttpResponse, HttpRequest};
use ntex::web::types::{Json, Path};
use ntex::web;
use serde::Deserialize;
use sqlx::SqlitePool;
use crate::services::comment_service;
use crate::models::comment::NewComment;

#[derive(Deserialize)]
struct CreateCommentBody {
    body: String,
}

pub fn routes(cfg: &mut web::ServiceConfig) {
    cfg.service(web::resource("/posts/{postId}/comments").route(web::post().to(post_comment)));
}

pub async fn post_comment(req: HttpRequest, path: Path<(i64,)>, body: Json<CreateCommentBody>) -> HttpResponse {
    let pool = match crate::db::create_pool().await {
        Ok(p) => p,
        Err(e) => return HttpResponse::InternalServerError().body(format!("db error: {}", e)),
    };
    let post_id = path.0;

    // extract user id from Authorization bearer JWT
    let author_id = crate::auth::test_auth::extract_user_id_from_jwt(&req);

    let new = NewComment {
        post_id,
        author_id,
        body: body.into_inner().body,
    };

    match comment_service::create_comment(&pool, new).await {
        Ok(comment) => HttpResponse::Created().json(&comment),
        Err(e) => {
            HttpResponse::InternalServerError().body(format!("failed to create comment: {}", e))
        }
    }
}
