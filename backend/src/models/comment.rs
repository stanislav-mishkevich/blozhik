use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Comment {
    pub id: i64,
    pub post_id: i64,
    pub author_id: Option<i64>,
    pub body: String,
    pub status: String, // "visible" | "hidden"
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NewComment {
    pub post_id: i64,
    pub author_id: Option<i64>,
    pub body: String,
}
