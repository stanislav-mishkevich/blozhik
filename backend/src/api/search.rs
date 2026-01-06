use ntex::web::{self, HttpResponse};
use serde::Deserialize;
use serde_json::json;

use crate::services::search_service;

#[derive(Deserialize)]
struct SearchQuery {
    q: Option<String>,
    page: Option<i64>,
    per_page: Option<i64>,
}

pub async fn get_search(query: web::types::Query<SearchQuery>) -> HttpResponse {
    let q = match &query.q {
        Some(s) if !s.trim().is_empty() => s.clone(),
        _ => {
            let body = json!({"error":"missing query parameter 'q'"});
            return HttpResponse::BadRequest().json(&body);
        }
    };

    let page = query.page.unwrap_or(1).max(1);
    let per_page = query.per_page.unwrap_or(10).clamp(1, 100);
    let offset = (page - 1) * per_page;

    let pool = match crate::db::create_pool().await {
        Ok(p) => p,
        Err(e) => return HttpResponse::InternalServerError().body(format!("db error: {}", e)),
    };

    match search_service::search_posts(&pool, &q, per_page, offset).await {
        Ok(items) => {
            let body = json!({"page": page, "per_page": per_page, "items": items});
            HttpResponse::Ok().json(&body)
        },
        Err(e) => {
            tracing::error!("search error: {:?}", e);
            let body = json!({"error":"search failed"});
            HttpResponse::InternalServerError().json(&body)
        }
    }
}

pub fn routes(cfg: &mut ntex::web::ServiceConfig) {
    cfg.route("/search", ntex::web::get().to(get_search));
}
