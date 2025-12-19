use serde_json::Value;
use std::fs;

/// Load routers-full.json and provide helper utilities for router inspection.
pub fn load_routers() -> Option<Value> {
    let raw = fs::read_to_string("routers-full.json").or_else(|_| fs::read_to_string("../routers-full.json")).ok()?;
    serde_json::from_str(&raw).ok()
}

pub fn is_known_method(method: &str) -> bool {
    if let Some(json) = load_routers() {
        if let Some(routers) = json.get("routers") {
            let parts: Vec<&str> = method.split('.').collect();
            if parts.len() == 2 {
                let router = parts[0];
                let proc = parts[1];
                return routers.get(router).and_then(|r| r.get(proc)).is_some();
            }
        }
    }
    false
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn load_sample() {
        // just ensure loader doesn't panic; may return None in CI
        let _ = load_routers();
    }
}
// routers.ts port stub: register routers and route handlers
pub fn register_routers() {
    // TODO: create handlers matching routers-full.json
}
