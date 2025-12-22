use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct Follow {
    pub follower_id: i64,
    pub followee_id: i64,
    pub created_at: Option<String>,
}

impl Follow {
    pub fn new(follower_id: i64, followee_id: i64) -> Self {
        Self { follower_id, followee_id, created_at: None }
    }
}
