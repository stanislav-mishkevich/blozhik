use anyhow::Result;
use serde_json::Value;
use crate::server::_core::sdk;
use crate::server::db;

pub fn handle_add(input: &Value, token_cookie: Option<&str>) -> Result<Value> {
    let token = token_cookie.ok_or_else(|| anyhow::anyhow!("unauthenticated"))?;
    let user = sdk::verify_session_token(token)?.ok_or_else(|| anyhow::anyhow!("invalid session"))?;
    let post_id = input.get("postId").and_then(|v| v.as_i64()).ok_or_else(|| anyhow::anyhow!("missing postId"))?;
    let reaction = input.get("reaction").and_then(|v| v.as_str()).unwrap_or("like");
    let id = db::add_reaction(post_id, &user, reaction)?;
    Ok(serde_json::json!({ "ok": true, "id": id }))
}

pub fn handle_remove(input: &Value, token_cookie: Option<&str>) -> Result<Value> {
    let token = token_cookie.ok_or_else(|| anyhow::anyhow!("unauthenticated"))?;
    let user = sdk::verify_session_token(token)?.ok_or_else(|| anyhow::anyhow!("invalid session"))?;
    let post_id = input.get("postId").and_then(|v| v.as_i64()).ok_or_else(|| anyhow::anyhow!("missing postId"))?;
    let reaction = input.get("reaction").and_then(|v| v.as_str()).unwrap_or("like");
    db::remove_reaction(post_id, &user, reaction)?;
    Ok(serde_json::json!({ "ok": true }))
}

pub fn handle_count(input: &Value) -> Result<Value> {
    let post_id = input.get("postId").and_then(|v| v.as_i64()).ok_or_else(|| anyhow::anyhow!("missing postId"))?;
    let cnt = db::count_reactions(post_id)?;
    Ok(serde_json::json!({ "count": cnt }))
}

pub fn handle_list(input: &Value) -> Result<Value> {
    let post_id = input.get("postId").and_then(|v| v.as_i64()).ok_or_else(|| anyhow::anyhow!("missing postId"))?;
    let list = db::list_reactions_for_post(post_id)?;
    Ok(serde_json::to_value(list)?)
}
