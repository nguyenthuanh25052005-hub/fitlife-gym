const bcrypt = require('bcryptjs');
const db = require('./db');

const seedDatabase = async () => {
  const adminPassword = await bcrypt.hash('admin123', 10);
  const trainerPassword = await bcrypt.hash('trainer123', 10);
  const memberPassword = await bcrypt.hash('member123', 10);

  db.serialize(() => {
    db.run('PRAGMA foreign_keys = ON');

    db.run('DELETE FROM payment_requests');
    db.run('DELETE FROM notifications');
    db.run('DELETE FROM consultation_requests');
    db.run('DELETE FROM trainer_notes');
    db.run('DELETE FROM body_metrics');
    db.run('DELETE FROM checkins');
    db.run('DELETE FROM bookings');
    db.run('DELETE FROM classes');
    db.run('DELETE FROM payments');
    db.run('DELETE FROM membership_actions');
    db.run('DELETE FROM memberships');
    db.run('DELETE FROM plans');
    db.run('DELETE FROM trainers');
    db.run('DELETE FROM members');
    db.run('DELETE FROM users');

    db.run(`
      INSERT INTO users (id, full_name, email, password, role, phone)
      VALUES
      (1, 'FitLife Admin', 'admin@fitlife.vn', ?, 'admin', '0900000001'),
      (2, 'Nguyễn Minh Khang', 'khang.trainer@fitlife.vn', ?, 'trainer', '0900000002'),
      (3, 'Trần Hoàng Nam', 'nam.trainer@fitlife.vn', ?, 'trainer', '0900000003'),
      (4, 'Lê Thu Hà', 'ha.member@fitlife.vn', ?, 'member', '0900000004'),
      (5, 'Phạm Quang Huy', 'huy.member@fitlife.vn', ?, 'member', '0900000005'),
      (6, 'Đỗ Ngọc Linh', 'linh.member@fitlife.vn', ?, 'member', '0900000006'),
      (7, 'Vũ Anh Tuấn', 'tuan.member@fitlife.vn', ?, 'member', '0900000007'),
      (8, 'Nguyễn Mai Chi', 'chi.member@fitlife.vn', ?, 'member', '0900000008')
    `, [
      adminPassword,
      trainerPassword,
      trainerPassword,
      memberPassword,
      memberPassword,
      memberPassword,
      memberPassword,
      memberPassword
    ]);

    db.run(`
      INSERT INTO trainers (id, user_id, trainer_code, specialty, experience_years, bio)
      VALUES
      (1, 2, 'PT001', 'Strength Training', 5, 'Huấn luyện tăng cơ, giảm mỡ và phục hồi thể lực'),
      (2, 3, 'PT002', 'Yoga & Cardio', 4, 'Huấn luyện yoga, cardio và cải thiện sức bền')
    `);

    db.run(`
      INSERT INTO members (id, user_id, member_code, gender, date_of_birth, address, emergency_contact, health_note)
      VALUES
      (1, 4, 'MB001', 'female', '2001-05-12', 'Hà Nội', '0911111111', 'Không có bệnh nền'),
      (2, 5, 'MB002', 'male', '1999-09-20', 'Hà Nội', '0922222222', 'Cần giảm cân'),
      (3, 6, 'MB003', 'female', '2002-01-15', 'Hà Nội', '0933333333', 'Mục tiêu tăng sức bền'),
      (4, 7, 'MB004', 'male', '1998-11-02', 'Hà Nội', '0944444444', 'Tập phục hồi sau chấn thương nhẹ'),
      (5, 8, 'MB005', 'female', '2000-07-30', 'Hà Nội', '0955555555', 'Muốn tập yoga')
    `);

    db.run(`
      INSERT INTO plans (id, name, description, plan_type, duration_days, session_limit, price)
      VALUES
      (1, 'Basic 1 tháng', 'Gói tập phòng gym cơ bản trong 30 ngày', 'basic', 30, NULL, 500000),
      (2, 'Premium 3 tháng', 'Gói tập không giới hạn trong 90 ngày', 'premium', 90, NULL, 1200000),
      (3, 'PT 10 buổi', 'Gói huấn luyện cá nhân 10 buổi', 'pt', 60, 10, 2500000),
      (4, 'Yoga Class 1 tháng', 'Gói tham gia lớp yoga trong 30 ngày', 'class', 30, 12, 800000)
    `);

    db.run(`
      INSERT INTO memberships (id, member_id, plan_id, start_date, end_date, remaining_sessions, status, note)
      VALUES
      (1, 1, 2, '2026-07-01', '2026-09-29', NULL, 'active', 'Gói premium đang hoạt động'),
      (2, 2, 3, '2026-07-01', '2026-08-30', 8, 'active', 'Gói PT cá nhân'),
      (3, 3, 1, '2026-06-15', '2026-07-15', NULL, 'active', 'Sắp hết hạn'),
      (4, 4, 1, '2026-05-01', '2026-05-31', NULL, 'expired', 'Đã hết hạn'),
      (5, 5, 4, '2026-07-01', '2026-07-31', 10, 'active', 'Lớp yoga')
    `);

    db.run(`
      INSERT INTO membership_actions (membership_id, action_type, new_end_date, note)
      VALUES
      (1, 'create', '2026-09-29', 'Tạo gói premium'),
      (2, 'create', '2026-08-30', 'Tạo gói PT'),
      (3, 'create', '2026-07-15', 'Tạo gói basic')
    `);

    db.run(`
      INSERT INTO payments (member_id, membership_id, amount, paid_amount, debt_amount, method, status, note)
      VALUES
      (1, 1, 1200000, 1200000, 0, 'bank_transfer', 'paid', 'Thanh toán gói premium'),
      (2, 2, 2500000, 1500000, 1000000, 'cash', 'partial', 'Còn nợ 1.000.000'),
      (3, 3, 500000, 500000, 0, 'qr', 'paid', 'Thanh toán gói basic'),
      (5, 5, 800000, 800000, 0, 'card', 'paid', 'Thanh toán lớp yoga')
    `);

    db.run(`
      INSERT INTO classes (id, name, class_type, trainer_id, room, start_time, end_time, capacity)
      VALUES
      (1, 'Yoga buổi sáng', 'Yoga', 2, 'Studio A', '2026-07-08 07:00', '2026-07-08 08:00', 15),
      (2, 'Cardio giảm mỡ', 'Cardio', 2, 'Studio B', '2026-07-08 18:00', '2026-07-08 19:00', 20),
      (3, 'PT Strength Training', 'PT', 1, 'PT Room 1', '2026-07-08 19:00', '2026-07-08 20:00', 1)
    `);

    db.run(`
      INSERT INTO bookings (member_id, class_id, status, note)
      VALUES
      (1, 1, 'booked', 'Đặt lớp yoga'),
      (2, 3, 'booked', 'Buổi PT cá nhân'),
      (5, 1, 'booked', 'Tham gia yoga')
    `);

    db.run(`
      INSERT INTO checkins (member_id, membership_id, method, status, note)
      VALUES
      (1, 1, 'qr', 'valid', 'Check-in bằng QR'),
      (2, 2, 'manual', 'valid', 'Check-in tại quầy'),
      (3, 3, 'card', 'valid', 'Check-in bằng thẻ')
    `);

    db.run(`
      INSERT INTO body_metrics (member_id, height, weight, body_fat, muscle_mass, bmi)
      VALUES
      (1, 160, 52, 22, 36, 20.3),
      (2, 172, 78, 28, 42, 26.4),
      (3, 158, 50, 21, 34, 20.0)
    `);

    db.run(`
      INSERT INTO trainer_notes (member_id, trainer_id, note, goal)
      VALUES
      (2, 1, 'Tập trung bài compound, giảm mỡ trong 8 tuần', 'Giảm 5kg'),
      (3, 2, 'Tăng sức bền bằng cardio nhẹ và yoga', 'Cải thiện thể lực')
    `);

    console.log('FitLife seed data inserted successfully');
  });

  db.close();
};

seedDatabase();