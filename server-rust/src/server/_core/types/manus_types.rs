use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ManusType {
	pub id: Option<i64>,
	pub name: Option<String>,
}

impl Default for ManusType {
	fn default() -> Self { Self { id: None, name: None } }
}
