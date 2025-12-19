use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CookieOptions {
    pub name: String,
    pub path: Option<String>,
    pub http_only: Option<bool>,
    pub secure: Option<bool>,
    pub max_age_seconds: Option<i64>,
}

impl CookieOptions {
    pub fn simple(name: &str) -> Self {
        Self { name: name.to_string(), path: Some("/".to_string()), http_only: Some(true), secure: None, max_age_seconds: None }
    }
}
