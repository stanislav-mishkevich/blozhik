// Re-export the http_integration module from tests directory
// This makes it accessible to integration tests via backend::tests::http_integration
include!("../tests/http_integration.rs");
