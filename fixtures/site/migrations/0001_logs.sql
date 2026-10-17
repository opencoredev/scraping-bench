CREATE TABLE IF NOT EXISTS requests (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 timestamp TEXT NOT NULL, path TEXT NOT NULL, query TEXT NOT NULL,
 user_agent TEXT NOT NULL, ip TEXT NOT NULL, asn INTEGER, colo TEXT,
 content_version TEXT NOT NULL, status INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS requests_timestamp ON requests(timestamp, id);
