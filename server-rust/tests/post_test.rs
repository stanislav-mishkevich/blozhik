use tempfile::NamedTempFile;
use std::env;
use serde_json::json;
use anyhow::Result;

#[test]
fn create_and_list_posts() -> Result<()> {
    let tmp = NamedTempFile::new()?;
    env::set_var("DATABASE_PATH", tmp.path().to_string_lossy().to_string());
    // init db
    server_rust::server::db::init_db()?;

    // create a user to own the post
    let openid = "test_openid";
    let id = server_rust::server::db::upsert_user_openid(openid, Some("a@b.com"), Some("u"), Some("h"), Some("Name"))?;
    assert!(id > 0);

    // create post via db helper
    let post_id = server_rust::server::db::create_post(openid, "Hello", "world")?;
    assert!(post_id > 0);

    // get post
    let got = server_rust::server::db::get_post_by_id(post_id)?.expect("post exists");
    assert_eq!(got.title, "Hello");

    // list
    let list = server_rust::server::db::list_posts()?;
    assert!(list.len() >= 1);

    Ok(())
}
