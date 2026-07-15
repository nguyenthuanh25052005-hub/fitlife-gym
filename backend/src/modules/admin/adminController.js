const db = require('../../database/db');

// Notifications
const getNotifications = (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (Math.max(Number(page) || 1, 1) - 1) * Math.min(Math.max(Number(limit) || 20, 1), 100);

  db.all(
    `SELECT * FROM notifications WHERE audience='admin' OR audience IS NULL ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [Math.min(Math.max(Number(limit) || 20, 1), 100), offset],
    (err, notifications) => {
      if (err) {return res.status(500).json({ success: false, message: 'Lỗi truy vấn thông báo' });}
      db.get("SELECT COUNT(*) as total FROM notifications WHERE audience='admin' OR audience IS NULL", [], (err2, countResult) => {
        if (err2) {return res.status(500).json({ success: false, message: 'Lỗi đếm thông báo' });}
        const unreadCount = notifications.filter(n => n.is_read === 0 || n.is_read === null).length;
        return res.status(200).json({
          success: true,
          data: {
            notifications,
            pagination: { page: Number(page), limit: Number(limit), total: countResult.total },
            unread_count: unreadCount
          }
        });
      });
    }
  );
};

const markNotificationRead = (req, res) => {
  db.run('UPDATE notifications SET is_read = 1 WHERE id = ?', [req.params.id], function(err) {
    if (err) {return res.status(500).json({ success: false, message: 'Lỗi cập nhật thông báo' });}
    return res.status(200).json({ success: true, message: 'Đã đánh dấu đã đọc' });
  });
};

// Create notification helper
const createNotification = (type, title, message, related_id = null) => {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO notifications (type, title, message, related_id) VALUES (?, ?, ?, ?)',
      [type, title, message, related_id],
      function(err) {
        if (err) {reject(err);}
        else {resolve(this.lastID);}
      }
    );
  });
};

// Member Management
const getMemberManagement = (req, res) => {
  const { search = '', status = '', page = 1, limit = 10 } = req.query;
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
  const offset = (safePage - 1) * safeLimit;
  const conditions = ['u.role = ?'];
  const params = ['member'];

  if (search.trim()) {
    conditions.push('(u.full_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ? OR m.member_code LIKE ?)');
    const kw = `%${search.trim()}%`;
    params.push(kw, kw, kw, kw);
  }
  if (status) {
    conditions.push('u.status = ?');
    params.push(status);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  db.get(`SELECT COUNT(*) as total FROM users u JOIN members m ON m.user_id = u.id ${whereClause}`, params, (errCount, countResult) => {
    if (errCount) {return res.status(500).json({ success: false, message: 'Lỗi đếm' });}
    
    db.all(
      `SELECT u.id, u.full_name, u.email, u.phone, u.status, u.created_at,
              m.id as member_id, m.member_code, m.gender, m.date_of_birth, m.join_date,
              (SELECT p.name FROM memberships ms JOIN plans p ON ms.plan_id = p.id WHERE ms.member_id = m.id AND ms.status = 'active' ORDER BY ms.id DESC LIMIT 1) as current_plan,
              (SELECT COUNT(*) FROM bookings b JOIN classes c ON b.class_id = c.id WHERE b.member_id = m.id AND b.status = 'booked' AND c.start_time >= datetime('now')) as upcoming_classes
       FROM users u
       JOIN members m ON m.user_id = u.id
       ${whereClause}
       ORDER BY u.id DESC
       LIMIT ? OFFSET ?`,
      [...params, safeLimit, offset],
      (err, members) => {
        if (err) {return res.status(500).json({ success: false, message: 'Lỗi truy vấn' });}
        return res.status(200).json({
          success: true,
          data: {
            members,
            pagination: { page: safePage, limit: safeLimit, total: countResult.total, total_pages: Math.ceil(countResult.total / safeLimit) }
          }
        });
      }
    );
  });
};

const lockMember = (req, res) => {
  const { id } = req.params;
  db.get('SELECT user_id FROM members WHERE id = ?', [id], (err, member) => {
    if (err || !member) {return res.status(404).json({ success: false, message: 'Không tìm thấy hội viên' });}
    db.run("UPDATE users SET status = 'locked' WHERE id = ?", [member.user_id], function(err2) {
      if (err2) {return res.status(500).json({ success: false, message: 'Không thể khóa tài khoản' });}
      return res.status(200).json({ success: true, message: 'Đã khóa tài khoản hội viên' });
    });
  });
};

const unlockMember = (req, res) => {
  const { id } = req.params;
  db.get('SELECT user_id FROM members WHERE id = ?', [id], (err, member) => {
    if (err || !member) {return res.status(404).json({ success: false, message: 'Không tìm thấy hội viên' });}
    db.run("UPDATE users SET status = 'active' WHERE id = ?", [member.user_id], function(err2) {
      if (err2) {return res.status(500).json({ success: false, message: 'Không thể mở khóa tài khoản' });}
      return res.status(200).json({ success: true, message: 'Đã mở khóa tài khoản hội viên' });
    });
  });
};

const deleteMemberAccount = (req, res) => {
  const { id } = req.params;
  db.get('SELECT user_id FROM members WHERE id = ?', [id], (err, member) => {
    if (err || !member) {return res.status(404).json({ success: false, message: 'Không tìm thấy hội viên' });}
    db.run("UPDATE users SET status = 'inactive' WHERE id = ?", [member.user_id], function(err2) {
      if (err2) {return res.status(500).json({ success: false, message: 'Không thể vô hiệu hóa tài khoản' });}
      return res.status(200).json({ success: true, message: 'Đã vô hiệu hóa tài khoản hội viên' });
    });
  });
};

module.exports = {
  getNotifications,
  markNotificationRead,
  createNotification,
  getMemberManagement,
  lockMember,
  unlockMember,
  deleteMemberAccount
};