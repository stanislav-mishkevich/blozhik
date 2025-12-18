// env.ts port stub
pub fn get_env(key: &str) -> Option<String> {
    std::env::var(key).ok()
}
