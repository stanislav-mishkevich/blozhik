use anyhow::Result;
use serde_json::json;
use serde_json::Value;
use crate::server::db;
use crate::server::_core::sdk;
use bcrypt::{hash, verify, DEFAULT_COST};

pub fn handle_get_profile(input: &Value) -> Result<Value> {
    // Accepts input: { userId?: number, username?: string }
    let mut user_opt = None;
    if let Some(id_v) = input.get("userId") {
        if let Some(id) = id_v.as_i64() {
            user_opt = db::get_user_by_id(id)?;
        }
    }
    if user_opt.is_none() {
        if let Some(u) = input.get("username").and_then(|v| v.as_str()) {
            user_opt = db::get_user_by_username(u)?;
        }
    }

    let user = user_opt.ok_or_else(|| anyhow::anyhow!("User not found"))?;

    // Minimal profile response; more fields (stats, followers etc.) can be added later
    Ok(json!({
        "id": user.id,
        "username": user.username,
        "name": user.name,
        "bio": null,
        "avatarUrl": null,
        "createdAt": null,
        "stats": null,
    }))
}

pub fn handle_update_profile(input: &Value, token: Option<&str>) -> Result<Value> {
    // require auth
    let open_id = match token {
        Some(t) => sdk::verify_session_token(t)?.ok_or_else(|| anyhow::anyhow!("unauth"))?,
        None => return Err(anyhow::anyhow!("unauth")),
    };

    // fields allowed to update: name, username, bio (bio ignored for now), avatarUrl
    let name = input.get("name").and_then(|v| v.as_str()).map(|s| s.to_string());
    let username = input.get("username").and_then(|v| v.as_str()).map(|s| s.to_string());

    // perform an upsert-like update by open_id
    let id = db::upsert_user_openid(&open_id, None, username.as_deref(), None, name.as_deref())?;

    Ok(json!({ "ok": true, "userId": id }))
}

pub fn handle_change_password(input: &Value, token: Option<&str>) -> Result<Value> {
    let open_id = match token {
        Some(t) => sdk::verify_session_token(t)?.ok_or_else(|| anyhow::anyhow!("unauth"))?,
        None => return Err(anyhow::anyhow!("unauth")),
    };
    // accept either `currentPassword` or `oldPassword` from frontend
    let current = input.get("currentPassword")
        .or_else(|| input.get("oldPassword"))
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());
    let new = input.get("newPassword").and_then(|v| v.as_str()).map(|s| s.to_string());
    if current.is_none() || new.is_none() {
        return Err(anyhow::anyhow!("missing_passwords"));
    }

    let user = db::get_user_by_openid(&open_id)?.ok_or_else(|| anyhow::anyhow!("user_not_found"))?;
    if let Some(ref hashstr) = user.password_hash {
        if !verify(&current.unwrap(), hashstr)? {
            return Err(anyhow::anyhow!("invalid_current_password"));
        }
    }

    let new_hash = hash(&new.unwrap(), DEFAULT_COST)?;
    // update passwordHash field via upsert (supply new hash)
    db::upsert_user_openid(&open_id, None, None, Some(&new_hash), None)?;

    Ok(json!({ "ok": true }))
}

pub fn handle_get_avatar_upload_url(input: &Value, token: Option<&str>) -> Result<Value> {
    let open_id = match token {
        Some(t) => sdk::verify_session_token(t)?.ok_or_else(|| anyhow::anyhow!("unauth"))?,
        None => return Err(anyhow::anyhow!("unauth")),
    };

    let content_type = input.get("contentType").and_then(|v| v.as_str()).unwrap_or("application/octet-stream");
    // Use s3 stub to generate a signed url (may be empty in local dev)
    let upload_url = crate::server::_core::s3::create_signed_upload_url(content_type);
    // provide a key the frontend can use to reference the avatar (simple heuristic)
    let key = format!("avatars/{}/avatar", open_id);

    Ok(json!({ "ok": true, "uploadUrl": upload_url, "key": key }))
}
