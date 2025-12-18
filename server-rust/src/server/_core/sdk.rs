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
pub fn verify_token(_token: &str) -> Option<i64> { None }
