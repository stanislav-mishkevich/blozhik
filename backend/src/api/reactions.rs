use ntex::web::{HttpResponse, HttpRequest};
use ntex::web::types::{Json, Path};
use sqlx::{SqlitePool, Error as SqlxError};
use serde::Deserialize;
use crate::services::reaction_service;
use crate::models::reaction::NewReaction;

#[derive(Deserialize)]
struct CreateReactionBody {
    r#type: String,
}

pub fn routes(cfg: &mut ntex::web::ServiceConfig) {
    cfg.service(ntex::web::resource("/{subject}/{id}/reactions").route(ntex::web::post().to(post_reaction)));
}

pub async fn post_reaction(_req: HttpRequest, path: Path<(String, i64)>, body: Json<CreateReactionBody>) -> HttpResponse {
    let pool = match crate::db::create_pool().await {
        Ok(p) => p,
        Err(e) => return HttpResponse::InternalServerError().body(format!("db error: {}", e)),
    };
    let subject = path.0.clone();
    let id = path.1;

    // extract user id from Authorization bearer JWT
    let user_id = crate::auth::test_auth::extract_user_id_from_jwt(&_req).unwrap_or(0);

    let new = NewReaction {
        subject_type: subject,
        subject_id: id,
        user_id,
        r#type: body.into_inner().r#type,
    };

    match reaction_service::add_reaction(&pool, new).await {
        Ok(r) => HttpResponse::Created().json(&r),
        Err(e) => {
            // try to detect sqlite unique constraint violation
            if let Some(sqlx_err) = e.downcast_ref::<SqlxError>() {
                if let Some(db_err) = sqlx_err.as_database_error() {
                    let msg = db_err.message();
                    if msg.to_lowercase().contains("unique") || msg.to_lowercase().contains("constraint failed") {
                        return HttpResponse::Conflict().body("duplicate reaction");
                    }
                }
            }
            HttpResponse::InternalServerError().body(format!("failed to add reaction: {}", e))
        }
    }
}
