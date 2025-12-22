use crate::models::reaction::{NewReaction, Reaction};
use sqlx::SqlitePool;
use chrono::Utc;

pub async fn add_reaction(pool: &SqlitePool, new: NewReaction) -> anyhow::Result<Reaction> {
    let now = Utc::now();

    let now_str = now.to_rfc3339();
    let rec = sqlx::query(
        "INSERT INTO reactions (subject_type, subject_id, user_id, type, created_at) VALUES (?, ?, ?, ?, ?);",
    )
    .bind(new.subject_type.clone())
    .bind(new.subject_id)
    .bind(new.user_id)
    .bind(new.r#type.clone())
    .bind(now_str.clone())
    .execute(pool)
    .await?;

    let id = rec.last_insert_rowid();

    Ok(Reaction {
        id,
        subject_type: new.subject_type,
        subject_id: new.subject_id,
        user_id: new.user_id,
        r#type: new.r#type,
        created_at: now,
    })
}
