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
    let row = sqlx::query_as::<_, (i64, String, Option<String>, Option<String>, Option<String>, i64, i64)>(
        r#"SELECT u.id, u.username, u.display_name, u.bio, u.avatar_url,
            (SELECT COUNT(*) FROM follows f WHERE f.followee_id = u.id) as follower_count,
            (SELECT COUNT(*) FROM follows f2 WHERE f2.follower_id = u.id) as following_count
           FROM users u WHERE u.username = ?"#
    )
    .bind(username)
    .fetch_one(pool)
    .await?;

    Ok(Profile {
        id: row.0,
        username: row.1,
        display_name: row.2,
        bio: row.3,
        avatar_url: row.4,
        follower_count: row.5,
        following_count: row.6,
    })
}

pub async fn follow_user(pool: &SqlitePool, follower_id: i64, followee_id: i64) -> Result<(), sqlx::Error> {
    sqlx::query("INSERT INTO follows (follower_id, followee_id) VALUES (?1, ?2)")
        .bind(follower_id)
        .bind(followee_id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn unfollow_user(pool: &SqlitePool, follower_id: i64, followee_id: i64) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM follows WHERE follower_id = ?1 AND followee_id = ?2")
        .bind(follower_id)
        .bind(followee_id)
        .execute(pool)
        .await?;
    Ok(())
}
