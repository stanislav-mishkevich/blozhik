use ntex::web::{self, HttpRequest, HttpResponse};
use serde::Deserialize;
use serde_json::json;

use crate::services::profiles_service;

pub async fn get_profile(_req: HttpRequest, path: web::types::Path<(String,)>) -> HttpResponse {
    let username = path.into_inner().0;
    let pool = match crate::db::create_pool().await {
        Ok(p) => p,
        Err(e) => return HttpResponse::InternalServerError().body(format!("db error: {}", e)),
    };

    match profiles_service::get_profile(&pool, &username).await {
        Ok(profile) => HttpResponse::Ok().json(&profile),
        Err(e) => {
            tracing::error!("get_profile error: {:?}", e);
            let body = json!({"error":"profile not found"});
            HttpResponse::NotFound().json(&body)
        }
    }
}

#[derive(Deserialize)]
struct FollowBody { follow: bool }

pub async fn post_follow(req: HttpRequest, path: web::types::Path<(String,)>, body: web::types::Json<FollowBody>) -> HttpResponse {
    // Authenticate user (simplified test harness expects to use JWT and get user id)
    let auth_user_id = match crate::auth::jwt::extract_user_id_from_request(&req) {
        Ok(id) => id,
        Err(_) => {
            let body = json!({"error":"unauthorized"});
            return HttpResponse::Unauthorized().json(&body);
        }
    };

    let username = path.into_inner().0;
    let pool = match crate::db::create_pool().await {
        Ok(p) => p,
        Err(e) => return HttpResponse::InternalServerError().body(format!("db error: {}", e)),
    };

    // lookup followee id
    let followee_id: i64 = match sqlx::query_scalar("SELECT id FROM users WHERE username = ?")
        .bind(&username)
        .fetch_one(&pool)
        .await
    {
        Ok(id) => id,
        Err(_) => {
            let body = json!({"error":"user not found"});
            return HttpResponse::NotFound().json(&body);
        }
    };

    if body.follow {
        match profiles_service::follow_user(&pool, auth_user_id, followee_id).await {
            Ok(_) => {
                let body = json!({"followed": true});
                HttpResponse::Ok().json(&body)
            },
            Err(e) => {
                tracing::error!("follow error: {:?}", e);
                let body = json!({"error":"could not follow"});
                HttpResponse::InternalServerError().json(&body)
            }
        }
    } else {
        match profiles_service::unfollow_user(&pool, auth_user_id, followee_id).await {
            Ok(_) => {
                let body = json!({"followed": false});
                HttpResponse::Ok().json(&body)
            },
            Err(e) => {
                tracing::error!("unfollow error: {:?}", e);
                let body = json!({"error":"could not unfollow"});
                HttpResponse::InternalServerError().json(&body)
            }
        }
    }
}

pub fn routes(cfg: &mut ntex::web::ServiceConfig) {
    cfg.route("/profiles/{username}", ntex::web::get().to(get_profile));
    cfg.route("/profiles/{username}/follow", ntex::web::post().to(post_follow));
}
