use crate::db::SqlitePool;
use serde::Serialize;

#[derive(Serialize)]
pub struct SearchResult {
    pub id: i64,
    pub title: String,
    pub slug: String,
    pub excerpt: Option<String>,
}

pub async fn search_posts(pool: &SqlitePool, q: &str, limit: i64, offset: i64) -> Result<Vec<SearchResult>, sqlx::Error> {
    // Use FTS5 match operator
    let rows = sqlx::query!(
        r#"SELECT p.id as id, p.title as title, p.slug as slug, snippet(posts_fts, 0, '<b>', '</b>', '...', 10) as excerpt
           FROM posts_fts f JOIN posts p ON f.rowid = p.id
           WHERE posts_fts MATCH ?
           ORDER BY rank
           LIMIT ? OFFSET ?"#,
        q,
        limit,
        offset
    )
    .fetch_all(pool)
    .await?;

    let results = rows.into_iter().map(|r| SearchResult {
        id: r.id,
        title: r.title,
        slug: r.slug,
        excerpt: r.excerpt,
    }).collect();

    Ok(results)
}
