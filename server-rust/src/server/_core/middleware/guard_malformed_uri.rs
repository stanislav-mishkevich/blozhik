// guardMalformedUri middleware: returns false when path contains malformed percent-encoding.
pub fn guard_malformed_uri(path: &str) -> bool {
    let bytes = path.as_bytes();
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b'%' {
            // need two hex digits following
            if i + 2 >= bytes.len() {
                return false;
            }
            let hi = bytes[i + 1];
            let lo = bytes[i + 2];
            let is_hex = |b: u8| match b {
                b'0'..=b'9' | b'a'..=b'f' | b'A'..=b'F' => true,
                _ => false,
            };
            if !is_hex(hi) || !is_hex(lo) {
                return false;
            }
            i += 3;
            continue;
        }
        i += 1;
    }
    true
}
