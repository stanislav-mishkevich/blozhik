-- Create FTS5 virtual table for posts title and body

CREATE VIRTUAL TABLE IF NOT EXISTS posts_fts USING fts5(
  title, body_markdown, content='posts', content_rowid='id'
);

-- Trigger to keep FTS index up to date on insert
CREATE TRIGGER IF NOT EXISTS posts_ai AFTER INSERT ON posts BEGIN
  INSERT INTO posts_fts(rowid, title, body_markdown) VALUES (new.id, new.title, new.body_markdown);
END;

-- Trigger to keep FTS index up to date on delete
CREATE TRIGGER IF NOT EXISTS posts_ad AFTER DELETE ON posts BEGIN
  INSERT INTO posts_fts(posts_fts, rowid, title, body_markdown) VALUES('delete', old.id, old.title, old.body_markdown);
END;

-- Trigger to keep FTS index up to date on update
CREATE TRIGGER IF NOT EXISTS posts_au AFTER UPDATE ON posts BEGIN
  INSERT INTO posts_fts(posts_fts, rowid, title, body_markdown) VALUES('delete', old.id, old.title, old.body_markdown);
  INSERT INTO posts_fts(rowid, title, body_markdown) VALUES (new.id, new.title, new.body_markdown);
END;

