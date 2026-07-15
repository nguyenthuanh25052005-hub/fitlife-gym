const db = require('../../database/db');

const getAllBookings = (req, res) => {
  db.all(
    `
      SELECT
        bookings.*,
        members.member_code,
        member_user.full_name AS member_name,
        classes.name AS class_name,
        classes.class_type,
        classes.start_time,
        classes.end_time,
        trainer_user.full_name AS trainer_name
      FROM bookings
      JOIN members ON bookings.member_id = members.id
      JOIN users AS member_user ON members.user_id = member_user.id
      JOIN classes ON bookings.class_id = classes.id
      LEFT JOIN trainers ON classes.trainer_id = trainers.id
      LEFT JOIN users AS trainer_user ON trainers.user_id = trainer_user.id
      ORDER BY bookings.booking_date DESC
    `,
    [],
    (error, bookings) => {
      if (error) {
        return res.status(500).json({
          success: false,
          message: 'Không thể tải danh sách đặt lịch'
        });
      }

      return res.status(200).json({
        success: true,
        data: { bookings }
      });
    }
  );
};

const createBooking = (req, res) => {
  let { member_id, class_id, note } = req.body;

  if (!class_id) {
    return res.status(400).json({
      success: false,
      message: 'class_id là bắt buộc'
    });
  }

  const resolveMember = (callback) => {
    if (req.user.role === 'member') {
      db.get(
        'SELECT id FROM members WHERE user_id = ?',
        [req.user.id],
        (error, member) => {
          if (error) {
            return res.status(500).json({
              success: false,
              message: 'Không thể kiểm tra hội viên'
            });
          }

          if (!member) {
            return res.status(404).json({
              success: false,
              message: 'Không tìm thấy hồ sơ hội viên'
            });
          }

          member_id = member.id;
          return callback();
        }
      );
    } else {
      if (!member_id) {
        return res.status(400).json({
          success: false,
          message: 'member_id là bắt buộc với admin'
        });
      }

      return callback();
    }
  };

  resolveMember(() => {
    db.get(
      `
        SELECT id
        FROM memberships
        WHERE member_id = ?
          AND status = 'active'
          AND DATE(end_date) >= DATE('now', 'localtime')
        ORDER BY id DESC
        LIMIT 1
      `,
      [member_id],
      (membershipError, membership) => {
        if (membershipError) {
          return res.status(500).json({
            success: false,
            message: 'Không thể kiểm tra gói hội viên'
          });
        }

        if (!membership) {
          return res.status(400).json({
            success: false,
            message: 'Hội viên không có gói tập còn hiệu lực'
          });
        }

        db.get(
          `
            SELECT
              classes.*,
              COUNT(bookings.id) AS booked_count
            FROM classes
            LEFT JOIN bookings
              ON classes.id = bookings.class_id
              AND bookings.status = 'booked'
            WHERE classes.id = ?
            GROUP BY classes.id
          `,
          [class_id],
          (classError, classInfo) => {
            if (classError) {
              return res.status(500).json({
                success: false,
                message: 'Không thể kiểm tra lớp học'
              });
            }

            if (!classInfo || classInfo.status !== 'scheduled') {
              return res.status(404).json({
                success: false,
                message: 'Lớp học không tồn tại hoặc không còn mở lịch'
              });
            }

            if (Number(classInfo.booked_count) >= Number(classInfo.capacity)) {
              return res.status(400).json({
                success: false,
                message: 'Lớp học đã đủ số lượng'
              });
            }

            db.get(
              `
                SELECT id
                FROM bookings
                WHERE member_id = ?
                  AND class_id = ?
                  AND status = 'booked'
              `,
              [member_id, class_id],
              (existingError, existingBooking) => {
                if (existingError) {
                  return res.status(500).json({
                    success: false,
                    message: 'Không thể kiểm tra đặt lịch'
                  });
                }

                if (existingBooking) {
                  return res.status(409).json({
                    success: false,
                    message: 'Hội viên đã đặt lớp này'
                  });
                }

                db.run(
                  `
                    INSERT INTO bookings (
                      member_id,
                      class_id,
                      status,
                      note
                    )
                    VALUES (?, ?, 'booked', ?)
                  `,
                  [member_id, class_id, note || null],
                  function insertBooking(error) {
                    if (error) {
                      return res.status(500).json({
                        success: false,
                        message: 'Không thể tạo đặt lịch'
                      });
                    }

                    return res.status(201).json({
                      success: true,
                      message: 'Đặt lịch thành công',
                      data: {
                        booking: {
                          id: this.lastID,
                          member_id,
                          class_id,
                          status: 'booked'
                        }
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
  });
};

const updateBookingStatus = (req, res) => {
  const { status, note } = req.body;

  if (!status || !['booked', 'completed', 'cancelled', 'no_show'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Trạng thái booking không hợp lệ'
    });
  }

  db.run(
    `
      UPDATE bookings
      SET
        status = ?,
        note = COALESCE(?, note)
      WHERE id = ?
    `,
    [status, note || null, req.params.id],
    function update(error) {
      if (error) {
        return res.status(500).json({
          success: false,
          message: 'Không thể cập nhật đặt lịch'
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy đặt lịch'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Cập nhật đặt lịch thành công'
      });
    }
  );
};

module.exports = {
  getAllBookings,
  createBooking,
  updateBookingStatus
};