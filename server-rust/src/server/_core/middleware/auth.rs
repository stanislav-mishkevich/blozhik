// Simple auth helper for request handlers.
use anyhow::Result;
use crate::server::_core::sdk;

/// Authenticate by optional session token (cookie/header). Returns Some(open_id) if valid.
pub fn authenticate_request(token_cookie: Option<&str>) -> Result<Option<String>> {
    if let Some(t) = token_cookie {
        let user = sdk::verify_session_token(t)?;
        return Ok(user);
    }
    Ok(None)
}
