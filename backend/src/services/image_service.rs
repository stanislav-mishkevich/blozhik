pub struct ImageService;

impl ImageService {
    pub fn validate_size(bytes: usize) -> bool {
        bytes <= 10 * 1024 * 1024 // 10MB limit
    }

    pub fn validate_mime(mime: &str) -> bool {
        // Accept common image MIME types
        matches!(mime, "image/png" | "image/jpeg" | "image/jpg" | "image/gif" | "image/webp")
    }
}

#[cfg(test)]
mod tests {
    use super::ImageService;

    #[test]
    fn size_accepts_small() {
        assert!(ImageService::validate_size(1024));
    }

    #[test]
    fn size_rejects_large() {
        assert!(!ImageService::validate_size(11 * 1024 * 1024));
    }

    #[test]
    fn mime_accepts_known() {
        assert!(ImageService::validate_mime("image/png"));
        assert!(ImageService::validate_mime("image/jpeg"));
        assert!(ImageService::validate_mime("image/webp"));
    }

    #[test]
    fn mime_rejects_unknown() {
        assert!(!ImageService::validate_mime("text/plain"));
        assert!(!ImageService::validate_mime("application/octet-stream"));
    }
}
