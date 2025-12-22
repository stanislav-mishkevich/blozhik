use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Reaction {
    pub id: i64,
    pub subject_type: String, // "post" | "comment"
    pub subject_id: i64,
    pub user_id: i64,
    pub r#type: String, // "like", "upvote", etc.
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NewReaction {
    pub subject_type: String,
    pub subject_id: i64,
    pub user_id: i64,
    pub r#type: String,
}
