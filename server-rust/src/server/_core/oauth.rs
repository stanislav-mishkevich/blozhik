use anyhow::Result;
use serde_json::Value;

/// Exchange an OAuth code for a token (stub).
pub fn exchange_code(_provider: &str, _code: &str) -> Result<Option<String>> {
    // In production, call provider token endpoint. Here return a dummy token.
    Ok(Some("oauth_dummy_token".to_string()))
}

/// Fetch user info from provider using token (stub).
pub fn get_user_info(_provider: &str, _token: &str) -> Result<Option<Value>> {
    Ok(Some(serde_json::json!({ "id": "oauth:user:1", "email": "oauth@example.com" })))
}
// oauth.ts port stub
pub fn handle_oauth_callback() {
    // TODO: implement OAuth flow
}
