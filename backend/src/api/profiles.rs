use ntex::web::{HttpRequest, HttpResponse, Path, Json};
use serde::Deserialize;
use serde_json::json;

use crate::db;
use crate::services::profiles_service;

pub async fn get_profile(req: HttpRequest, path: Path<(String,)>) -> HttpResponse {
    let username = path.into_inner().0;
    let pool = match db::get_pool() {
        Some(p) => p,
        None => return HttpResponse::InternalServerError().json(json!({"error":"db pool not ready"})),
    };
    match profiles_service::get_profile(&pool, &username).await {
        Ok(profile) => HttpResponse::Ok().json(profile),
        Err(e) => {
            log::error!("get_profile error: {:?}", e);
            HttpResponse::NotFound().json(json!({"error":"profile not found"}))
        }
    }
}

#[derive(Deserialize)]
struct FollowBody { follow: bool }

pub async fn post_follow(req: HttpRequest, path: Path<(String,)>, body: Json<FollowBody>) -> HttpResponse {
    // Authenticate user (simplified test harness expects to use JWT and get user id)
    let auth_user_id = match crate::auth::jwt::extract_user_id_from_request(&req) {
        Ok(id) => id,
        Err(_) => return HttpResponse::Unauthorized().json(json!({"error":"unauthorized"})),
    };

    let username = path.into_inner().0;
    let pool = match db::get_pool() {
        Some(p) => p,
        None => return HttpResponse::InternalServerError().json(json!({"error":"db pool not ready"})),
    };

    // lookup followee id
    let followee_id = match sqlx::query_scalar!("SELECT id FROM users WHERE username = ?", username).fetch_one(&pool).await {
        Ok(id) => id,
        Err(_) => return HttpResponse::NotFound().json(json!({"error":"user not found"})),
    };

    if body.follow {
        match profiles_service::follow_user(&pool, auth_user_id, followee_id).await {
            Ok(_) => HttpResponse::Ok().json(json!({"followed": true})),
            Err(e) => {
                log::error!("follow error: {:?}", e);
                HttpResponse::InternalServerError().json(json!({"error":"could not follow"}))
            }
        }
    } else {
        match profiles_service::unfollow_user(&pool, auth_user_id, followee_id).await {
            Ok(_) => HttpResponse::Ok().json(json!({"followed": false})),
            Err(e) => {
                log::error!("unfollow error: {:?}", e);
                HttpResponse::InternalServerError().json(json!({"error":"could not unfollow"}))
            }
        }
    }
}

pub fn routes(cfg: &mut ntex::web::ServiceConfig) {
    cfg.route("/profiles/{username}", ntex::web::get().to(get_profile));
    cfg.route("/profiles/{username}/follow", ntex::web::post().to(post_follow));
}
