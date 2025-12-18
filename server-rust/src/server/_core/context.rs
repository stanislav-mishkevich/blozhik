// context.ts port stub
pub struct RequestContext {
    pub user_id: Option<i64>,
}

impl RequestContext {
    pub fn new() -> Self { Self { user_id: None } }
}
