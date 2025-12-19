pub fn build_feed(title: &str, items: Vec<(String, String)>) -> String {
    let mut s = String::new();
    s.push_str(&format!("<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<rss version=\"2.0\">\n<channel>\n<title>{}</title>\n", title));
    for (title, link) in items {
        s.push_str(&format!("<item><title>{}</title><link>{}</link></item>\n", title, link));
    }
    s.push_str("</channel>\n</rss>\n");
    s
}
// rss.ts port stub
pub fn generate_rss() -> String {
    // Minimal feed for dev: empty items with project title
    build_feed("blozhik", vec![])
}
