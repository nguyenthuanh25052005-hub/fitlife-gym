const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.SQLITE_PATH || path.join(__dirname, '../../fitlife.db');

const db = new sqlite3.Database(dbPath, (error) => {
  if (error) {
    console.error('Database connection failed:', error.message);
  } else if (process.env.NODE_ENV !== 'test') {
    console.log('Connected to FitLife SQLite database');
  }
});

// Lightweight migrations for existing Level 1 databases.
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS payment_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payment_id INTEGER NOT NULL UNIQUE,
    member_id INTEGER NOT NULL,
    membership_id INTEGER,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','cancelled')),
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    reviewed_at DATETIME,
    reviewed_by INTEGER,
    note TEXT,
    proof_image TEXT,
    proof_filename TEXT,
    FOREIGN KEY(payment_id) REFERENCES payments(id),
    FOREIGN KEY(member_id) REFERENCES members(id),
    FOREIGN KEY(membership_id) REFERENCES memberships(id)
  )`);

  // SQLite does not support ADD COLUMN IF NOT EXISTS. Queue the lightweight
  // migrations and ignore duplicate/no-table errors; init.js creates the full
  // current schema for a new database. Avoid nested callbacks so close() cannot
  // race with statements enqueued from a PRAGMA callback.
  db.run('ALTER TABLE payment_requests ADD COLUMN proof_image TEXT', () => {});
  db.run('ALTER TABLE payment_requests ADD COLUMN proof_filename TEXT', () => {});
  db.run('ALTER TABLE notifications ADD COLUMN user_id INTEGER', () => {});
  db.run("ALTER TABLE notifications ADD COLUMN audience TEXT DEFAULT 'admin'", () => {});
});

module.exports = db;
