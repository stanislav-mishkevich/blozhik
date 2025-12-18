use anyhow::Result;
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Notification {
    pub id: i64,
    pub user_open_id: String,
    pub actor_open_id: Option<String>,
    pub verb: String,
    pub data: Option<Value>,
    pub created_at: Option<String>,
    pub read: bool,
}

fn ensure_table(conn: &Connection) -> Result<()> {
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userOpenId TEXT NOT NULL,
            actorOpenId TEXT,
            verb TEXT NOT NULL,
            data TEXT,
            read INTEGER DEFAULT 0,
            createdAt TEXT DEFAULT (datetime('now'))
        );",
    )?;
    Ok(())
}

pub fn create_notification(user_open_id: &str, actor_open_id: Option<&str>, verb: &str, data: Option<&Value>) -> Result<i64> {
    // open a local connection to avoid touching global mutex here
    let mut conn = crate::server::db::open_conn()?;
    ensure_table(&conn)?;
    let data_text = data.map(|d| serde_json::to_string(d).unwrap());
    conn.execute(
        "INSERT INTO notifications (userOpenId, actorOpenId, verb, data) VALUES (?1, ?2, ?3, ?4)",
        params![user_open_id, actor_open_id, verb, data_text],
    )?;
    Ok(conn.last_insert_rowid())
}

pub fn list_notifications_for_user(user_open_id: &str, limit: i64) -> Result<Vec<Notification>> {
    let conn = crate::server::db::open_conn()?;
    ensure_table(&conn)?;
    let mut stmt = conn.prepare("SELECT id, userOpenId, actorOpenId, verb, data, read, createdAt FROM notifications WHERE userOpenId = ?1 ORDER BY id DESC LIMIT ?2")?;
    let mut rows = stmt.query(params![user_open_id, limit])?;
    let mut out = Vec::new();
    while let Some(r) = rows.next()? {
        let data_text: Option<String> = r.get(4)?;
        let data = match data_text {
            Some(t) => serde_json::from_str(&t).ok(),
            None => None,
        };
        out.push(Notification {
            id: r.get(0)?,
            user_open_id: r.get(1)?,
            actor_open_id: r.get(2)?,
            verb: r.get(3)?,
            data,
            read: r.get::<_, i64>(5)? != 0,
            created_at: r.get(6)?,
        });
    }
    Ok(out)
}

pub fn mark_notification_read(notification_id: i64) -> Result<()> {
    let conn = crate::server::db::open_conn()?;
    ensure_table(&conn)?;
    conn.execute("UPDATE notifications SET read = 1 WHERE id = ?1", params![notification_id])?;
    Ok(())
}
