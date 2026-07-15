const db = require('../../database/db');

const getAllPlans = (req, res) => {
  db.all(
    `
      SELECT *
      FROM plans
      ORDER BY id DESC
    `,
    [],
    (error, plans) => {
      if (error) {
        return res.status(500).json({
          success: false,
          message: 'Không thể tải danh sách gói tập'
        });
      }

      return res.status(200).json({
        success: true,
        data: { plans }
      });
    }
  );
};

const getPlanById = (req, res) => {
  db.get(
    'SELECT * FROM plans WHERE id = ?',
    [req.params.id],
    (error, plan) => {
      if (error) {
        return res.status(500).json({
          success: false,
          message: 'Không thể tải gói tập'
        });
      }

      if (!plan) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy gói tập'
        });
      }

      return res.status(200).json({
        success: true,
        data: { plan }
      });
    }
  );
};

const createPlan = (req, res) => {
  const {
    name,
    description,
    plan_type,
    duration_days,
    session_limit,
    price
  } = req.body;

  if (!name || !plan_type || !duration_days || price === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Tên gói, loại gói, thời hạn và giá là bắt buộc'
    });
  }

  db.run(
    `
      INSERT INTO plans (
        name,
        description,
        plan_type,
        duration_days,
        session_limit,
        price,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, 'active')
    `,
    [
      name,
      description || null,
      plan_type,
      duration_days,
      session_limit || null,
      price
    ],
    function insertPlan(error) {
      if (error) {
        return res.status(500).json({
          success: false,
          message: 'Không thể tạo gói tập'
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Tạo gói tập thành công',
        data: {
          plan: {
            id: this.lastID,
            name,
            plan_type,
            duration_days,
            session_limit: session_limit || null,
            price
          }
        }
      });
    }
  );
};

const updatePlan = (req, res) => {
  const {
    name,
    description,
    plan_type,
    duration_days,
    session_limit,
    price,
    status
  } = req.body;

  db.run(
    `
      UPDATE plans
      SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        plan_type = COALESCE(?, plan_type),
        duration_days = COALESCE(?, duration_days),
        session_limit = COALESCE(?, session_limit),
        price = COALESCE(?, price),
        status = COALESCE(?, status)
      WHERE id = ?
    `,
    [
      name || null,
      description || null,
      plan_type || null,
      duration_days || null,
      session_limit || null,
      price === undefined ? null : price,
      status || null,
      req.params.id
    ],
    function update(error) {
      if (error) {
        return res.status(500).json({
          success: false,
          message: 'Không thể cập nhật gói tập'
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy gói tập'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Cập nhật gói tập thành công'
      });
    }
  );
};

const deletePlan = (req, res) => {
  db.run(
    "UPDATE plans SET status = 'inactive' WHERE id = ?",
    [req.params.id],
    function remove(error) {
      if (error) {
        return res.status(500).json({
          success: false,
          message: 'Không thể ngừng sử dụng gói tập'
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy gói tập'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Đã ngừng sử dụng gói tập'
      });
    }
  );
};

module.exports = {
  getAllPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan
};