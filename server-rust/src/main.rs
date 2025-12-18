use actix_web::{middleware::Logger, web, App, HttpRequest, HttpResponse, HttpServer, Responder};
use actix_web::cookie::{Cookie, SameSite};
use server_rust::server;
use serde_json::Value;
use std::fs;

async fn trpc_handler(req: HttpRequest, body: web::Bytes) -> impl Responder {
    // Parse JSON body (support batch and single)
    let parsed: serde_json::Value = match serde_json::from_slice(&body) {
        Ok(v) => v,
        Err(_) => return HttpResponse::BadRequest().json(serde_json::json!({ "error": "invalid_json" })),
    };

    let mut responses = vec![];
    let mut set_cookie: Option<(String, String, Option<i64>)> = None;
    let mut clear_cookie: Option<String> = None;

    let requests = if parsed.is_array() { parsed.as_array().unwrap().clone() } else { vec![parsed] };

    // Extract cookie token from request
    let token_cookie = req.cookie("app_session_id").map(|c| c.value().to_string());

    for req_obj in requests.into_iter() {
        let method = req_obj.get("method").and_then(|v| v.as_str()).unwrap_or("");
        let params = req_obj.get("params").cloned().unwrap_or(serde_json::Value::Null);

        // derive input
        let input = if params.is_array() {
            params.as_array().and_then(|arr| arr.get(0)).cloned().unwrap_or(serde_json::Value::Null)
        } else if params.is_object() && params.get("input").is_some() {
            params.get("input").cloned().unwrap()
        } else {
            params.clone()
        };

        let parts: Vec<&str> = method.split('.').collect();
        if parts.len() != 2 {
            responses.push(serde_json::json!({ "error": "invalid_method", "method": method }));
            continue;
        }
        let router = parts[0];
        let proc = parts[1];

        let resp = match (router, proc) {
            ("auth", "register") => match server::handlers::auth::handle_register(&input) {
                Ok(v) => v,
                Err(e) => serde_json::json!({ "error": format!("{}", e) }),
            },
            ("auth", "login") => match server::handlers::auth::handle_login(&input) {
                Ok(v) => v,
                Err(e) => serde_json::json!({ "error": format!("{}", e) }),
            },
            ("auth", "logout") => match server::handlers::auth::handle_logout(&input, token_cookie.as_deref()) {
                Ok(v) => v,
                Err(e) => serde_json::json!({ "error": format!("{}", e) }),
            },
            ("auth", "me") => match server::handlers::auth::handle_me(token_cookie.as_deref()) {
                Ok(v) => v,
                Err(e) => serde_json::json!({ "error": format!("{}", e) }),
            },
            ("user", "getProfile") => match server::handlers::user::handle_get_profile(&input) {
                Ok(v) => v,
                Err(e) => serde_json::json!({ "error": format!("{}", e) }),
            },
            ("user", "updateProfile") => match server::handlers::user::handle_update_profile(&input, token_cookie.as_deref()) {
                Ok(v) => v,
                Err(e) => serde_json::json!({ "error": format!("{}", e) }),
            },
            ("user", "changePassword") => match server::handlers::user::handle_change_password(&input, token_cookie.as_deref()) {
                Ok(v) => v,
                Err(e) => serde_json::json!({ "error": format!("{}", e) }),
            },
            ("post", "create") => match server::handlers::post::handle_create_post(&input, token_cookie.as_deref()) {
                Ok(v) => v,
                Err(e) => serde_json::json!({ "error": format!("{}", e) }),
            },
            ("post", "get") => match server::handlers::post::handle_get_post(&input) {
                Ok(v) => v,
                Err(e) => serde_json::json!({ "error": format!("{}", e) }),
            },
            ("post", "list") => match server::handlers::post::handle_list_posts(&input) {
                Ok(v) => v,
                Err(e) => serde_json::json!({ "error": format!("{}", e) }),
            },
            ("comment", "create") => match server::handlers::comment::handle_create_comment(&input, token_cookie.as_deref()) {
                Ok(v) => v,
                Err(e) => serde_json::json!({ "error": format!("{}", e) }),
            },
            ("comment", "list") => match server::handlers::comment::handle_list_comments(&input) {
                Ok(v) => v,
                Err(e) => serde_json::json!({ "error": format!("{}", e) }),
            },
            ("notifications", "publish") => match server::notifications::handlers::handle_publish(&input, token_cookie.as_deref()) {
                Ok(v) => v,
                Err(e) => serde_json::json!({ "error": format!("{}", e) }),
            },
            ("notifications", "list") => match server::notifications::handlers::handle_list(&input, token_cookie.as_deref()) {
                Ok(v) => v,
                Err(e) => serde_json::json!({ "error": format!("{}", e) }),
            },
            _ => serde_json::json!({ "error": "not_implemented", "method": method }),
        };

        // Capture cookie actions if returned by handler
        if let Some(obj) = resp.as_object() {
            if let Some(sc) = obj.get("setCookie") {
                if let (Some(name), Some(value)) = (sc.get("name"), sc.get("value")) {
                    let max_age = sc.get("maxAge").and_then(|v| v.as_i64());
                    set_cookie = Some((name.as_str().unwrap_or("").to_string(), value.as_str().unwrap_or("").to_string(), max_age));
                }
            }
            if let Some(cc) = obj.get("clearCookie") {
                if let Some(name) = cc.get("name") {
                    clear_cookie = Some(name.as_str().unwrap_or("").to_string());
                }
            }
        }

        responses.push(resp);
    }

    // Build response (single or batch)
    let mut builder = HttpResponse::Ok();

    // Determine secure cookie flag from environment (default: false for local dev)
    let secure_cookies = std::env::var("RUST_SERVER_SECURE_COOKIES").map(|v| {
        let v = v.to_lowercase();
        !(v == "0" || v == "false" || v == "off")
    }).unwrap_or(false);

    if let Some((name, value, max_age)) = set_cookie {
        let mut cookie = Cookie::build(name, value)
            .path("/")
            .http_only(true)
            .secure(secure_cookies)
            .same_site(SameSite::Lax);
        if let Some(age) = max_age {
            cookie = cookie.max_age(time::Duration::seconds(age));
        }
        builder.cookie(cookie.finish());
    }
    if let Some(name) = clear_cookie {
        let cookie = Cookie::build(name, "")
            .path("/")
            .http_only(true)
            .secure(secure_cookies)
            .same_site(SameSite::Lax)
            .max_age(time::Duration::seconds(0))
            .finish();
        builder.cookie(cookie);
    }

    if responses.len() == 1 {
        builder.json(&responses[0])
    } else {
        builder.json(responses)
    }
}

async fn sse_stub(_req: HttpRequest) -> impl Responder {
    HttpResponse::NotImplemented().body("SSE not implemented yet in Rust scaffold")
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init();

    // Initialize DB
    let _ = server::db::init_db();

    // Try to load routers schema from current directory or parent (for diagnostics)
    let routers_raw = fs::read_to_string("routers-full.json")
        .or_else(|_| fs::read_to_string("../routers-full.json"))
        .unwrap_or_else(|_| "{}".to_string());
    let routers: Value = serde_json::from_str(&routers_raw).unwrap_or(Value::Null);
    println!("Loaded routers basePath: {}", routers.get("basePath").unwrap_or(&Value::Null));

    HttpServer::new(move || {
        App::new()
            .wrap(Logger::default())
            // Basic compatibility endpoints used by the frontend: tRPC base and SSE stream
            .route("/api/trpc", web::post().to(trpc_handler))
            .route("/api/notifications/stream", web::get().to(server::notifications::handlers::stream_notifications))
            // health check
            .route("/healthz", web::get().to(|| async { HttpResponse::Ok().body("ok") }))
            .default_service(web::route().to(|| async { HttpResponse::NotFound().body("Not Found") }))
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
}
// Note: This binary uses the Actix `main` defined above.
