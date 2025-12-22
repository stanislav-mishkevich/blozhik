# Blozhik Backend

Quickstart to run the backend locally (ntex + SQLite):

1. Install Rust stable (use rustup). Recommended components: `rustfmt`, `clippy`.
2. Copy `backend/.env.example` to `backend/.env` and adjust `DATABASE_URL`.
3. Run migrations (if using `sqlx`): `sqlx migrate run`.
4. Start server: `cargo run` (binds to 127.0.0.1:8080 by default).

See `/specs/001-build-fancy-blog/quickstart.md` for more details.
