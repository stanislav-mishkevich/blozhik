use ntex::web::{error::HttpError, HttpResponse, HttpRequest, Query};
use serde::Deserialize;
use serde_json::json;

use crate::db;
use crate::services::search_service;

#[derive(Deserialize)]
struct SearchQuery {
    q: Option<String>,
    page: Option<i64>,
    per_page: Option<i64>,
}

pub async fn get_search(_req: HttpRequest, query: Query<SearchQuery>) -> HttpResponse {
    let q = match &query.q {
        Some(s) if !s.trim().is_empty() => s.clone(),
        _ => return HttpResponse::BadRequest().json(json!({"error":"missing query parameter 'q'"})),
    };

    let page = query.page.unwrap_or(1).max(1);
    let per_page = query.per_page.unwrap_or(10).clamp(1, 100);
    let offset = (page - 1) * per_page;

    let pool = db::get_pool().expect("db pool");
    match search_service::search_posts(&pool, &q, per_page, offset).await {
        Ok(items) => HttpResponse::Ok().json(json!({"page": page, "per_page": per_page, "items": items})),
        Err(e) => {
            log::error!("search error: {:?}", e);
            HttpResponse::InternalServerError().json(json!({"error":"search failed"}))
        }
    }
}

pub fn routes(cfg: &mut ntex::web::ServiceConfig) {
    cfg.route("/search", ntex::web::get().to(get_search));
}
