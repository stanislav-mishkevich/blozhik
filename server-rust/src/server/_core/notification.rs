use anyhow::Result;
use crate::server::notifications::db as notif_db;
use crate::server::db as core_db;

pub fn create_notification(user_id: i64, message: &str) -> Result<i64> {
	if let Ok(Some(u)) = core_db::get_user_by_id(user_id) {
		let open_id = u.open_id;
		let id = notif_db::create_notification(&open_id, None, "system", Some(&serde_json::json!({"msg": message})))?;
		// broadcast via core hub
		crate::server::_core::notification_hub::NotificationHub::publish(user_id, &serde_json::to_string(&serde_json::json!({"id": id, "msg": message}))?);
		Ok(id)
	} else {
		Err(anyhow::anyhow!("user not found"))
	}
}
