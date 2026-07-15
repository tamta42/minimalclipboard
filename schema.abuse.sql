-- Non-destructive migration: fair-use / abuse counters
CREATE TABLE IF NOT EXISTS ip_counters (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);
