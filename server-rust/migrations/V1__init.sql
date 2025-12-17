-- Placeholder migration: create users table

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    hashed_password TEXT,
    created_at TEXT,
    updated_at TEXT
);
