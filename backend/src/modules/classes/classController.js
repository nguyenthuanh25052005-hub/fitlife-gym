const db = require('../../database/db');

const getAllClasses = (req, res) => {
  db.all(
    `
      SELECT
        classes.*,
        users.full_name AS trainer_name,
        COUNT(bookings.id) AS booked_count
      FROM classes
      LEFT JOIN trainers ON classes.trainer_id = trainers.id
      LEFT JOIN users ON trainers.user_id = users.id
      LEFT JOIN bookings
        ON classes.id = bookings.class_id
        AND bookings.status = 'booked'
      GROUP BY classes.id
      ORDER BY classes.start_time ASC
    `,
    [],
    (error, classes) => {
      if (error) {
        return res.status(500).json({
          success: false,
          message: 'Không thể tải danh sách lớp học'
        });
      }

      return res.status(200).json({
        success: true,
        data: { classes }
      });
    }
  );
};

const createClass = (req, res) => {
  const {
    name,
    class_type,
    trainer_id,
    room,
    start_time,
    end_time,
    capacity = 20
  } = req.body;

  if (!name || !class_type || !start_time || !end_time) {
    return res.status(400).json({
      success: false,
      message: 'Tên lớp, loại lớp, thời gian bắt đầu và kết thúc là bắt buộc'
    });
  }

  db.run(
    `
      INSERT INTO classes (
        name,
        class_type,
        trainer_id,
        room,
        start_time,
        end_time,
        capacity,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled')
    `,
    [
      name,
      class_type,
      trainer_id || null,
      room || null,
      start_time,
      end_time,
      capacity
    ],
    function insertClass(error) {
      if (error) {
        return res.status(500).json({
          success: false,
          message: 'Không thể tạo lớp học'
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Tạo lớp học thành công',
        data: {
          class: {
            id: this.lastID,
            name,
            class_type,
            trainer_id: trainer_id || null,
            room: room || null,
            start_time,
            end_time,
            capacity,
            status: 'scheduled'
          }
        }
      });
    }
  );
};

const updateClass = (req, res) => {
  const {
    name,
    class_type,
    trainer_id,
    room,
    start_time,
    end_time,
    capacity,
    status
  } = req.body;

  db.run(
    `
      UPDATE classes
      SET
        name = COALESCE(?, name),
        class_type = COALESCE(?, class_type),
        trainer_id = COALESCE(?, trainer_id),
        room = COALESCE(?, room),
        start_time = COALESCE(?, start_time),
        end_time = COALESCE(?, end_time),
        capacity = COALESCE(?, capacity),
        status = COALESCE(?, status)
      WHERE id = ?
    `,
    [
      name || null,
      class_type || null,
      trainer_id || null,
      room || null,
      start_time || null,
      end_time || null,
      capacity || null,
      status || null,
      req.params.id
    ],
    function update(error) {
      if (error) {
        return res.status(500).json({
          success: false,
          message: 'Không thể cập nhật lớp học'
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy lớp học'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Cập nhật lớp học thành công'
      });
    }
  );
};

const deleteClass = (req, res) => {
  db.run(
    `
      UPDATE classes
      SET status = 'cancelled'
      WHERE id = ?
    `,
    [req.params.id],
    function remove(error) {
      if (error) {
        return res.status(500).json({
          success: false,
          message: 'Không thể hủy lớp học'
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy lớp học'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Hủy lớp học thành công'
      });
    }
  );
};

module.exports = {
  getAllClasses,
  createClass,
  updateClass,
  deleteClass
};