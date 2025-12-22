# Feature: Build a Fancy Blog System

This feature implements a Rust backend (`ntex`) with SQLite persistence and a migrated frontend in `/client`.

Highlights

- Backend: `backend/` (Rust, `ntex`, `sqlx` for SQLite)
- Frontend: `client/` (React + Vite)
- Key features implemented:
  - Create/publish posts (US1)
  - Comments & reactions (US2)
  - Search (FTS5) and tag browsing (US3)
  - User profiles and follow/unfollow (US4)

Migrations

- `backend/migrations/0001_create_schema.sql` — initial schema
- `backend/migrations/0002_create_fts5.sql` — FTS5 virtual table and triggers for posts
- `backend/migrations/0003_create_follow.sql` — `follows` join table

Quickstart (backend)

1. Copy environment example: `cp backend/.env.example backend/.env` and set `DATABASE_URL` (or leave to default for tests).
2. Run migrations: `cd backend && sqlx migrate run`
3. Start server: `cd backend && cargo run`
4. Run tests: `cd backend && cargo test`

API Notes

- Search: `GET /api/search?q={query}&page={n}&per_page={n}` returns paginated results from the FTS5 index.
- Profile: `GET /api/profiles/{username}` returns profile with `follower_count` and `following_count`.
- Follow/unfollow: `POST /api/profiles/{username}/follow` with JSON `{ "follow": true|false }` and `Authorization: Bearer <jwt>` header to follow/unfollow a user.

See `specs/001-build-fancy-blog/tasks.md` for task status and checklist.
