use ntex::web::HttpRequest;

/// Extract user id from Authorization: Bearer <jwt>
/// Uses env var `JWT_SECRET` or default "test-secret" to decode.
pub fn extract_user_id_from_jwt(req: &HttpRequest) -> Option<i64> {
    if let Some(hv) = req.head().headers().get("authorization") {
        if let Ok(s) = hv.to_str() {
            if let Some(token) = s.strip_prefix("Bearer ") {
                let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "test-secret".to_string());
                if let Ok(claims) = crate::auth::jwt::decode_jwt(token, &secret) {
                    if let Ok(id) = claims.sub.parse::<i64>() {
                        return Some(id);
                    }
                }
            }
        }
    }
    None
}
