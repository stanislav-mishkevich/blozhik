use anyhow::Result;
use serde_json::Value;
use crate::server::_core::sdk;
use crate::server::db;

pub fn handle_follow(input: &Value, token_cookie: Option<&str>) -> Result<Value> {
    // require auth
    let token = token_cookie.ok_or_else(|| anyhow::anyhow!("unauthenticated"))?;
    let follower = sdk::verify_session_token(token)?.ok_or_else(|| anyhow::anyhow!("invalid session"))?;
    let target = input.get("targetOpenId").and_then(|v| v.as_str()).ok_or_else(|| anyhow::anyhow!("missing targetOpenId"))?;
    let id = db::follow_user(&follower, target)?;
    Ok(serde_json::json!({ "ok": true, "id": id }))
}

pub fn handle_unfollow(input: &Value, token_cookie: Option<&str>) -> Result<Value> {
    let token = token_cookie.ok_or_else(|| anyhow::anyhow!("unauthenticated"))?;
    let follower = sdk::verify_session_token(token)?.ok_or_else(|| anyhow::anyhow!("invalid session"))?;
    let target = input.get("targetOpenId").and_then(|v| v.as_str()).ok_or_else(|| anyhow::anyhow!("missing targetOpenId"))?;
    db::unfollow_user(&follower, target)?;
    Ok(serde_json::json!({ "ok": true }))
}

pub fn handle_list_followers(input: &Value) -> Result<Value> {
    let target = input.get("targetOpenId").and_then(|v| v.as_str()).ok_or_else(|| anyhow::anyhow!("missing targetOpenId"))?;
    let list = db::list_followers(target)?;
    Ok(serde_json::to_value(list)?)
}

pub fn handle_add_bookmark(input: &Value, token_cookie: Option<&str>) -> Result<Value> {
    let token = token_cookie.ok_or_else(|| anyhow::anyhow!("unauthenticated"))?;
    let user = sdk::verify_session_token(token)?.ok_or_else(|| anyhow::anyhow!("invalid session"))?;
    let post_id = input.get("postId").and_then(|v| v.as_i64()).ok_or_else(|| anyhow::anyhow!("missing postId"))?;
    let id = db::add_bookmark(&user, post_id)?;
    Ok(serde_json::json!({ "ok": true, "id": id }))
}

pub fn handle_remove_bookmark(input: &Value, token_cookie: Option<&str>) -> Result<Value> {
    let token = token_cookie.ok_or_else(|| anyhow::anyhow!("unauthenticated"))?;
    let user = sdk::verify_session_token(token)?.ok_or_else(|| anyhow::anyhow!("invalid session"))?;
    let post_id = input.get("postId").and_then(|v| v.as_i64()).ok_or_else(|| anyhow::anyhow!("missing postId"))?;
    db::remove_bookmark(&user, post_id)?;
    Ok(serde_json::json!({ "ok": true }))
}

pub fn handle_list_bookmarks(input: &Value, token_cookie: Option<&str>) -> Result<Value> {
    let user = if let Some(u) = input.get("userOpenId").and_then(|v| v.as_str()) {
        u.to_string()
    } else if let Some(token) = token_cookie {
        sdk::verify_session_token(token)?.ok_or_else(|| anyhow::anyhow!("invalid session"))?
    } else {
        return Ok(serde_json::json!({ "error": "missing_user" }));
    };
    let limit = input.get("limit").and_then(|v| v.as_i64()).unwrap_or(100);
    let list = db::list_bookmarks(&user, limit)?;
    Ok(serde_json::to_value(list)?)
}
