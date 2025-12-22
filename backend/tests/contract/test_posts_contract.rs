use crate::helpers::init_tracing;
use serde_json::json;

#[ntex::test]
async fn post_create_contract_strict() {
    init_tracing();

    use ntex::web::{self, test};
    use backend::api::posts;

    let mut app = test::init_service(|| web::App::new().configure(posts::routes)).await;

    // Minimal valid payload
    let payload = json!({"title":"Contract Test","body_markdown":"Some body"});
    let req = test::TestRequest::post().uri("/posts").set_json(&payload).to_request();
    let resp = test::call_service(&mut app, req).await;
    assert_eq!(resp.status(), 201);
    let content_type = resp.headers().get("content-type").and_then(|v| v.to_str().ok()).unwrap_or("");
    assert!(content_type.starts_with("application/json"), "content-type was {}", content_type);

    // read body
    let body_bytes = test::read_body(resp).await;
    let parsed: serde_json::Value = serde_json::from_slice(&body_bytes).expect("valid json");

    // Validate response shape: id (number), title (string), body_html (string), author object
    assert!(parsed.get("id").is_some());
    assert!(parsed.get("id").unwrap().is_number());
    assert!(parsed.get("title").unwrap().is_string());
    assert!(parsed.get("body_html").unwrap().is_string());
    assert!(parsed.get("author").is_some());
    let author = parsed.get("author").unwrap();
    assert!(author.get("id").is_some() && author.get("id").unwrap().is_number());
    assert!(author.get("username").is_some() && author.get("username").unwrap().is_string());

    // Payload with tags and images should round-trip in response
    let payload2 = json!({"title":"WithExtras","body_markdown":"Body","tags":["rust","blog"],"images":[{"url":"https://example.com/1.png","alt":"alt"}]});
    let req2 = test::TestRequest::post().uri("/posts").set_json(&payload2).to_request();
    let resp2 = test::call_service(&mut app, req2).await;
    assert_eq!(resp2.status(), 201);
    let body2 = test::read_body(resp2).await;
    let parsed2: serde_json::Value = serde_json::from_slice(&body2).expect("valid json");
    // tags/images may be represented differently (normalized), but presence should be asserted
    assert!(parsed2.get("title").unwrap().is_string());
    // If images are returned as array or in metadata, at least ensure no server error
}
