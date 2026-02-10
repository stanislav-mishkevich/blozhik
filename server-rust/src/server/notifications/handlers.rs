use actix_web::{HttpRequest, HttpResponse, Responder};
use serde_json::Value;
use anyhow::Result;
use crate::server::_core::sdk;
use crate::server::notifications::{db, hub};
use tokio::sync::broadcast::error::RecvError;
use serde_json::Value as JsonValue;
use actix_web::http::header;

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

    // get authenticated open id for this connection
    let user_open_id = match sdk::verify_session_token(token).unwrap_or(None) {
        Some(u) => u,
        None => return HttpResponse::Unauthorized().body("invalid session"),
    };

    // If client provided Last-Event-ID header, attempt to replay missed notifications
    if let Some(last_ev) = req.headers().get(header::HeaderName::from_static("last-event-id")) {
        if let Ok(s) = last_ev.to_str() {
            if let Ok(last_id) = s.parse::<i64>() {
                if let Ok(missed) = db::list_notifications_since(&user_open_id, last_id, 500) {
                    for n in missed {
                        // build SSE message payload and push to hub so subscriber receives it
                        let payload = serde_json::json!({
                            "id": n.id,
                            "userOpenId": n.user_open_id,
                            "actorOpenId": n.actor_open_id,
                            "verb": n.verb,
                            "data": n.data,
                        });
                        let _ = hub::get_sender().send(serde_json::to_string(&payload).unwrap());
                    }
                }
            }
        }
    }

    let user = user_open_id.clone();

    let stream = async_stream::stream! {
        loop {
            match rx.recv().await {
                Ok(msg) => {
                    // msg is a JSON string representing notification event; filter by userOpenId
                    if let Ok(v) = serde_json::from_str::<JsonValue>(&msg) {
                        if let Some(u) = v.get("userOpenId").and_then(|x| x.as_str()) {
                            if u != user {
                                continue;
                            }
                        }
                        // include id: line if available
                        let id_line = if let Some(idv) = v.get("id").and_then(|x| x.as_i64()) {
                            format!("id: {}\n", idv)
                        } else { String::new() };
                        let s = format!("{}data: {}\n\n", id_line, serde_json::to_string(&v).unwrap());
                        yield Ok::<_, actix_web::Error>(actix_web::web::Bytes::from(s));
                    }
                }
                Err(RecvError::Closed) => break,
                Err(RecvError::Lagged(_)) => continue,
            }
        }
    };

    HttpResponse::Ok()
        .insert_header(("Content-Type", "text/event-stream"))
        .streaming(stream)
}

pub fn handle_mark_read(input: &Value, token_cookie: Option<&str>) -> Result<Value> {
    let token = token_cookie.ok_or_else(|| anyhow::anyhow!("unauthenticated"))?;
    let user = crate::server::_core::sdk::verify_session_token(token)?.ok_or_else(|| anyhow::anyhow!("invalid session"))?;
    let id = input.get("id").and_then(|v| v.as_i64()).ok_or_else(|| anyhow::anyhow!("missing id"))?;

    // ensure notification belongs to user
    if let Some(n) = db::get_notification_by_id(id)? {
        if n.user_open_id != user {
            return Ok(serde_json::json!({ "error": "forbidden_or_not_found" }));
        }
    } else {
        return Ok(serde_json::json!({ "error": "forbidden_or_not_found" }));
    }
    db::mark_notification_read(id)?;
    Ok(serde_json::json!({ "ok": true }))
}

pub fn handle_unread_count(input: &Value, token_cookie: Option<&str>) -> Result<Value> {
    let user = if let Some(u) = input.get("userOpenId").and_then(|v| v.as_str()) {
        u.to_string()
    } else if let Some(token) = token_cookie {
        crate::server::_core::sdk::verify_session_token(token)?.ok_or_else(|| anyhow::anyhow!("invalid session"))?
    } else {
        return Ok(serde_json::json!({ "error": "missing_user" }));
    };
    let cnt = db::count_unread_for_user(&user)?;
    Ok(serde_json::json!({ "unread": cnt }))
}

pub fn handle_mark_all_read(_input: &Value, token_cookie: Option<&str>) -> Result<Value> {
    let token = token_cookie.ok_or_else(|| anyhow::anyhow!("unauthenticated"))?;
    let user = crate::server::_core::sdk::verify_session_token(token)?.ok_or_else(|| anyhow::anyhow!("invalid session"))?;
    let changed = db::mark_all_read_for_user(&user)?;
    Ok(serde_json::json!({ "ok": true, "changed": changed }))
}
