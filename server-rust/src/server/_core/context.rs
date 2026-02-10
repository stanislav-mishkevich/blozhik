use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RequestContext {
    pub open_id: Option<String>,
}

impl RequestContext {
    pub fn new() -> Self { Self { open_id: None } }
    pub fn with_open_id(id: &str) -> Self { Self { open_id: Some(id.to_string()) } }
}
