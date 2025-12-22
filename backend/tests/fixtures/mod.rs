pub async fn setup_db() -> String {
    // Return path to an ephemeral sqlite DB for tests
    let path = tempfile::NamedTempFile::new().unwrap();
    let path_str = path.path().to_string_lossy().to_string();
    path_str
}
