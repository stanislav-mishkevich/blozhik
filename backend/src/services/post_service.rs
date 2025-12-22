use crate::models::post::Post;
use sqlx::SqlitePool;
use tracing::info;

pub struct PostService;

impl PostService {
    pub async fn create(pool: &SqlitePool, author_id: i64, title: &str, body_markdown: &str, tags: Option<&Vec<String>>) -> Result<Post, sqlx::Error> {
        let body_html = Self::render_markdown(body_markdown);
        let slug = title.to_lowercase().replace(" ", "-");
        let insert_sql = "INSERT INTO posts (author_id, title, slug, body_markdown, body_html, status, published_at) VALUES (?1, ?2, ?3, ?4, ?5, 'published', CURRENT_TIMESTAMP)";
        let result = sqlx::query(insert_sql)
            .bind(author_id)
            .bind(title)
            .bind(slug)
            .bind(body_markdown)
            .bind(body_html.clone())
            .execute(pool)
            .await?;

        let last_id = result.last_insert_rowid();

        // handle tags if provided
        if let Some(tags) = tags {
            for tag in tags {
                // upsert tag
                let tag_id: i64 = match sqlx::query_scalar("SELECT id FROM tags WHERE slug = ?1")
                    .bind(tag)
                    .fetch_optional(pool)
                    .await?
                {
                    Some(id) => id,
                    None => {
                        let res = sqlx::query("INSERT INTO tags (name, slug) VALUES (?1, ?2)")
                            .bind(tag)
                            .bind(tag)
                            .execute(pool)
                            .await?;
                        res.last_insert_rowid()
                    }
                };
                // insert into post_tags
                let _ = sqlx::query("INSERT INTO post_tags (post_id, tag_id) VALUES (?1, ?2)")
                    .bind(last_id)
                    .bind(tag_id)
                    .execute(pool)
                    .await?;
            }
        }

        let rec = sqlx::query_as::<_, Post>("SELECT id, author_id, title, slug, body_markdown, body_html, rendered_preview, status, images, created_at, updated_at, published_at FROM posts WHERE id = ?1")
            .bind(last_id)
            .fetch_one(pool)
            .await?;
        info!(post_id = last_id, "created post");
        Ok(rec)
    }

    pub async fn list(pool: &SqlitePool, page: i64, per_page: i64) -> Result<Vec<Post>, sqlx::Error> {
        let offset = (page - 1) * per_page;
        let rows = sqlx::query_as::<_, Post>("SELECT id, author_id, title, slug, body_markdown, body_html, rendered_preview, status, images, created_at, updated_at, published_at FROM posts WHERE status = 'published' ORDER BY published_at DESC LIMIT ?1 OFFSET ?2")
            .bind(per_page)
            .bind(offset)
            .fetch_all(pool)
            .await?;
        Ok(rows)
    }

    pub fn render_markdown(md: &str) -> String {
        // Very small markdown-to-html fallback
        md.replace("\n", "<br />")
    }

}

#[cfg(test)]
mod tests {
    use super::PostService;

    #[test]
    fn render_markdown_replaces_newlines() {
        let md = "Hello\nWorld";
        let html = PostService::render_markdown(md);
        assert_eq!(html, "Hello<br />World");
    }

    #[test]
    fn render_markdown_empty() {
        let md = "";
        let html = PostService::render_markdown(md);
        assert_eq!(html, "");
    }
}
