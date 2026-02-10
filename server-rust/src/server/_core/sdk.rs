use uuid::Uuid;
use crate::server::db;
use anyhow::Result;

pub fn create_session_token(open_id: &str, _expires_in_ms: Option<i64>) -> Result<String> {
    let token = Uuid::new_v4().to_string();
    // store session in DB (no expiry handling for now)
    db::create_session(&token, open_id, None)?;
    Ok(token)
}

pub fn verify_session_token(token: &str) -> Result<Option<String>> {
    let open_id = db::get_openid_by_session(token)?;
    Ok(open_id)
}

pub fn delete_session_token(token: &str) -> Result<()> {
    db::delete_session(token)?;
    Ok(())
}
// sdk.ts port stub (auth/session integration)
pub fn verify_token(token: &str) -> Option<i64> {
    // Try to resolve session token to a user id
    if let Ok(Some(open_id)) = db::get_openid_by_session(token) {
        if let Ok(Some(user)) = db::get_user_by_openid(&open_id) {
            return Some(user.id);
        }
    }
    None
}
