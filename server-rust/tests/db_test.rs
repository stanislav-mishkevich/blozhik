use tempfile::NamedTempFile;
use std::env;
use server_rust::server::db;
use anyhow::Result;

#[test]
fn user_crud_flow() -> Result<()> {
    let tmp = NamedTempFile::new()?;
    env::set_var("DATABASE_PATH", tmp.path().to_string_lossy().to_string());

    db::init_db()?;

    // create user
    let id = db::upsert_user_openid("email_1", Some("a@example.com"), Some("alice"), Some("hash"), Some("Alice"))?;
    assert!(id > 0);

    let u = db::get_user_by_email("a@example.com")?.expect("user should exist");
    assert_eq!(u.username.unwrap(), "alice");

    let u2 = db::get_user_by_username("alice")?.expect("user by username");
    assert_eq!(u2.email.unwrap(), "a@example.com");

    Ok(())
}
