use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct PostTag {
    pub post_id: i64,
    pub tag_id: i64,
}
