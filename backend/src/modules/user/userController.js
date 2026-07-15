const bcrypt = require("bcryptjs");
const db = require("../../database/db");

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

const addDays = (dateText, days) => {
  const date = new Date(dateText);
  date.setDate(date.getDate() + Number(days));
  return date.toISOString().slice(0, 10);
};

// Get current user's member ID from user
const getMemberId = (userId) => {
  return new Promise((resolve, reject) => {
    db.get("SELECT id FROM members WHERE user_id = ?", [userId], (err, row) => {
      if (err) {reject(err);}
      else {resolve(row?.id);}
    });
  });
};

// Dashboard
const getUserDashboard = async (req, res) => {
  try {
    const memberId = await getMemberId(req.user.id);
    if (!memberId) {
      return res.status(404).json({ success: false, message: "Không tìm thấy hồ sơ hội viên" });
    }

    // Get active membership
    db.get(
      `SELECT m.*, p.name as plan_name, p.plan_type, p.price, p.duration_days
       FROM memberships m JOIN plans p ON m.plan_id = p.id
       WHERE m.member_id = ? AND m.status = 'active'
       ORDER BY m.id DESC LIMIT 1`,
      [memberId],
      (err, membership) => {
        if (err) {return res.status(500).json({ success: false, message: "Lỗi truy vấn" });}

        // Get upcoming bookings
        db.all(
          `SELECT b.*, c.name as class_name, c.start_time, c.end_time, c.room
           FROM bookings b JOIN classes c ON b.class_id = c.id
           WHERE b.member_id = ? AND b.status = 'booked' AND c.start_time >= datetime('now')
           ORDER BY c.start_time ASC LIMIT 5`,
          [memberId],
          (err2, bookings) => {
            if (err2) {return res.status(500).json({ success: false, message: "Lỗi truy vấn" });}

            // Get latest body metrics
            db.get(
              `SELECT * FROM body_metrics WHERE member_id = ? ORDER BY recorded_at DESC LIMIT 1`,
              [memberId],
              (err3, metrics) => {
                if (err3) {return res.status(500).json({ success: false, message: "Lỗi truy vấn" });}

                // Get checkin count this month
                db.get(
                  `SELECT COUNT(*) as count FROM checkins WHERE member_id = ? AND strftime('%Y-%m', checkin_time) = strftime('%Y-%m', 'now')`,
                  [memberId],
                  (err4, checkinStats) => {
                    if (err4) {return res.status(500).json({ success: false, message: "Lỗi truy vấn" });}

                    // Get assigned coach
                    db.get(
                      `SELECT t.id, t.specialty, u.full_name, u.phone, u.avatar_url
                       FROM trainer_notes tn
                       JOIN trainers t ON tn.trainer_id = t.id
                       JOIN users u ON t.user_id = u.id
                       WHERE tn.member_id = ?
                       ORDER BY tn.created_at DESC LIMIT 1`,
                      [memberId],
                      (err5, coach) => {
                        if (err5) {return res.status(500).json({ success: false, message: "Lỗi truy vấn" });}

                        return res.status(200).json({
                          success: true,
                          data: {
                            membership: membership || null,
                            upcoming_classes: bookings || [],
                            body_metrics: metrics || null,
                            checkin_this_month: checkinStats?.count || 0,
                            coach: coach || null
                          }
                        });
                      }
                    );
                  }
                );
              }
            );
          }
        );
      }
    );
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
};

// Profile
const getMyProfile = async (req, res) => {
  try {
    const memberId = await getMemberId(req.user.id);
    if (!memberId) {
      return res.status(404).json({ success: false, message: "Không tìm thấy hồ sơ hội viên" });
    }

    db.get(
      `SELECT u.id, u.full_name, u.email, u.phone, u.avatar_url, u.created_at,
              m.id as member_id, m.member_code, m.gender, m.date_of_birth, m.address,
              m.emergency_contact, m.health_note, m.join_date
       FROM users u
       JOIN members m ON m.user_id = u.id
       WHERE u.id = ?`,
      [req.user.id],
      (err, profile) => {
        if (err) {return res.status(500).json({ success: false, message: "Lỗi truy vấn" });}
        if (!profile) {return res.status(404).json({ success: false, message: "Không tìm thấy hồ sơ" });}

        return res.status(200).json({ success: true, data: { profile } });
      }
    );
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
};

const updateMyProfile = async (req, res) => {
  try {
    const memberId = await getMemberId(req.user.id);
    if (!memberId) {
      return res.status(404).json({ success: false, message: "Không tìm thấy hồ sơ hội viên" });
    }

    const { full_name, phone, gender, date_of_birth, address, emergency_contact, health_note } = req.body;

    db.run(
      `UPDATE users SET full_name = COALESCE(?, full_name), phone = COALESCE(?, phone) WHERE id = ?`,
      [full_name || null, phone || null, req.user.id],
      (err) => {
        if (err) {return res.status(500).json({ success: false, message: "Không thể cập nhật tài khoản" });}

        db.run(
          `UPDATE members SET gender = COALESCE(?, gender), date_of_birth = COALESCE(?, date_of_birth),
           address = COALESCE(?, address), emergency_contact = COALESCE(?, emergency_contact),
           health_note = COALESCE(?, health_note) WHERE id = ?`,
          [gender || null, date_of_birth || null, address || null, emergency_contact || null, health_note || null, memberId],
          (err2) => {
            if (err2) {return res.status(500).json({ success: false, message: "Không thể cập nhật hồ sơ" });}
            return res.status(200).json({ success: true, message: "Cập nhật hồ sơ thành công" });
          }
        );
      }
    );
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
};

const changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ success: false, message: "Vui lòng nhập đầy đủ mật khẩu" });
    }
    if (new_password.length < 6) {
      return res.status(400).json({ success: false, message: "Mật khẩu mới phải có ít nhất 6 ký tự" });
    }

    db.get("SELECT password FROM users WHERE id = ?", [req.user.id], async (err, user) => {
      if (err) {return res.status(500).json({ success: false, message: "Lỗi truy vấn" });}
      if (!user) {return res.status(404).json({ success: false, message: "Không tìm thấy tài khoản" });}

      const isValid = await bcrypt.compare(current_password, user.password);
      if (!isValid) {
        return res.status(400).json({ success: false, message: "Mật khẩu hiện tại không đúng" });
      }

      const hashedPassword = await bcrypt.hash(new_password, 10);
      db.run("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, req.user.id], (err2) => {
        if (err2) {return res.status(500).json({ success: false, message: "Không thể đổi mật khẩu" });}
        return res.status(200).json({ success: true, message: "Đổi mật khẩu thành công" });
      });
    });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
};

// Body Metrics
const getMyBodyMetrics = async (req, res) => {
  try {
    const memberId = await getMemberId(req.user.id);
    if (!memberId) {return res.status(404).json({ success: false, message: "Không tìm thấy hồ sơ" });}

    db.all(
      "SELECT * FROM body_metrics WHERE member_id = ? ORDER BY recorded_at DESC LIMIT 20",
      [memberId],
      (err, metrics) => {
        if (err) {return res.status(500).json({ success: false, message: "Lỗi truy vấn" });}
        return res.status(200).json({ success: true, data: { metrics } });
      }
    );
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
};

const updateBodyMetrics = async (req, res) => {
  try {
    const memberId = await getMemberId(req.user.id);
    if (!memberId) {return res.status(404).json({ success: false, message: "Không tìm thấy hồ sơ" });}

    const { height, weight, body_fat, muscle_mass } = req.body;
    if (!height || !weight) {
      return res.status(400).json({ success: false, message: "Chiều cao và cân nặng là bắt buộc" });
    }

    const bmi = weight / ((height / 100) * (height / 100));

    db.run(
      `INSERT INTO body_metrics (member_id, height, weight, body_fat, muscle_mass, bmi) VALUES (?, ?, ?, ?, ?, ?)`,
      [memberId, height, weight, body_fat || null, muscle_mass || null, Math.round(bmi * 100) / 100],
      function (err) {
        if (err) {return res.status(500).json({ success: false, message: "Không thể lưu chỉ số" });}
        return res.status(201).json({
          success: true,
          message: "Cập nhật chỉ số thành công",
          data: { bmi: Math.round(bmi * 100) / 100, id: this.lastID }
        });
      }
    );
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
};

const getHealthAdvice = async (req, res) => {
  try {
    const memberId = await getMemberId(req.user.id);
    if (!memberId) {return res.status(404).json({ success: false, message: "Không tìm thấy hồ sơ" });}

    db.get(
      "SELECT * FROM body_metrics WHERE member_id = ? ORDER BY recorded_at DESC LIMIT 1",
      [memberId],
      (err, metrics) => {
        if (err) {return res.status(500).json({ success: false, message: "Lỗi truy vấn" });}
        if (!metrics) {
          return res.status(200).json({
            success: true,
            data: { advice: "Bạn chưa có dữ liệu chiều cao, cân nặng. Hãy cập nhật để nhận lời khuyên sức khỏe!" }
          });
        }

        const bmi = metrics.bmi;
        let category, advice, color;

        if (bmi < 18.5) {
          category = "Thiếu cân";
          advice = "Bạn cần tăng cường dinh dưỡng và tập luyện để đạt cân nặng hợp lý. Hãy bổ sung protein, tinh bột và chất béo lành mạnh. Tập trung vào các bài tập sức mạnh để phát triển cơ bắp.";
          color = "#f59e0b";
        } else if (bmi < 25) {
          category = "Bình thường";
          advice = "Bạn có chỉ số BMI lý tưởng! Hãy duy trì chế độ ăn uống cân bằng và tập luyện đều đặn. Kết hợp cardio và tập tạ để giữ vóc dáng và sức khỏe tốt.";
          color = "#10b981";
        } else if (bmi < 30) {
          category = "Thừa cân";
          advice = "Bạn nên điều chỉnh chế độ ăn uống và tăng cường vận động. Giảm tinh bột, đường, tăng rau xanh và protein. Tập cardio ít nhất 30 phút mỗi ngày, 5 ngày/tuần.";
          color = "#f59e0b";
        } else if (bmi < 35) {
          category = "Béo phì cấp độ 1";
          advice = "Cần có kế hoạch giảm cân nghiêm túc. Tham khảo ý kiến chuyên gia dinh dưỡng và huấn luyện viên. Kết hợp chế độ ăn kiêng khoa học với tập luyện đều đặn.";
          color = "#ef4444";
        } else {
          category = "Béo phì cấp độ 2";
          advice = "Cần sự can thiệp y tế và huấn luyện chuyên nghiệp. Hãy đến gặp bác sĩ để được tư vấn và lập kế hoạch giảm cân an toàn, hiệu quả.";
          color = "#dc2626";
        }

        return res.status(200).json({
          success: true,
          data: {
            bmi: metrics.bmi,
            height: metrics.height,
            weight: metrics.weight,
            category,
            advice,
            color,
            recorded_at: metrics.recorded_at
          }
        });
      }
    );
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
};

// Memberships
const getMyMemberships = async (req, res) => {
  try {
    const memberId = await getMemberId(req.user.id);
    if (!memberId) {return res.status(404).json({ success: false, message: "Không tìm thấy hồ sơ" });}

    db.all(
      `SELECT m.*, p.name as plan_name, p.plan_type, p.price, p.duration_days, p.description as plan_description,
              pay.id AS payment_id, pay.status AS payment_status,
              pr.status AS request_status, pr.note AS payment_request_note,
              pr.submitted_at, pr.reviewed_at
       FROM memberships m
       JOIN plans p ON m.plan_id = p.id
       LEFT JOIN payments pay ON pay.id = (
         SELECT p2.id FROM payments p2 WHERE p2.membership_id = m.id ORDER BY p2.id DESC LIMIT 1
       )
       LEFT JOIN payment_requests pr ON pr.payment_id = pay.id
       WHERE m.member_id = ?
       ORDER BY m.id DESC`,
      [memberId],
      (err, memberships) => {
        if (err) {return res.status(500).json({ success: false, message: "Lỗi truy vấn" });}
        return res.status(200).json({ success: true, data: { memberships } });
      }
    );
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
};

const buyPlan = async (req, res) => {
  try {
    const memberId = await getMemberId(req.user.id);
    if (!memberId) {return res.status(404).json({ success: false, message: "Không tìm thấy hồ sơ" });}

    const { plan_id, method = 'qr' } = req.body;
    if (!plan_id) {
      return res.status(400).json({ success: false, message: "Vui lòng chọn gói tập" });
    }

    db.get("SELECT * FROM plans WHERE id = ? AND status = 'active'", [plan_id], (err, plan) => {
      if (err) {return res.status(500).json({ success: false, message: "Lỗi truy vấn" });}
      if (!plan) {return res.status(404).json({ success: false, message: "Không tìm thấy gói tập" });}

      const startDate = new Date().toISOString().slice(0, 10);
      const endDate = addDays(startDate, plan.duration_days);
      const remainingSessions = plan.session_limit || null;

      db.run(
        `INSERT INTO memberships (member_id, plan_id, start_date, end_date, remaining_sessions, status, note)
         VALUES (?, ?, ?, ?, ?, 'frozen', 'Chờ admin xác nhận thanh toán')`,
        [memberId, plan_id, startDate, endDate, remainingSessions],
        function (err2) {
          if (err2) {return res.status(500).json({ success: false, message: "Không thể đăng ký gói" });}

          const membershipId = this.lastID;

          // Create payment record
          db.run(
            `INSERT INTO payments (member_id, membership_id, amount, paid_amount, debt_amount, method, status, note)
             VALUES (?, ?, ?, 0, ?, ?, 'unpaid', 'Chờ thanh toán gói tập')`,
            [memberId, membershipId, plan.price, plan.price, method],
            (err3) => {
              if (err3) {return res.status(500).json({ success: false, message: "Lỗi tạo thanh toán" });}

              // Create membership action
              db.run(
                `INSERT INTO membership_actions (membership_id, action_type, new_end_date, note)
                 VALUES (?, 'create', ?, 'Đăng ký gói từ user')`,
                [membershipId, endDate]
              );

              // Create notification for admin
              createNotification('order', 'Đơn đăng ký gói tập mới', 
                `Hội viên vừa đăng ký gói ${plan.name} (${plan.price.toLocaleString()}đ) - Chờ thanh toán`, 
                membershipId
              );

              return res.status(201).json({
                success: true,
                message: "Đăng ký gói thành công! Vui lòng thanh toán.",
                data: {
                  membership: {
                    id: membershipId,
                    member_id: memberId,
                    plan_id,
                    plan_name: plan.name,
                    start_date: startDate,
                    end_date: endDate,
                    price: plan.price,
                    status: 'frozen'
                  }
                }
              });
            }
          );
        }
      );
    });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
};

const cancelMyMembership = async (req, res) => {
  try {
    const memberId = await getMemberId(req.user.id);
    if (!memberId) {return res.status(404).json({ success: false, message: "Không tìm thấy hồ sơ" });}

    const { id } = req.params;
    const { note } = req.body;

    db.get(
      "SELECT * FROM memberships WHERE id = ? AND member_id = ?",
      [id, memberId],
      (err, membership) => {
        if (err) {return res.status(500).json({ success: false, message: "Lỗi truy vấn" });}
        if (!membership) {return res.status(404).json({ success: false, message: "Không tìm thấy gói tập" });}

        db.run("UPDATE memberships SET status = 'cancelled' WHERE id = ?", [id], function (err2) {
          if (err2) {return res.status(500).json({ success: false, message: "Không thể hủy gói" });}

          db.run(
            `INSERT INTO membership_actions (membership_id, action_type, note)
             VALUES (?, 'cancel', ?)`,
            [id, note || 'Hủy gói từ user']
          );

          return res.status(200).json({ success: true, message: "Hủy gói thành công" });
        });
      }
    );
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
};

const upgradeMembership = async (req, res) => {
  try {
    const memberId = await getMemberId(req.user.id);
    if (!memberId) {return res.status(404).json({ success: false, message: "Không tìm thấy hồ sơ" });}

    const { id } = req.params;
    const { new_plan_id } = req.body;
    if (!new_plan_id) {
      return res.status(400).json({ success: false, message: "Vui lòng chọn gói mới" });
    }

    db.get("SELECT * FROM plans WHERE id = ? AND status = 'active'", [new_plan_id], (err, newPlan) => {
      if (err) {return res.status(500).json({ success: false, message: "Lỗi truy vấn" });}
      if (!newPlan) {return res.status(404).json({ success: false, message: "Không tìm thấy gói mới" });}

      db.get(
        "SELECT * FROM memberships WHERE id = ? AND member_id = ? AND status = 'active'",
        [id, memberId],
        (err2, membership) => {
          if (err2) {return res.status(500).json({ success: false, message: "Lỗi truy vấn" });}
          if (!membership) {return res.status(404).json({ success: false, message: "Không tìm thấy gói đang hoạt động" });}

          const oldEndDate = membership.end_date;
          const newEndDate = addDays(new Date().toISOString().slice(0, 10), newPlan.duration_days);

          db.run(
            "UPDATE memberships SET plan_id = ?, end_date = ?, status = 'active' WHERE id = ?",
            [new_plan_id, newEndDate, id],
            function (err3) {
              if (err3) {return res.status(500).json({ success: false, message: "Không thể nâng cấp gói" });}

              db.run(
                `INSERT INTO membership_actions (membership_id, action_type, old_end_date, new_end_date, note)
                 VALUES (?, 'renew', ?, ?, 'Nâng cấp gói từ user')`,
                [id, oldEndDate, newEndDate]
              );

              // Create payment for upgrade
              db.run(
                `INSERT INTO payments (member_id, membership_id, amount, paid_amount, debt_amount, method, status, note)
                 VALUES (?, ?, ?, 0, ?, 'qr', 'unpaid', 'Thanh toán nâng cấp gói')`,
                [memberId, id, newPlan.price, newPlan.price]
              );

              return res.status(200).json({
                success: true,
                message: "Nâng cấp gói thành công! Vui lòng thanh toán.",
                data: { new_plan: newPlan.name, new_end_date: newEndDate }
              });
            }
          );
        }
      );
    });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
};

// Coach
const getMyCoach = async (req, res) => {
  try {
    const memberId = await getMemberId(req.user.id);
    if (!memberId) {return res.status(404).json({ success: false, message: "Không tìm thấy hồ sơ" });}

    db.get(
      `SELECT t.id, t.trainer_code, t.specialty, t.experience_years, t.bio,
              u.full_name, u.email, u.phone, u.avatar_url
       FROM trainer_notes tn
       JOIN trainers t ON tn.trainer_id = t.id
       JOIN users u ON t.user_id = u.id
       WHERE tn.member_id = ?
       ORDER BY tn.created_at DESC LIMIT 1`,
      [memberId],
      (err, coach) => {
        if (err) {return res.status(500).json({ success: false, message: "Lỗi truy vấn" });}
        return res.status(200).json({ success: true, data: { coach: coach || null } });
      }
    );
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
};

const changeCoach = async (req, res) => {
  try {
    const memberId = await getMemberId(req.user.id);
    if (!memberId) {return res.status(404).json({ success: false, message: "Không tìm thấy hồ sơ" });}

    const { trainer_id } = req.body;
    if (!trainer_id) {
      return res.status(400).json({ success: false, message: "Vui lòng chọn huấn luyện viên" });
    }

    db.get("SELECT * FROM trainers WHERE id = ? AND status = 'active'", [trainer_id], (err, trainer) => {
      if (err) {return res.status(500).json({ success: false, message: "Lỗi truy vấn" });}
      if (!trainer) {return res.status(404).json({ success: false, message: "Không tìm thấy huấn luyện viên" });}

      db.run(
        `INSERT INTO trainer_notes (member_id, trainer_id, note, goal)
         VALUES (?, ?, 'Đăng ký huấn luyện viên từ user', 'Tập luyện cùng HLV')`,
        [memberId, trainer_id],
        function (err2) {
          if (err2) {return res.status(500).json({ success: false, message: "Không thể đổi huấn luyện viên" });}
          return res.status(200).json({ success: true, message: "Đổi huấn luyện viên thành công" });
        }
      );
    });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
};

// Bookings
const getMyBookings = async (req, res) => {
  try {
    const memberId = await getMemberId(req.user.id);
    if (!memberId) {return res.status(404).json({ success: false, message: "Không tìm thấy hồ sơ" });}

    db.all(
      `SELECT b.*, c.name as class_name, c.class_type, c.start_time, c.end_time, c.room, c.capacity,
              t.id as trainer_id, u.full_name as trainer_name
       FROM bookings b
       JOIN classes c ON b.class_id = c.id
       LEFT JOIN trainers t ON c.trainer_id = t.id
       LEFT JOIN users u ON t.user_id = u.id
       WHERE b.member_id = ?
       ORDER BY c.start_time DESC`,
      [memberId],
      (err, bookings) => {
        if (err) {return res.status(500).json({ success: false, message: "Lỗi truy vấn" });}
        return res.status(200).json({ success: true, data: { bookings } });
      }
    );
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
};

const bookClass = async (req, res) => {
  try {
    const memberId = await getMemberId(req.user.id);
    if (!memberId) {return res.status(404).json({ success: false, message: "Không tìm thấy hồ sơ" });}

    const { class_id } = req.body;
    if (!class_id) {
      return res.status(400).json({ success: false, message: "Vui lòng chọn lớp học" });
    }

    db.get("SELECT * FROM classes WHERE id = ? AND status = 'scheduled'", [class_id], (err, classItem) => {
      if (err) {return res.status(500).json({ success: false, message: "Lỗi truy vấn" });}
      if (!classItem) {return res.status(404).json({ success: false, message: "Không tìm thấy lớp học" });}

      // Check capacity
      db.get(
        "SELECT COUNT(*) as count FROM bookings WHERE class_id = ? AND status = 'booked'",
        [class_id],
        (err2, bookingCount) => {
          if (err2) {return res.status(500).json({ success: false, message: "Lỗi truy vấn" });}
          if (bookingCount.count >= classItem.capacity) {
            return res.status(400).json({ success: false, message: "Lớp học đã đầy" });
          }

          // Check if already booked
          db.get(
            "SELECT id FROM bookings WHERE class_id = ? AND member_id = ? AND status = 'booked'",
            [class_id, memberId],
            (err3, existing) => {
              if (err3) {return res.status(500).json({ success: false, message: "Lỗi truy vấn" });}
              if (existing) {
                return res.status(400).json({ success: false, message: "Bạn đã đăng ký lớp này rồi" });
              }

              db.run(
                "INSERT INTO bookings (member_id, class_id, status) VALUES (?, ?, 'booked')",
                [memberId, class_id],
                function (err4) {
                  if (err4) {return res.status(500).json({ success: false, message: "Không thể đăng ký lớp" });}
                  return res.status(201).json({ success: true, message: "Đăng ký lớp thành công", data: { id: this.lastID } });
                }
              );
            }
          );
        }
      );
    });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const memberId = await getMemberId(req.user.id);
    if (!memberId) {return res.status(404).json({ success: false, message: "Không tìm thấy hồ sơ" });}

    const { id } = req.params;
    db.run(
      "UPDATE bookings SET status = 'cancelled' WHERE id = ? AND member_id = ?",
      [id, memberId],
      function (err) {
        if (err) {return res.status(500).json({ success: false, message: "Không thể hủy đăng ký" });}
        if (this.changes === 0) {return res.status(404).json({ success: false, message: "Không tìm thấy đăng ký" });}
        return res.status(200).json({ success: true, message: "Hủy đăng ký thành công" });
      }
    );
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
};


const submitPaymentConfirmation = async (req, res) => {
  try {
    const memberId = await getMemberId(req.user.id);
    const { membership_id, note = '', proof_image, proof_filename = 'hoa-don-thanh-toan.jpg' } = req.body;
    if (!memberId || !membership_id) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin xác nhận' });
    }
    if (!proof_image || !/^data:image\/(png|jpe?g|webp);base64,/i.test(proof_image)) {
      return res.status(400).json({ success: false, message: 'Vui lòng tải ảnh hóa đơn thanh toán hợp lệ (JPG, PNG hoặc WEBP)' });
    }
    if (proof_image.length > 10 * 1024 * 1024) {
      return res.status(400).json({ success: false, message: 'Ảnh hóa đơn quá lớn. Vui lòng chọn ảnh dưới 7MB' });
    }

    db.get(`SELECT p.*, pl.name AS plan_name FROM payments p
      JOIN memberships ms ON ms.id = p.membership_id
      JOIN plans pl ON pl.id = ms.plan_id
      WHERE p.membership_id = ? AND p.member_id = ? ORDER BY p.id DESC LIMIT 1`, [membership_id, memberId], (err, payment) => {
      if (err || !payment) {return res.status(404).json({ success: false, message: 'Không tìm thấy giao dịch' });}
      if (payment.status === 'paid') {return res.status(400).json({ success: false, message: 'Giao dịch đã được xác nhận' });}

      db.run(`INSERT INTO payment_requests (payment_id, member_id, membership_id, status, note, proof_image, proof_filename)
        VALUES (?, ?, ?, 'pending', ?, ?, ?)
        ON CONFLICT(payment_id) DO UPDATE SET
          status='pending', submitted_at=CURRENT_TIMESTAMP, reviewed_at=NULL, reviewed_by=NULL,
          note=excluded.note, proof_image=excluded.proof_image, proof_filename=excluded.proof_filename`,
        [payment.id, memberId, membership_id, note, proof_image, proof_filename], function(err2) {
          if (err2) {return res.status(500).json({ success: false, message: 'Không thể gửi hóa đơn thanh toán' });}
          db.run(`INSERT INTO notifications (type,title,message,related_id,audience) VALUES ('payment',?,?,?,'admin')`,
            ['Hóa đơn thanh toán mới', `Hội viên đã gửi ảnh hóa đơn cho gói ${payment.plan_name}. Vui lòng kiểm tra và xác nhận.`, payment.id]);
          return res.status(200).json({ success: true, message: 'Đã gửi ảnh hóa đơn. Vui lòng chờ quản trị viên xác nhận.' });
        });
    });
  } catch (_error) {
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
  }
};

const cancelPaymentConfirmation = async (req, res) => {
  const memberId = await getMemberId(req.user.id);
  db.run(`UPDATE payment_requests SET status='cancelled', reviewed_at=CURRENT_TIMESTAMP
    WHERE membership_id=? AND member_id=? AND status='pending'`, [req.params.membershipId, memberId], function(err) {
    if (err) {return res.status(500).json({ success:false, message:'Không thể hủy yêu cầu' });}
    return res.status(200).json({ success:true, message:'Đã hủy yêu cầu xác nhận thanh toán' });
  });
};

const markMyNotificationRead = (req, res) => {
  db.run(`UPDATE notifications SET is_read=1 WHERE id=? AND (user_id=? OR audience='member')`, [req.params.id, req.user.id], function(err) {
    if (err) {return res.status(500).json({success:false,message:'Không thể cập nhật thông báo'});}
    return res.status(200).json({success:true,message:'Đã đọc'});
  });
};

// Payment QR
const createPaymentQR = async (req, res) => {
  try {
    const memberId = await getMemberId(req.user.id);
    if (!memberId) {return res.status(404).json({ success: false, message: "Không tìm thấy hồ sơ" });}

    const { membership_id, amount } = req.body;
    if (!membership_id || !amount) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin thanh toán" });
    }

    // Verify membership belongs to user
    db.get(
      "SELECT * FROM memberships WHERE id = ? AND member_id = ?",
      [membership_id, memberId],
      (err, membership) => {
        if (err) {return res.status(500).json({ success: false, message: "Lỗi truy vấn" });}
        if (!membership) {return res.status(404).json({ success: false, message: "Không tìm thấy gói tập" });}

        // VietQR format: https://img.vietqr.io/image/MBBank-668060825-compact.png?amount=X&addInfo=FitLife+Thanh+toan+goi+ID+Y&accountName=Le+Pham+Minh+Huy
        const bankCode = "MBBank";
        const accountNo = "668060825";
        const accountName = "Le Pham Minh Huy";
        const addInfo = encodeURIComponent(`FitLife Thanh toan goi ${membership_id}`);
        const qrUrl = `https://img.vietqr.io/image/${bankCode}-${accountNo}-compact.png?amount=${amount}&addInfo=${addInfo}&accountName=${accountName}`;

        return res.status(200).json({
          success: true,
          data: {
            qr_url: qrUrl,
            bank: "MB Bank",
            account_no: accountNo,
            account_name: "Lê Phạm Minh Huy",
            amount: amount,
            content: `FitLife Thanh toan goi ${membership_id}`,
            membership_id
          }
        });
      }
    );
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  changePassword,
  getMyBodyMetrics,
  updateBodyMetrics,
  getMyMemberships,
  buyPlan,
  cancelMyMembership,
  upgradeMembership,
  getMyCoach,
  changeCoach,
  getMyBookings,
  bookClass,
  cancelBooking,
  getUserDashboard,
  createPaymentQR,
  getHealthAdvice,
  submitPaymentConfirmation,
  cancelPaymentConfirmation,
  markMyNotificationRead
};