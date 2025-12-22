# Blozhik Backend

Quickstart to run the backend locally (ntex + SQLite):

1. Install Rust stable (use rustup). Recommended components: `rustfmt`, `clippy`.
2. Copy `backend/.env.example` to `backend/.env` and adjust `DATABASE_URL`.
3. Run migrations (if using `sqlx`): `sqlx migrate run`.
4. Start server: `cargo run` (binds to 127.0.0.1:8080 by default).

Migrations added for feature work:

- `backend/migrations/0002_create_fts5.sql` — FTS5 virtual table for posts and triggers
- `backend/migrations/0003_create_follow.sql` — `follows` join table

Testing and development notes:

- Integration tests spin up an ephemeral SQLite file and run migrations in test setup.
- To run all backend tests: `cd backend && cargo test`.

Benchmarking

- A small helper script is provided at `backend/scripts/bench.sh`.
- The script prefers `hey` (https://github.com/rakyll/hey) and falls back to `wrk` if installed.
- Example: `./backend/scripts/bench.sh -p "/api/posts" -c 100 -n 2000`

API highlights (newly added):

- `GET /api/search?q={query}&page={n}&per_page={n}` — search posts using SQLite FTS5.
- `GET /api/profiles/{username}` — returns profile with `follower_count` and `following_count`.
- `POST /api/profiles/{username}/follow` — body `{ "follow": true|false }` and `Authorization: Bearer <jwt>` header required.

See `/specs/001-build-fancy-blog/README.md` and `specs/001-build-fancy-blog/tasks.md` for details and status.
