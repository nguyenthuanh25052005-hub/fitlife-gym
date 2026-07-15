const db = require('../../database/db');

const getAllTrainers = (req, res) => {
  db.all(
    `
      SELECT
        trainers.*,
        users.full_name,
        users.email,
        users.phone,
        users.avatar_url
      FROM trainers
      JOIN users ON trainers.user_id = users.id
      ORDER BY trainers.id DESC
    `,
    [],
    (error, trainers) => {
      if (error) {
        return res.status(500).json({
          success: false,
          message: 'Không thể tải danh sách huấn luyện viên'
        });
      }

      return res.status(200).json({
        success: true,
        data: { trainers }
      });
    }
  );
};

const getTrainerById = (req, res) => {
  const { id } = req.params;

  db.get(
    `
      SELECT
        trainers.*,
        users.full_name,
        users.email,
        users.phone,
        users.avatar_url
      FROM trainers
      JOIN users ON trainers.user_id = users.id
      WHERE trainers.id = ?
    `,
    [id],
    (error, trainer) => {
      if (error) {
        return res.status(500).json({
          success: false,
          message: 'Không thể tải hồ sơ huấn luyện viên'
        });
      }

      if (!trainer) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy huấn luyện viên'
        });
      }

      db.all(
        `
          SELECT
            classes.*,
            COUNT(bookings.id) AS booked_count
          FROM classes
          LEFT JOIN bookings
            ON classes.id = bookings.class_id
            AND bookings.status = 'booked'
          WHERE classes.trainer_id = ?
          GROUP BY classes.id
          ORDER BY classes.start_time ASC
        `,
        [id],
        (scheduleError, schedule) => {
          if (scheduleError) {
            return res.status(500).json({
              success: false,
              message: 'Không thể tải lịch dạy'
            });
          }

          db.all(
            `
              SELECT
                trainer_notes.*,
                members.member_code,
                users.full_name AS member_name
              FROM trainer_notes
              JOIN members ON trainer_notes.member_id = members.id
              JOIN users ON members.user_id = users.id
              WHERE trainer_notes.trainer_id = ?
              ORDER BY trainer_notes.created_at DESC
            `,
            [id],
            (noteError, notes) => {
              if (noteError) {
                return res.status(500).json({
                  success: false,
                  message: 'Không thể tải ghi chú huấn luyện'
                });
              }

              return res.status(200).json({
                success: true,
                data: {
                  trainer,
                  schedule,
                  notes
                }
              });
            }
          );
        }
      );
    }
  );
};

const createTrainer = (req, res) => {
  const bcrypt = require('bcryptjs');

  const {
    full_name,
    email,
    password = 'trainer123',
    phone,
    specialty,
    experience_years = 0,
    bio
  } = req.body;

  if (!full_name || !email) {
    return res.status(400).json({
      success: false,
      message: 'Họ tên và email là bắt buộc'
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  db.get(
    'SELECT id FROM users WHERE email = ?',
    [normalizedEmail],
    async (findError, existingUser) => {
      if (findError) {
        return res.status(500).json({
          success: false,
          message: 'Lỗi truy vấn cơ sở dữ liệu'
        });
      }

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Email đã tồn tại'
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      db.run(
        `
          INSERT INTO users (
            full_name,
            email,
            password,
            role,
            phone,
            status
          )
          VALUES (?, ?, ?, 'trainer', ?, 'active')
        `,
        [
          full_name.trim(),
          normalizedEmail,
          hashedPassword,
          phone || null
        ],
        function insertUser(userError) {
          if (userError) {
            return res.status(500).json({
              success: false,
              message: 'Không thể tạo tài khoản huấn luyện viên'
            });
          }

          const userId = this.lastID;
          const trainerCode = `PT${String(userId).padStart(4, '0')}`;

          db.run(
            `
              INSERT INTO trainers (
                user_id,
                trainer_code,
                specialty,
                experience_years,
                bio,
                status
              )
              VALUES (?, ?, ?, ?, ?, 'active')
            `,
            [
              userId,
              trainerCode,
              specialty || null,
              experience_years,
              bio || null
            ],
            function insertTrainer(trainerError) {
              if (trainerError) {
                db.run('DELETE FROM users WHERE id = ?', [userId]);

                return res.status(500).json({
                  success: false,
                  message: 'Không thể tạo hồ sơ huấn luyện viên'
                });
              }

              return res.status(201).json({
                success: true,
                message: 'Tạo huấn luyện viên thành công',
                data: {
                  trainer: {
                    id: this.lastID,
                    user_id: userId,
                    trainer_code: trainerCode,
                    full_name: full_name.trim(),
                    email: normalizedEmail,
                    specialty: specialty || null
                  }
                }
              });
            }
          );
        }
      );
    }
  );
};

const updateTrainer = (req, res) => {
  const { id } = req.params;

  const {
    full_name,
    phone,
    specialty,
    experience_years,
    bio,
    status
  } = req.body;

  db.get(
    'SELECT user_id FROM trainers WHERE id = ?',
    [id],
    (findError, trainer) => {
      if (findError) {
        return res.status(500).json({
          success: false,
          message: 'Lỗi truy vấn cơ sở dữ liệu'
        });
      }

      if (!trainer) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy huấn luyện viên'
        });
      }

      db.run(
        `
          UPDATE users
          SET
            full_name = COALESCE(?, full_name),
            phone = COALESCE(?, phone)
          WHERE id = ?
        `,
        [
          full_name || null,
          phone || null,
          trainer.user_id
        ],
        (userError) => {
          if (userError) {
            return res.status(500).json({
              success: false,
              message: 'Không thể cập nhật tài khoản huấn luyện viên'
            });
          }

          db.run(
            `
              UPDATE trainers
              SET
                specialty = COALESCE(?, specialty),
                experience_years = COALESCE(?, experience_years),
                bio = COALESCE(?, bio),
                status = COALESCE(?, status)
              WHERE id = ?
            `,
            [
              specialty || null,
              experience_years === undefined ? null : experience_years,
              bio || null,
              status || null,
              id
            ],
            (updateError) => {
              if (updateError) {
                return res.status(500).json({
                  success: false,
                  message: 'Không thể cập nhật huấn luyện viên'
                });
              }

              return res.status(200).json({
                success: true,
                message: 'Cập nhật huấn luyện viên thành công'
              });
            }
          );
        }
      );
    }
  );
};

const deleteTrainer = (req, res) => {
  db.run(
    `
      UPDATE trainers
      SET status = 'inactive'
      WHERE id = ?
    `,
    [req.params.id],
    function remove(error) {
      if (error) {
        return res.status(500).json({
          success: false,
          message: 'Không thể ngừng hoạt động huấn luyện viên'
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy huấn luyện viên'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Đã ngừng hoạt động huấn luyện viên'
      });
    }
  );
};

const createTrainerNote = (req, res) => {
  const {
    member_id,
    trainer_id,
    note,
    goal
  } = req.body;

  if (!member_id || !trainer_id || !note) {
    return res.status(400).json({
      success: false,
      message: 'member_id, trainer_id và note là bắt buộc'
    });
  }

  db.run(
    `
      INSERT INTO trainer_notes (
        member_id,
        trainer_id,
        note,
        goal
      )
      VALUES (?, ?, ?, ?)
    `,
    [
      member_id,
      trainer_id,
      note,
      goal || null
    ],
    function insertNote(error) {
      if (error) {
        return res.status(500).json({
          success: false,
          message: 'Không thể tạo ghi chú huấn luyện'
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Tạo ghi chú huấn luyện thành công',
        data: {
          note: {
            id: this.lastID,
            member_id,
            trainer_id,
            note,
            goal: goal || null
          }
        }
      });
    }
  );
};

module.exports = {
  getAllTrainers,
  getTrainerById,
  createTrainer,
  updateTrainer,
  deleteTrainer,
  createTrainerNote
};