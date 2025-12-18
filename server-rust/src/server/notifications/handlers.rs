use actix_web::{HttpRequest, HttpResponse, Responder};
use serde_json::Value;
use anyhow::Result;
use crate::server::_core::sdk;
use crate::server::notifications::{db, hub};
use futures_util::stream::Stream;
use std::pin::Pin;
use std::task::{Context, Poll};
use tokio::sync::broadcast::error::RecvError;

pub fn handle_publish(input: &Value, actor_token: Option<&str>) -> Result<Value> {
    let user_open_id = input.get("userOpenId").and_then(|v| v.as_str()).ok_or_else(|| anyhow::anyhow!("missing userOpenId"))?;
    let verb = input.get("verb").and_then(|v| v.as_str()).unwrap_or("notify");
    let data = input.get("data").cloned();
    let actor_open_id = if let Some(tok) = actor_token {
        sdk::verify_session_token(tok)?
    } else { None };

    let id = db::create_notification(user_open_id, actor_open_id.as_deref(), verb, data.as_ref())?;

    // Broadcast event to SSE subscribers (as JSON string)
    let event = serde_json::json!({
        "id": id,
        "userOpenId": user_open_id,
        "actorOpenId": actor_open_id,
        "verb": verb,
        "data": data,
    });
    let _ = hub::get_sender().send(serde_json::to_string(&event)?);

    Ok(serde_json::json!({ "ok": true, "id": id }))
}

pub fn handle_list(input: &Value, token_cookie: Option<&str>) -> Result<Value> {
    let user_open_id = if let Some(u) = input.get("userOpenId").and_then(|v| v.as_str()) {
        u.to_string()
    } else if let Some(token) = token_cookie {
        if let Some(open_id) = sdk::verify_session_token(token)? {
            open_id
        } else {
            return Ok(serde_json::json!({ "error": "unauthenticated" }));
        }
    } else {
        return Ok(serde_json::json!({ "error": "missing_user" }));
    };

    let limit = input.get("limit").and_then(|v| v.as_i64()).unwrap_or(100);
    let list = db::list_notifications_for_user(&user_open_id, limit)?;
    Ok(serde_json::to_value(list)?)
}

// SSE streaming handler
pub async fn stream_notifications(req: HttpRequest) -> impl Responder {
    // extract session token from cookie
    let token_cookie = req.cookie("app_session_id").map(|c| c.value().to_string());
    let token = match token_cookie.as_deref() {
        Some(t) => t,
        None => return HttpResponse::Unauthorized().body("missing session"),
    };

    if sdk::verify_session_token(token).unwrap_or(None).is_none() {
        return HttpResponse::Unauthorized().body("invalid session");
    }

    let mut rx = hub::subscribe();

    let stream = async_stream::stream! {
        loop {
            match rx.recv().await {
                Ok(msg) => {
                    let s = format!("data: {}\n\n", msg);
                    yield Ok::<_, actix_web::Error>(actix_web::web::Bytes::from(s));
                }
                Err(RecvError::Closed) => break,
                Err(RecvError::Lagged(_)) => {
                    // on lag, continue; we might want to send a notice
                    continue;
                }
            }
        }
    };

    HttpResponse::Ok()
        .insert_header(("Content-Type", "text/event-stream"))
        .streaming(stream)
}
