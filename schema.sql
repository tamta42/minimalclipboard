-- zanile.com auth + paste ownership
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS otp_codes (
  email TEXT PRIMARY KEY,
  code_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS pastes (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  preview TEXT,
  created_at TEXT NOT NULL,
  expires_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_pastes_user_id ON pastes(user_id);
CREATE INDEX IF NOT EXISTS idx_pastes_expires_at ON pastes(expires_at);
