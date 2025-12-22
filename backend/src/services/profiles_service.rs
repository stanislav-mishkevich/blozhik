use crate::db::SqlitePool;
use serde::Serialize;

#[derive(Serialize)]
pub struct Profile {
    pub id: i64,
    pub username: String,
    pub display_name: Option<String>,
    pub bio: Option<String>,
    pub avatar_url: Option<String>,
    pub follower_count: i64,
    pub following_count: i64,
}

pub async fn get_profile(pool: &SqlitePool, username: &str) -> Result<Profile, sqlx::Error> {
    let row = sqlx::query!(
        r#"SELECT u.id as id, u.username as username, u.display_name as display_name, u.bio as bio, u.avatar_url as avatar_url,
            (SELECT COUNT(*) FROM follows f WHERE f.followee_id = u.id) as follower_count,
            (SELECT COUNT(*) FROM follows f2 WHERE f2.follower_id = u.id) as following_count
           FROM users u WHERE u.username = ?"#,
        username
    )
    .fetch_one(pool)
    .await?;

    Ok(Profile {
        id: row.id,
        username: row.username,
        display_name: row.display_name,
        bio: row.bio,
        avatar_url: row.avatar_url,
        follower_count: row.follower_count.unwrap_or(0),
        following_count: row.following_count.unwrap_or(0),
    })
}

pub async fn follow_user(pool: &SqlitePool, follower_id: i64, followee_id: i64) -> Result<(), sqlx::Error> {
    sqlx::query!("INSERT INTO follows (follower_id, followee_id) VALUES (?1, ?2)", follower_id, followee_id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn unfollow_user(pool: &SqlitePool, follower_id: i64, followee_id: i64) -> Result<(), sqlx::Error> {
    sqlx::query!("DELETE FROM follows WHERE follower_id = ?1 AND followee_id = ?2", follower_id, followee_id)
        .execute(pool)
        .await?;
    Ok(())
}
