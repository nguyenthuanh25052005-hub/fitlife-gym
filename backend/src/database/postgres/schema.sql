CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'trainer', 'member')),
  phone TEXT,
  avatar_url TEXT,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'locked')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS members (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  member_code TEXT NOT NULL UNIQUE,
  gender TEXT,
  date_of_birth DATE,
  address TEXT,
  emergency_contact TEXT,
  health_note TEXT,
  join_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'expired'))
);

CREATE TABLE IF NOT EXISTS trainers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  trainer_code TEXT NOT NULL UNIQUE,
  specialty TEXT,
  experience_years INTEGER DEFAULT 0,
  bio TEXT,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive'))
);

CREATE TABLE IF NOT EXISTS plans (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  plan_type TEXT NOT NULL CHECK(plan_type IN ('basic', 'pt', 'class', 'premium')),
  duration_days INTEGER NOT NULL,
  session_limit INTEGER,
  price NUMERIC(14,2) NOT NULL,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS memberships (
  id SERIAL PRIMARY KEY,
  member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  plan_id INTEGER NOT NULL REFERENCES plans(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  remaining_sessions INTEGER,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'expired', 'frozen', 'cancelled')),
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS membership_actions (
  id SERIAL PRIMARY KEY,
  membership_id INTEGER NOT NULL REFERENCES memberships(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK(action_type IN ('create', 'renew', 'freeze', 'unfreeze', 'cancel')),
  old_end_date DATE,
  new_end_date DATE,
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  membership_id INTEGER REFERENCES memberships(id),
  amount NUMERIC(14,2) NOT NULL,
  paid_amount NUMERIC(14,2) DEFAULT 0,
  debt_amount NUMERIC(14,2) DEFAULT 0,
  method TEXT DEFAULT 'cash' CHECK(method IN ('cash', 'bank_transfer', 'card', 'qr')),
  status TEXT DEFAULT 'paid' CHECK(status IN ('paid', 'partial', 'unpaid')),
  payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  note TEXT
);

CREATE TABLE IF NOT EXISTS classes (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  class_type TEXT NOT NULL,
  trainer_id INTEGER REFERENCES trainers(id),
  room TEXT,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  capacity INTEGER DEFAULT 20,
  status TEXT DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'completed', 'cancelled')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'booked' CHECK(status IN ('booked', 'completed', 'cancelled', 'no_show')),
  booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  note TEXT
);

CREATE TABLE IF NOT EXISTS checkins (
  id SERIAL PRIMARY KEY,
  member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  membership_id INTEGER REFERENCES memberships(id),
  checkin_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  method TEXT DEFAULT 'manual' CHECK(method IN ('manual', 'qr', 'card')),
  status TEXT DEFAULT 'valid' CHECK(status IN ('valid', 'invalid')),
  note TEXT
);

CREATE TABLE IF NOT EXISTS body_metrics (
  id SERIAL PRIMARY KEY,
  member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  height NUMERIC(8,2),
  weight NUMERIC(8,2),
  body_fat NUMERIC(8,2),
  muscle_mass NUMERIC(8,2),
  bmi NUMERIC(8,2),
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trainer_notes (
  id SERIAL PRIMARY KEY,
  member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  trainer_id INTEGER NOT NULL REFERENCES trainers(id),
  note TEXT NOT NULL,
  goal TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS consultation_requests (
  id SERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  interested_product TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'CONTACTED', 'CLOSED')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('order', 'payment', 'member', 'system', 'booking')),
  title TEXT NOT NULL,
  message TEXT,
  related_id INTEGER,
  user_id INTEGER,
  audience TEXT DEFAULT 'admin',
  is_read INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payment_requests (
  id SERIAL PRIMARY KEY,
  payment_id INTEGER NOT NULL UNIQUE REFERENCES payments(id),
  member_id INTEGER NOT NULL REFERENCES members(id),
  membership_id INTEGER REFERENCES memberships(id),
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','cancelled')),
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP,
  reviewed_by INTEGER,
  note TEXT,
  proof_image TEXT,
  proof_filename TEXT
);

CREATE INDEX IF NOT EXISTS idx_members_user_id ON members(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_member_status ON memberships(member_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_member_status ON payments(member_id, status);
CREATE INDEX IF NOT EXISTS idx_classes_start_time ON classes(start_time);
CREATE INDEX IF NOT EXISTS idx_bookings_member_status ON bookings(member_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_audience_read ON notifications(audience, is_read);
