# Blozhik Rust scaffold

This folder contains an initial Rust scaffold for the Blozhik backend.

Quick start:

1. Install Rust toolchain (rustup, cargo).
2. From repository root run:

```bash
cd server-rust
cargo run
```

This runs a minimal Actix-web server that exposes the original backend base path `/api/trpc` (returns 501 Not Implemented for now) and an SSE stub at `/api/notifications/stream`.

Next steps to fully replace the Node server:
- Implement tRPC-compatible request handling or implement endpoints that match the frontend calls.
- Port `server/db.ts` logic to Rust (use `sqlx` or `rusqlite` with the provided SQLite schema).
- Port middleware and auth in `server/_core/*` to Rust.
- Gradually replace routers with fully implemented handlers, keeping API contracts identical.
# server-rust — Local run instructions

This document explains how to run the Rust backend locally for manual testing.

Quick start

1. Create a DB file (optional):

   touch server-rust/dev.db

2. Run the server using the repo helper script (recommended):

   # from repo root:
   bash ./scripts/run_server.sh

   The script sets sensible defaults:
   - BACKEND_DATABASE (default: server-rust/dev.db)
   - BACKEND_PORT (default: 4000)

   The server binary is feature-gated; the script uses `cargo run --features run` which enables the server binary.

3. Open http://127.0.0.1:4000 and test using curl or Postman using the REST endpoints (e.g. /auth/register, /auth/login, /post/create).

Notes
- The server automatically applies SQL migrations from `server-rust/migrations` on startup.
- To change DB or port, set environment variables before running the script:
  - BACKEND_DATABASE=server-rust/my.db BACKEND_PORT=8080 bash ./scripts/run_server.sh

If you want, I can add a small `seed_admin.sh` script that creates an admin user automatically for quick testing.
