use actix_web::cookie::{Cookie, SameSite};

pub fn build_session_cookie(name: &str, value: &str, max_age_seconds: Option<i64>, secure: bool) -> Cookie<'static> {
    let mut builder = Cookie::build(name, value).path("/").http_only(true).same_site(SameSite::Lax).secure(secure);
    if let Some(age) = max_age_seconds {
        builder = builder.max_age(time::Duration::seconds(age));
    }
    builder.finish()
}

pub fn clear_cookie(name: &str, secure: bool) -> Cookie<'static> {
    Cookie::build(name, "").path("/").http_only(true).secure(secure).same_site(SameSite::Lax).max_age(time::Duration::seconds(0)).finish()
}
