use server_rust::server::{_core::sdk, handlers::follows, db};
use serde_json::json;

#[test]
fn follow_and_bookmark_flow() {
    let _ = db::init_db();

    // create two users
    let a = "user:fb:1";
    let b = "user:fb:2";
    let _ = db::upsert_user_openid(a, Some("a@example.com"), Some("a"), None, Some("A"));
    let _ = db::upsert_user_openid(b, Some("b@example.com"), Some("b"), None, Some("B"));

    // create session for A
    let token = sdk::create_session_token(a, None).expect("token");

    // A follows B
    let follow_input = json!({ "targetOpenId": b });
    let follow_res = follows::handle_follow(&follow_input, Some(&token)).expect("follow");
    assert!(follow_res.get("ok").and_then(|v: &serde_json::Value| v.as_bool()).unwrap_or(false));

    // list followers for B
    let list_input = json!({ "targetOpenId": b });
    let list = follows::handle_list_followers(&list_input).expect("list");
    let arr = list.as_array().expect("arr");
    assert!(arr.contains(&json!(a)));

    // create a post by B
    let post_id = db::create_post(b, "Hi", "content").expect("post id");

    // A bookmarks post
    let bm_input = json!({ "postId": post_id });
    let bm_res = follows::handle_add_bookmark(&bm_input, Some(&token)).expect("bm");
    assert!(bm_res.get("ok").and_then(|v: &serde_json::Value| v.as_bool()).unwrap_or(false));

    // list bookmarks for A
    let list_bm_input = json!({ });
    let bms = follows::handle_list_bookmarks(&list_bm_input, Some(&token)).expect("list bms");
    let arr2 = bms.as_array().expect("arr2");
    assert!(arr2.contains(&json!(post_id)));
}
