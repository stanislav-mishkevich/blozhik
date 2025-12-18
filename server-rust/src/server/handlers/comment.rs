use anyhow::Result;
use serde_json::{json, Value};
use crate::server::db;
use crate::server::_core::sdk;

pub fn handle_create_comment(input: &Value, token: Option<&str>) -> Result<Value> {
    let open_id = match token {
        Some(t) => sdk::verify_session_token(t)?.ok_or_else(|| anyhow::anyhow!("unauth"))?,
        None => return Err(anyhow::anyhow!("unauth")),
    };

    let post_id = input.get("postId").and_then(|v| v.as_i64()).ok_or_else(|| anyhow::anyhow!("missing_postId"))?;
    let content = input.get("content").and_then(|v| v.as_str()).unwrap_or("");

    let id = db::create_comment(post_id, &open_id, content)?;
    Ok(json!({ "ok": true, "commentId": id }))
}

pub fn handle_list_comments(input: &Value) -> Result<Value> {
    let post_id = input.get("postId").and_then(|v| v.as_i64()).ok_or_else(|| anyhow::anyhow!("missing_postId"))?;
    let comments = db::list_comments_for_post(post_id)?;
    Ok(json!({ "ok": true, "comments": comments }))
}
