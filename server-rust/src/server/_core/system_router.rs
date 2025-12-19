use serde_json::Value;
use std::fs;

/// Load routers-full.json if available to allow runtime inspection.
pub fn load_routers() -> Value {
    fs::read_to_string("routers-full.json").or_else(|_| fs::read_to_string("../routers-full.json")).ok().and_then(|s| serde_json::from_str(&s).ok()).unwrap_or(Value::Null)
}

/// Return basePath or empty string
pub fn base_path() -> String {
    load_routers().get("basePath").and_then(|v| v.as_str()).unwrap_or("").to_string()
}
// systemRouter.ts port stub
pub fn system_info() -> String { "ok".to_string() }
