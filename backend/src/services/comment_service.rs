use crate::models::comment::{Comment, NewComment};
use sqlx::SqlitePool;
use chrono::Utc;

pub async fn create_comment(pool: &SqlitePool, new: NewComment) -> anyhow::Result<Comment> {
    let now = Utc::now();
    let now_str = now.to_rfc3339();
    let rec = sqlx::query(
        "INSERT INTO comments (post_id, author_id, body, status, created_at, updated_at) VALUES (?, ?, ?, 'visible', ?, ?);",
    )
    .bind(new.post_id)
    .bind(new.author_id)
    .bind(new.body.clone())
    .bind(now_str.clone())
    .bind(now_str.clone())
    .execute(pool)
    .await?;

    let id = rec.last_insert_rowid();

    Ok(Comment {
        id,
        post_id: new.post_id,
        author_id: new.author_id,
        body: new.body,
        status: "visible".to_string(),
        created_at: now,
        updated_at: now,
    })
}
