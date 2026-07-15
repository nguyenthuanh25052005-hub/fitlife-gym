const db = require('./db');

db.serialize(() => {
  db.run('PRAGMA foreign_keys = ON');

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'trainer', 'member')),
      phone TEXT,
      avatar_url TEXT,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'locked')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      member_code TEXT NOT NULL UNIQUE,
      gender TEXT,
      date_of_birth TEXT,
      address TEXT,
      emergency_contact TEXT,
      health_note TEXT,
      join_date TEXT DEFAULT CURRENT_DATE,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'expired')),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS trainers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      trainer_code TEXT NOT NULL UNIQUE,
      specialty TEXT,
      experience_years INTEGER DEFAULT 0,
      bio TEXT,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      plan_type TEXT NOT NULL CHECK(plan_type IN ('basic', 'pt', 'class', 'premium')),
      duration_days INTEGER NOT NULL,
      session_limit INTEGER,
      price REAL NOT NULL,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS memberships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER NOT NULL,
      plan_id INTEGER NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      remaining_sessions INTEGER,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'expired', 'frozen', 'cancelled')),
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(member_id) REFERENCES members(id) ON DELETE CASCADE,
      FOREIGN KEY(plan_id) REFERENCES plans(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS membership_actions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      membership_id INTEGER NOT NULL,
      action_type TEXT NOT NULL CHECK(action_type IN ('create', 'renew', 'freeze', 'unfreeze', 'cancel')),
      old_end_date TEXT,
      new_end_date TEXT,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(membership_id) REFERENCES memberships(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER NOT NULL,
      membership_id INTEGER,
      amount REAL NOT NULL,
      paid_amount REAL DEFAULT 0,
      debt_amount REAL DEFAULT 0,
      method TEXT DEFAULT 'cash' CHECK(method IN ('cash', 'bank_transfer', 'card', 'qr')),
      status TEXT DEFAULT 'paid' CHECK(status IN ('paid', 'partial', 'unpaid')),
      payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      note TEXT,
      FOREIGN KEY(member_id) REFERENCES members(id) ON DELETE CASCADE,
      FOREIGN KEY(membership_id) REFERENCES memberships(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      class_type TEXT NOT NULL,
      trainer_id INTEGER,
      room TEXT,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      capacity INTEGER DEFAULT 20,
      status TEXT DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'completed', 'cancelled')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(trainer_id) REFERENCES trainers(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER NOT NULL,
      class_id INTEGER NOT NULL,
      status TEXT DEFAULT 'booked' CHECK(status IN ('booked', 'completed', 'cancelled', 'no_show')),
      booking_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      note TEXT,
      FOREIGN KEY(member_id) REFERENCES members(id) ON DELETE CASCADE,
      FOREIGN KEY(class_id) REFERENCES classes(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS checkins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER NOT NULL,
      membership_id INTEGER,
      checkin_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      method TEXT DEFAULT 'manual' CHECK(method IN ('manual', 'qr', 'card')),
      status TEXT DEFAULT 'valid' CHECK(status IN ('valid', 'invalid')),
      note TEXT,
      FOREIGN KEY(member_id) REFERENCES members(id) ON DELETE CASCADE,
      FOREIGN KEY(membership_id) REFERENCES memberships(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS body_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER NOT NULL,
      height REAL,
      weight REAL,
      body_fat REAL,
      muscle_mass REAL,
      bmi REAL,
      recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(member_id) REFERENCES members(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS trainer_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER NOT NULL,
      trainer_id INTEGER NOT NULL,
      note TEXT NOT NULL,
      goal TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(member_id) REFERENCES members(id) ON DELETE CASCADE,
      FOREIGN KEY(trainer_id) REFERENCES trainers(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS consultation_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      interested_product TEXT NOT NULL,
      status TEXT DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'CONTACTED', 'CLOSED')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('order', 'payment', 'member', 'system', 'booking')),
      title TEXT NOT NULL,
      message TEXT,
      related_id INTEGER,
      user_id INTEGER,
      audience TEXT DEFAULT 'admin',
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

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

  console.log('FitLife Gym database schema created successfully');
});

db.close();