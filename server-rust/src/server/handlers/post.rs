use anyhow::Result;
use serde_json::{json, Value};
use crate::server::db;
use crate::server::_core::sdk;

pub fn handle_create_post(input: &Value, token: Option<&str>) -> Result<Value> {
    // require auth
    let open_id = match token {
        Some(t) => sdk::verify_session_token(t)?.ok_or_else(|| anyhow::anyhow!("unauth"))?,
        None => return Err(anyhow::anyhow!("unauth")),
    };

    let title = input.get("title").and_then(|v| v.as_str()).ok_or_else(|| anyhow::anyhow!("missing_title"))?;
    let content = input.get("content").and_then(|v| v.as_str()).unwrap_or("");

    let post_id = db::create_post(&open_id, title, content)?;

    Ok(json!({ "ok": true, "postId": post_id }))
}

pub fn handle_get_post(input: &Value) -> Result<Value> {
    let id = input.get("postId").and_then(|v| v.as_i64()).ok_or_else(|| anyhow::anyhow!("missing_postId"))?;
    let post = db::get_post_by_id(id)?;
    if let Some(p) = post {
        Ok(json!({ "ok": true, "post": p }))
    } else {
        Ok(json!({ "ok": false, "error": "not_found" }))
    }
}

pub fn handle_list_posts(_input: &Value) -> Result<Value> {
    let posts = db::list_posts()?;
    Ok(json!({ "ok": true, "posts": posts }))
}
