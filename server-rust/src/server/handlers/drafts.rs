use anyhow::Result;
use serde_json::Value;
use crate::server::_core::sdk;
use crate::server::db;

pub fn handle_create_draft(input: &Value, token_cookie: Option<&str>) -> Result<Value> {
    let token = token_cookie.ok_or_else(|| anyhow::anyhow!("unauthenticated"))?;
    let author = sdk::verify_session_token(token)?.ok_or_else(|| anyhow::anyhow!("invalid session"))?;
    let title = input.get("title").and_then(|v| v.as_str());
    let content = input.get("content").and_then(|v| v.as_str());
    let id = db::create_draft(&author, title, content)?;
    Ok(serde_json::json!({ "ok": true, "id": id }))
}

pub fn handle_update_draft(input: &Value, token_cookie: Option<&str>) -> Result<Value> {
    let token = token_cookie.ok_or_else(|| anyhow::anyhow!("unauthenticated"))?;
    let author = sdk::verify_session_token(token)?.ok_or_else(|| anyhow::anyhow!("invalid session"))?;
    let draft_id = input.get("id").and_then(|v| v.as_i64()).ok_or_else(|| anyhow::anyhow!("missing id"))?;
    // verify ownership
    if let Some((_, owner, _title, _content, _updated)) = db::get_draft_by_id(draft_id)? {
        if owner != author {
            return Ok(serde_json::json!({ "error": "forbidden" }));
        }
    } else {
        return Ok(serde_json::json!({ "error": "not_found" }));
    }
    let title = input.get("title").and_then(|v| v.as_str());
    let content = input.get("content").and_then(|v| v.as_str());
    db::update_draft(draft_id, title, content)?;
    Ok(serde_json::json!({ "ok": true }))
}

pub fn handle_get_draft(input: &Value, token_cookie: Option<&str>) -> Result<Value> {
    let token = token_cookie.ok_or_else(|| anyhow::anyhow!("unauthenticated"))?;
    let author = sdk::verify_session_token(token)?.ok_or_else(|| anyhow::anyhow!("invalid session"))?;
    let draft_id = input.get("id").and_then(|v| v.as_i64()).ok_or_else(|| anyhow::anyhow!("missing id"))?;
    if let Some((id, owner, title, content, updated)) = db::get_draft_by_id(draft_id)? {
        if owner != author {
            return Ok(serde_json::json!({ "error": "forbidden" }));
        }
        return Ok(serde_json::json!({ "id": id, "authorOpenId": owner, "title": title, "content": content, "updatedAt": updated }));
    }
    Ok(serde_json::json!({ "error": "not_found" }))
}

pub fn handle_list_drafts(input: &Value, token_cookie: Option<&str>) -> Result<Value> {
    let user = if let Some(u) = input.get("authorOpenId").and_then(|v| v.as_str()) {
        u.to_string()
    } else if let Some(token) = token_cookie {
        sdk::verify_session_token(token)?.ok_or_else(|| anyhow::anyhow!("invalid session"))?
    } else {
        return Ok(serde_json::json!({ "error": "missing_user" }));
    };
    let limit = input.get("limit").and_then(|v| v.as_i64()).unwrap_or(100);
    let list = db::list_drafts_for_user(&user, limit)?;
    Ok(serde_json::to_value(list)?)
}
