use tempfile::NamedTempFile;
use std::env;
use serde_json::json;
use anyhow::Result;

#[test]
fn register_and_login_flow() -> Result<()> {
    let tmp = NamedTempFile::new()?;
    env::set_var("DATABASE_PATH", tmp.path().to_string_lossy().to_string());

    // initialize DB
    server_rust::server::db::init_db()?;

    // Register
    let reg_input = json!({ "email": "bob@example.com", "password": "password123", "username": "bob" });
    let r = server_rust::server::handlers::auth::handle_register(&reg_input)?;
    assert_eq!(r.get("ok").and_then(|v: &serde_json::Value| v.as_bool()), Some(true));

    // Login
    let login_input = json!({ "email": "bob@example.com", "password": "password123" });
    let res = server_rust::server::handlers::auth::handle_login(&login_input)?;
    assert_eq!(res.get("ok").and_then(|v: &serde_json::Value| v.as_bool()), Some(true));
    let cookie = res.get("setCookie").and_then(|v: &serde_json::Value| v.get("value")).and_then(|v: &serde_json::Value| v.as_str()).unwrap().to_string();

    // Verify session
    let openid = server_rust::server::_core::sdk::verify_session_token(&cookie)?;
    assert!(openid.is_some());

    Ok(())
}
