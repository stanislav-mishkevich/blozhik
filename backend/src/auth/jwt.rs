use jsonwebtoken::{decode, encode, Algorithm, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub exp: usize,
}

pub fn encode_jwt(
    subject: &str,
    secret: &str,
    ttl_seconds: u64,
) -> Result<String, jsonwebtoken::errors::Error> {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs();
    let claims = Claims {
        sub: subject.to_string(),
        exp: (now + ttl_seconds) as usize,
    };
    encode(
        &Header::new(Algorithm::HS256),
        &claims,
        &EncodingKey::from_secret(secret.as_ref()),
    )
}

pub fn decode_jwt(token: &str, secret: &str) -> Result<Claims, jsonwebtoken::errors::Error> {
    let token_data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_ref()),
        &Validation::new(Algorithm::HS256),
    )?;
    Ok(token_data.claims)
}

pub fn extract_user_id_from_request(req: &ntex::web::HttpRequest) -> Result<i64, &'static str> {
    let auth_header = req.headers().get("Authorization")
        .and_then(|h| h.to_str().ok())
        .ok_or("Missing Authorization header")?;

    let token = auth_header
        .strip_prefix("Bearer ")
        .ok_or("Invalid Authorization header format")?;

    let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "default-secret".to_string());
    let claims = decode_jwt(token, &secret)
        .map_err(|_| "Invalid JWT token")?;

    claims.sub.parse::<i64>()
        .map_err(|_| "Invalid user ID in JWT")
}
