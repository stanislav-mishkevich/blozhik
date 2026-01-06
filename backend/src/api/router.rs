use ntex::web::{self, HttpResponse};
use serde::{Deserialize, Serialize};
use serde_json::json;

#[derive(Deserialize)]
struct RpcRequest {
    id: Option<i64>,
    method: String,
    params: Option<RpcParams>,
}

#[derive(Deserialize)]
struct RpcParams {
    path: String,
    input: Option<serde_json::Value>,
}

#[derive(Serialize)]
struct RpcSuccess {
    id: Option<i64>,
    result: serde_json::Value,
}

#[derive(Serialize)]
struct RpcError {
    id: Option<i64>,
    error: ErrorDetail,
}

#[derive(Serialize)]
struct ErrorDetail {
    message: String,
}

async fn rpc_handler(body: web::types::Json<RpcRequest>) -> HttpResponse {
    let path = body.params.as_ref().map(|p| p.path.as_str()).unwrap_or("");
    
    // Return stub data for common methods to prevent client errors
    let result = match path {
        // Auth methods
        "auth.me" => json!({ "data": null }), // Return null = not authenticated
        "auth.login" => json!({ "data": { "success": true } }),
        "auth.logout" => json!({ "data": { "success": true } }),
        "auth.register" => json!({ "data": { "success": true } }),
        
        // Category methods
        "category.list" => json!({ "data": [] }),
        "category.getPopular" => json!({ "data": [] }),
        "category.getBySlug" => json!({ "data": null }),
        
        // Tag methods
        "tag.getPopular" => json!({ "data": [] }),
        "tag.getTrending" => json!({ "data": [] }),
        "tag.getAll" => json!({ "data": [] }),
        
        // Announcement methods
        "announcement.getActive" => json!({ "data": [] }),
        "announcement.getAll" => json!({ "data": [] }),
        
        // User methods
        "user.getProfile" => json!({ "data": null }),
        "user.updateProfile" => json!({ "data": { "success": true } }),
        "user.changePassword" => json!({ "data": { "success": true } }),
        "user.getAvatarUploadUrl" => json!({ "data": { "url": "", "fields": {} } }),
        
        // Comment methods
        "comment.getByPostId" => json!({ "data": [] }),
        "comment.create" => json!({ "data": { "id": 1 } }),
        "comment.delete" => json!({ "data": { "success": true } }),
        "comment.getReaction" => json!({ "data": null }),
        "comment.getReplies" => json!({ "data": [] }),
        "comment.react" => json!({ "data": { "success": true } }),
        
        // Admin methods
        p if p.starts_with("admin.") => json!({ "data": [] }),
        
        // Post methods (most should use REST endpoints)
        "post.getDrafts" => json!({ "data": [] }),
        "post.saveDraft" => json!({ "data": { "id": 1 } }),
        "post.update" => json!({ "data": { "success": true } }),
        "post.getVersions" => json!({ "data": [] }),
        "post.revertToVersion" => json!({ "data": { "success": true } }),
        
        _ => {
            return HttpResponse::NotImplemented().json(&RpcError {
                id: body.id,
                error: ErrorDetail {
                    message: format!("Method '{}' not implemented. Please use REST endpoints or implement this RPC method.", path),
                },
            });
        }
    };
    
    HttpResponse::Ok().json(&RpcSuccess {
        id: body.id,
        result,
    })
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    // RPC fallback handler for legacy client calls
    cfg.route("", web::post().to(rpc_handler));
    
    crate::api::posts::routes(cfg);
    crate::api::comments::routes(cfg);
    crate::api::reactions::routes(cfg);
    crate::api::search::routes(cfg);
    crate::api::profiles::routes(cfg);
}
