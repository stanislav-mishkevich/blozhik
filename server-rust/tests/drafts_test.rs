use server_rust::server::{_core::sdk, db, handlers::drafts};
use serde_json::json;

#[test]
fn drafts_crud_flow() {
	let _ = db::init_db();
	let user = "user:draft:1";
	let _ = db::upsert_user_openid(user, Some("d@example.com"), Some("d"), None, Some("D"));
	let token = sdk::create_session_token(user, None).expect("token");

	// create draft
	let create_input = json!({ "title": "Hello", "content": "WIP" });
	let res = drafts::handle_create_draft(&create_input, Some(&token)).expect("create");
	assert!(res.get("ok").and_then(|v: &serde_json::Value| v.as_bool()).unwrap_or(false));
	let id = res.get("id").and_then(|v| v.as_i64()).unwrap();

	// get draft
	let get_input = json!({ "id": id });
	let got = drafts::handle_get_draft(&get_input, Some(&token)).expect("get");
	assert_eq!(got.get("id").and_then(|v| v.as_i64()).unwrap(), id);

	// update draft
	let upd = json!({ "id": id, "title": "Hello v2", "content": "WIP2" });
	let ur = drafts::handle_update_draft(&upd, Some(&token)).expect("update");
	assert!(ur.get("ok").and_then(|v: &serde_json::Value| v.as_bool()).unwrap_or(false));

	// list drafts
	let list = drafts::handle_list_drafts(&json!({}), Some(&token)).expect("list");
	let arr = list.as_array().expect("arr");
	assert!(arr.len() >= 1);
}
