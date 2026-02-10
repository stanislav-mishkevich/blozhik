use anyhow::Result;
use serde_json::Value;
use crate::server::db;
use crate::server::_core::sdk;
use bcrypt::{hash, verify, DEFAULT_COST};
use uuid::Uuid;

pub fn handle_register(input: &Value) -> Result<Value> {
	let email = input.get("email").and_then(|v| v.as_str()).map(|s| s.to_string());
	let username = input.get("username").and_then(|v| v.as_str()).map(|s| s.to_string());
	let password = input.get("password").and_then(|v| v.as_str()).map(|s| s.to_string());
	let name = input.get("name").and_then(|v| v.as_str()).map(|s| s.to_string());

	if password.is_none() {
		return Err(anyhow::anyhow!("password_required"));
	}

	if let Some(ref e) = email {
		if db::get_user_by_email(e)?.is_some() {
			return Err(anyhow::anyhow!("email_taken"));
		}
	}
	if let Some(ref u) = username {
		if db::get_user_by_username(u)?.is_some() {
			return Err(anyhow::anyhow!("username_taken"));
		}
	}

	let pwd_hash = hash(password.as_ref().unwrap(), DEFAULT_COST)?;
	let open_id = Uuid::new_v4().to_string();
	let id = db::upsert_user_openid(
		&open_id,
		email.as_deref(),
		username.as_deref(),
		Some(&pwd_hash),
		name.as_deref(),
	)?;

	Ok(serde_json::json!({ "ok": true, "user": { "id": id, "openId": open_id, "email": email, "username": username, "name": name } }))
}

pub fn handle_login(input: &Value) -> Result<Value> {
	let email = input.get("email").and_then(|v| v.as_str()).map(|s| s.to_string());
	let username = input.get("username").and_then(|v| v.as_str()).map(|s| s.to_string());
	let password = input.get("password").and_then(|v| v.as_str()).map(|s| s.to_string());

	if password.is_none() {
		return Err(anyhow::anyhow!("password_required"));
	}

	let user_opt = if let Some(ref e) = email {
		db::get_user_by_email(e)?
	} else if let Some(ref u) = username {
		db::get_user_by_username(u)?
	} else {
		return Err(anyhow::anyhow!("missing_identifier"));
	};

	let user = match user_opt {
		Some(u) => u,
		None => return Err(anyhow::anyhow!("user_not_found")),
	};

	if let Some(ref hash_str) = user.password_hash {
		if !verify(password.as_ref().unwrap(), hash_str)? {
			return Err(anyhow::anyhow!("invalid_credentials"));
		}
	} else {
		return Err(anyhow::anyhow!("no_password_set"));
	}

	let token = sdk::create_session_token(&user.open_id, None)?;
	// 30 days in seconds
	let max_age = 60 * 60 * 24 * 30;

	Ok(serde_json::json!({ "ok": true, "user": { "id": user.id, "openId": user.open_id, "email": user.email, "username": user.username, "name": user.name }, "setCookie": { "name": "app_session_id", "value": token, "maxAge": max_age } }))
}

pub fn handle_logout(_input: &Value, token: Option<&str>) -> Result<Value> {
	if let Some(t) = token {
		let _ = sdk::delete_session_token(t);
	}
	Ok(serde_json::json!({ "ok": true, "clearCookie": { "name": "app_session_id" } }))
}

pub fn handle_me(token: Option<&str>) -> Result<Value> {
	if let Some(t) = token {
		if let Ok(Some(open_id)) = sdk::verify_session_token(t) {
			if let Some(user) = db::get_user_by_openid(&open_id)? {
				return Ok(serde_json::json!({ "ok": true, "user": { "id": user.id, "openId": user.open_id, "email": user.email, "username": user.username, "name": user.name } }));
			}
		}
	}
	Ok(serde_json::json!(null))
}
