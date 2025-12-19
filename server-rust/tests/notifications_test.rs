use server_rust::server;
use serde_json::json;

#[test]
fn publish_and_list_notifications() {
	// isolate DB per test using a temp dir and a path (avoid pre-created file)
	let tmpdir = tempfile::tempdir().expect("tmpdir");
	let db_path = tmpdir.path().join("test_db.sqlite");
	let path = db_path.to_str().unwrap().to_string();
	std::env::set_var("DATABASE_PATH", &path);
	let _ = server::db::init_db();

	// create users
	let open_id = "user:notify:1";
	let _ = server::db::upsert_user_openid(open_id, Some("n@example.com"), Some("notify1"), None, Some("Notify One"));

	// publish a notification (no actor token)
	let input = json!({ "userOpenId": open_id, "verb": "hello", "data": {"msg":"hi"} });
	let res = server::notifications::handlers::handle_publish(&input, None).expect("publish ok");
	assert!(res.get("ok").and_then(|v| v.as_bool()).unwrap_or(false));
	let id = res.get("id").and_then(|v| v.as_i64()).unwrap();
	assert!(id > 0);

	// list notifications for user
	let list_input = json!({ "userOpenId": open_id, "limit": 10 });
	let list = server::notifications::handlers::handle_list(&list_input, None).expect("list ok");
	let arr = list.as_array().expect("array");
	assert!(arr.len() >= 1);
	let first = &arr[0];
	assert_eq!(first.get("id").and_then(|v| v.as_i64()).unwrap(), id);
}

#[test]
fn mark_read_and_unread_count() {
	// isolate DB per test using a temp dir and a path (avoid pre-created file)
	let tmpdir = tempfile::tempdir().expect("tmpdir");
	let db_path = tmpdir.path().join("test_db.sqlite");
	let path = db_path.to_str().unwrap().to_string();
	std::env::set_var("DATABASE_PATH", &path);
	let _ = server::db::init_db();
	let open_id = "user:notify:2";
	let _ = server::db::upsert_user_openid(open_id, Some("n2@example.com"), Some("notify2"), None, Some("Notify Two"));

	// publish two notifications
	let input1 = json!({ "userOpenId": open_id, "verb": "one" });
	let r1 = server::notifications::handlers::handle_publish(&input1, None).expect("p1");
	let id1 = r1.get("id").and_then(|v| v.as_i64()).unwrap();
	let input2 = json!({ "userOpenId": open_id, "verb": "two" });
	let r2 = server::notifications::handlers::handle_publish(&input2, None).expect("p2");
	let _id2 = r2.get("id").and_then(|v| v.as_i64()).unwrap();

	// create session for the user so they can mark as read
	let token = server::_core::sdk::create_session_token(open_id, None).expect("token");

	// unread count should be 2
	let cnt = server::notifications::handlers::handle_unread_count(&json!({ "userOpenId": open_id }), None).expect("cnt");
	assert_eq!(cnt.get("unread").and_then(|v| v.as_i64()).unwrap_or(0), 2);

	// mark one read (authenticated)
	let mr = server::notifications::handlers::handle_mark_read(&json!({ "id": id1 }), Some(&token)).expect("mr");
	assert!(mr.get("ok").and_then(|v| v.as_bool()).unwrap_or(false));

	let cnt2 = server::notifications::handlers::handle_unread_count(&json!({ "userOpenId": open_id }), None).expect("cnt2");
	assert_eq!(cnt2.get("unread").and_then(|v| v.as_i64()).unwrap_or(0), 1);
}

#[test]
fn mark_all_read_for_user() {
	let tmpdir = tempfile::tempdir().expect("tmpdir");
	let db_path = tmpdir.path().join("test_db.sqlite");
	let path = db_path.to_str().unwrap().to_string();
	std::env::set_var("DATABASE_PATH", &path);
	let _ = server::db::init_db();
	let open_id = "user:notify:3";
	let _ = server::db::upsert_user_openid(open_id, Some("n3@example.com"), Some("notify3"), None, Some("Notify Three"));

	// publish three notifications
	for v in &["a", "b", "c"] {
		let input = serde_json::json!({ "userOpenId": open_id, "verb": v });
		let _ = server::notifications::handlers::handle_publish(&input, None).expect("publish");
	}

	// create session token
	let token = server::_core::sdk::create_session_token(open_id, None).expect("token");

	let before = server::notifications::handlers::handle_unread_count(&json!({ "userOpenId": open_id }), None).expect("before");
	assert_eq!(before.get("unread").and_then(|v| v.as_i64()).unwrap_or(0), 3);

	// mark all read authenticated
	let res = server::notifications::handlers::handle_mark_all_read(&json!({}), Some(&token)).expect("mark_all");
	assert!(res.get("ok").and_then(|v| v.as_bool()).unwrap_or(false));
	assert!(res.get("changed").and_then(|v| v.as_i64()).unwrap_or(0) >= 1);

	let after = server::notifications::handlers::handle_unread_count(&json!({ "userOpenId": open_id }), None).expect("after");
	assert_eq!(after.get("unread").and_then(|v| v.as_i64()).unwrap_or(0), 0);
}
