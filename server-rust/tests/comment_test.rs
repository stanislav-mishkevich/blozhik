use tempfile::NamedTempFile;
use std::env;
use anyhow::Result;

#[test]
fn create_and_list_comments() -> Result<()> {
    let tmp = NamedTempFile::new()?;
    env::set_var("DATABASE_PATH", tmp.path().to_string_lossy().to_string());
    server_rust::server::db::init_db()?;

    let openid = "c_openid";
    let uid = server_rust::server::db::upsert_user_openid(openid, Some("c@c.com"), Some("cuser"), Some("h"), Some("C"))?;
    assert!(uid > 0);

    // create post
    let post_id = server_rust::server::db::create_post(openid, "P", "C")?;
    assert!(post_id > 0);

    // add comments
    let cid = server_rust::server::db::create_comment(post_id, openid, "first")?;
    assert!(cid > 0);

    let comments = server_rust::server::db::list_comments_for_post(post_id)?;
    assert!(comments.len() >= 1);

    Ok(())
}
