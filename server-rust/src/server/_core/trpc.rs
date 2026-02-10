use serde_json::Value;
use std::fs;

/// Dispatch a tRPC-style method to a handler or return a standard not-implemented response.
pub fn dispatch(method: &str, input: &Value, token: Option<&str>) -> Value {
    // load routers schema once from file (best-effort)
    let routers_raw = fs::read_to_string("routers-full.json").or_else(|_| fs::read_to_string("../routers-full.json"));
    if let Ok(s) = routers_raw {
        if let Ok(json) = serde_json::from_str::<Value>(&s) {
            if let Some(routers) = json.get("routers") {
                let parts: Vec<&str> = method.split('.').collect();
                if parts.len() == 2 {
                    let router = parts[0];
                    let proc = parts[1];
                    if routers.get(router).and_then(|r| r.get(proc)).is_some() {
                        // Known method but unimplemented server-side: return not implemented
                        return serde_json::json!({ "error": "not_implemented", "method": method });
                    }
                }
            }
        }
    }
    // Fallback: unknown method
    serde_json::json!({ "error": "unknown_method", "method": method })
}

/// Minimal tRPC helper utilities used by handlers.
pub fn extract_input(params: &Value) -> Value {
    if params.is_array() {
        params.as_array().and_then(|arr| arr.get(0)).cloned().unwrap_or(Value::Null)
    } else if params.is_object() && params.get("input").is_some() {
        params.get("input").cloned().unwrap()
    } else {
        params.clone()
    }
}

pub fn ok_response(value: Value) -> Value {
    value
}

pub fn error_response(message: &str) -> Value {
    serde_json::json!({ "error": message })
}
// trpc.ts port stub - tRPC compatibility layer
pub fn handle_trpc_request() {
    // TODO: implement request parsing and routing according to routers-full.json
}
