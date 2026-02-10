use server_rust::server::{_core::sdk, db, handlers::reactions};
use serde_json::json;

#[test]
fn reactions_flow() {
    let _ = db::init_db();
    let user = "user:react:1";
    let _ = db::upsert_user_openid(user, Some("r@example.com"), Some("r"), None, Some("R"));
    let token = sdk::create_session_token(user, None).expect("token");

    // create post
    let post_id = db::create_post(user, "Post", "Content").expect("post");

    // add reaction
    let add = json!({ "postId": post_id, "reaction": "like" });
    let ar = reactions::handle_add(&add, Some(&token)).expect("add");
    assert!(ar.get("ok").and_then(|v: &serde_json::Value| v.as_bool()).unwrap_or(false));

    // count
    let cnt = reactions::handle_count(&json!({ "postId": post_id })).expect("count");
    assert_eq!(cnt.get("count").and_then(|v| v.as_i64()).unwrap_or(0), 1);

    // list
    let lst = reactions::handle_list(&json!({ "postId": post_id })).expect("list");
    let arr = lst.as_array().expect("arr");
    assert!(arr.len() >= 1);

    // remove
    let rem = reactions::handle_remove(&add, Some(&token)).expect("rem");
    assert!(rem.get("ok").and_then(|v: &serde_json::Value| v.as_bool()).unwrap_or(false));

    let cnt2 = reactions::handle_count(&json!({ "postId": post_id })).expect("count2");
    assert_eq!(cnt2.get("count").and_then(|v| v.as_i64()).unwrap_or(0), 0);
}
