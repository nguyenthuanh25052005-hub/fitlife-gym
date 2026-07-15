const db = require('../../database/db');

const getAllPayments = (req, res) => {
  const { page = 1, limit = 10, status = '' } = req.query;
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
  const offset = (safePage - 1) * safeLimit;
  const conditions = [];
  const params = [];

  if (status) {
    conditions.push('p.status = ?');
    params.push(status);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  db.get(`SELECT COUNT(*) as total FROM payments p ${whereClause}`, params, (errCount, countResult) => {
    if (errCount) {return res.status(500).json({ success: false, message: 'Không thể đếm thanh toán' });}

    db.all(
      `SELECT p.*, m.member_code, u.full_name as member_name, u.email, u.phone,
              pl.name as plan_name, ms.id as membership_id,
              pr.status as request_status, pr.note as request_note,
              pr.proof_image, pr.proof_filename, pr.submitted_at,
              pr.reviewed_at, pr.reviewed_by
       FROM payments p
       JOIN members m ON p.member_id = m.id
       JOIN users u ON m.user_id = u.id
       LEFT JOIN memberships ms ON p.membership_id = ms.id
       LEFT JOIN plans pl ON ms.plan_id = pl.id
       LEFT JOIN payment_requests pr ON pr.payment_id = p.id
       ${whereClause}
       ORDER BY p.payment_date DESC
       LIMIT ? OFFSET ?`,
      [...params, safeLimit, offset],
      (err, payments) => {
        if (err) {return res.status(500).json({ success: false, message: 'Không thể tải thanh toán' });}
        return res.status(200).json({
          success: true,
          data: {
            payments,
            pagination: { page: safePage, limit: safeLimit, total: countResult.total, total_pages: Math.ceil(countResult.total / safeLimit) }
          }
        });
      }
    );
  });
};

const getDebts = (req, res) => {
  db.all(
    `SELECT p.*, m.member_code, u.full_name, u.phone, pl.name as plan_name
     FROM payments p
     JOIN members m ON p.member_id = m.id
     JOIN users u ON m.user_id = u.id
     LEFT JOIN memberships ms ON p.membership_id = ms.id
     LEFT JOIN plans pl ON ms.plan_id = pl.id
     WHERE p.debt_amount > 0
     ORDER BY p.payment_date DESC`,
    [],
    (err, debts) => {
      if (err) {return res.status(500).json({ success: false, message: 'Không thể tải công nợ' });}
      return res.status(200).json({ success: true, data: { debts } });
    }
  );
};

const createPayment = (req, res) => {
  const { member_id, membership_id, amount, paid_amount, method = 'cash', note } = req.body;
  if (!member_id || !amount) {
    return res.status(400).json({ success: false, message: 'Thiếu thông tin thanh toán' });
  }

  const debtAmount = Math.max(Number(amount) - Number(paid_amount || amount), 0);
  const paymentStatus = debtAmount === 0 ? 'paid' : 'partial';

  db.run(
    'INSERT INTO payments (member_id, membership_id, amount, paid_amount, debt_amount, method, status, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [member_id, membership_id || null, amount, paid_amount || amount, debtAmount, method, paymentStatus, note || 'Thanh toán'],
    function(err) {
      if (err) {return res.status(500).json({ success: false, message: 'Không thể tạo thanh toán' });}
      const paymentId = this.lastID;
      db.get('SELECT * FROM payments WHERE id = ?', [paymentId], (fetchErr, payment) => {
        if (fetchErr || !payment) {
          return res.status(500).json({ success: false, message: 'Không thể tải thanh toán vừa tạo' });
        }
        return res.status(201).json({
          success: true,
          message: 'Tạo thanh toán thành công',
          data: { payment }
        });
      });
    }
  );
};

const payDebt = (req, res) => {
  const { id } = req.params;
  const { paid_amount, method = 'cash', note } = req.body;

  if (!Number.isFinite(Number(paid_amount)) || Number(paid_amount) <= 0) {
    return res.status(400).json({ success: false, message: 'Số tiền thanh toán phải lớn hơn 0' });
  }

  db.get('SELECT * FROM payments WHERE id = ?', [id], (err, payment) => {
    if (err || !payment) {return res.status(404).json({ success: false, message: 'Không tìm thấy thanh toán' });}

    const newPaid = Number(payment.paid_amount) + Number(paid_amount);
    const newDebt = Math.max(Number(payment.debt_amount) - Number(paid_amount), 0);
    const newStatus = newDebt === 0 ? 'paid' : 'partial';

    db.run(
      'UPDATE payments SET paid_amount = ?, debt_amount = ?, status = ?, method = ?, note = ? WHERE id = ?',
      [newPaid, newDebt, newStatus, method, note || payment.note, id],
      function(err2) {
        if (err2) {return res.status(500).json({ success: false, message: 'Không thể cập nhật thanh toán' });}
        db.get('SELECT * FROM payments WHERE id = ?', [id], (fetchErr, updatedPayment) => {
          if (fetchErr || !updatedPayment) {
            return res.status(500).json({ success: false, message: 'Không thể tải thanh toán đã cập nhật' });
          }
          return res.status(200).json({
            success: true,
            message: 'Cập nhật thanh toán thành công',
            data: { payment: updatedPayment }
          });
        });
      }
    );
  });
};

// Admin confirms payment
const confirmPayment = (req, res) => {
  const { id } = req.params;

  db.get(
    `SELECT p.*, m.id as mem_id, m.user_id, u.full_name as member_name, pl.name as plan_name
     FROM payments p
     JOIN members m ON p.member_id = m.id
     JOIN users u ON m.user_id = u.id
     LEFT JOIN memberships ms ON p.membership_id = ms.id
     LEFT JOIN plans pl ON ms.plan_id = pl.id
     WHERE p.id = ?`,
    [id],
    (err, payment) => {
      if (err || !payment) {return res.status(404).json({ success: false, message: 'Không tìm thấy thanh toán' });}

      db.get('SELECT status, proof_image FROM payment_requests WHERE payment_id = ?', [id], (requestErr, request) => {
        if (requestErr || !request || request.status !== 'pending' || !request.proof_image) {
          return res.status(400).json({ success: false, message: 'Chưa có ảnh hóa đơn hợp lệ đang chờ duyệt' });
        }

      db.run(
        "UPDATE payments SET paid_amount = amount, debt_amount = 0, status = 'paid' WHERE id = ?",
        [id],
        function(err2) {
          if (err2) {return res.status(500).json({ success: false, message: 'Không thể xác nhận thanh toán' });}

          db.run("UPDATE memberships SET status='active' WHERE id=?", [payment.membership_id]);
          db.run("UPDATE payment_requests SET status='approved', reviewed_at=CURRENT_TIMESTAMP, reviewed_by=? WHERE payment_id=?", [req.user.id, id]);
          db.run(`INSERT INTO notifications (type,title,message,related_id,user_id,audience) VALUES ('payment',?,?,?,?, 'member')`,
            ['Thanh toán thành công', `Thanh toán gói tập ${payment.plan_name || ''} đã được quản trị viên xác nhận.`, payment.membership_id, payment.user_id]);

          return res.status(200).json({
            success: true,
            message: 'Xác nhận thanh toán thành công',
            data: { member_name: payment.member_name, plan_name: payment.plan_name }
          });
        }
      );
      });
    }
  );
};

// Get user notifications
const rejectPayment = (req, res) => {
  const { id } = req.params;
  const note = req.body.note || 'Thông tin chuyển khoản chưa hợp lệ';
  db.get(`SELECT p.*, m.user_id, pl.name AS plan_name FROM payments p JOIN members m ON m.id=p.member_id
    LEFT JOIN memberships ms ON ms.id=p.membership_id LEFT JOIN plans pl ON pl.id=ms.plan_id WHERE p.id=?`, [id], (err,payment)=>{
    if(err || !payment) {return res.status(404).json({success:false,message:'Không tìm thấy thanh toán'});}
    db.run(`UPDATE payment_requests SET status='rejected', reviewed_at=CURRENT_TIMESTAMP, reviewed_by=?, note=? WHERE payment_id=?`, [req.user.id,note,id]);
    db.run(`INSERT INTO notifications (type,title,message,related_id,user_id,audience) VALUES ('payment',?,?,?,?, 'member')`,
      ['Thanh toán chưa được xác nhận', `${payment.plan_name || 'Gói tập'}: ${note}`, payment.membership_id, payment.user_id]);
    return res.status(200).json({success:true,message:'Đã từ chối yêu cầu thanh toán'});
  });
};

const getUserNotifications = (req, res) => {
  db.all(`SELECT * FROM notifications WHERE user_id=? OR audience='member' ORDER BY created_at DESC LIMIT 30`, [req.user.id], (err, notifications) => {
    if (err) {return res.status(500).json({ success: false, message: 'Lỗi truy vấn thông báo' });}
    const unread_count = notifications.filter(n => !n.is_read).length;
    return res.status(200).json({ success: true, data: { notifications, unread_count } });
  });
};

module.exports = {
  getAllPayments,
  getDebts,
  createPayment,
  payDebt,
  confirmPayment,
  getUserNotifications,
  rejectPayment
};