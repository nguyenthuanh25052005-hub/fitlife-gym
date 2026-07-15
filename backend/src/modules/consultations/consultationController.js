const db = require('../../database/db');

const createConsultation = (req, res) => {
  const { full_name, phone, email, interested_product } = req.body;

  if (!full_name?.trim() || !phone?.trim() || !email?.trim() || !interested_product?.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng nhập đầy đủ họ tên, số điện thoại, email và sản phẩm quan tâm.',
    });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const normalizedPhone = String(phone).trim();
  const normalizedName = String(full_name).trim();
  const normalizedProduct = String(interested_product).trim();

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(normalizedEmail)) {
    return res.status(400).json({
      success: false,
      message: 'Email không hợp lệ.',
    });
  }

  db.run(
    `
      INSERT INTO consultation_requests (
        full_name,
        phone,
        email,
        interested_product,
        status
      )
      VALUES (?, ?, ?, ?, 'PENDING')
    `,
    [normalizedName, normalizedPhone, normalizedEmail, normalizedProduct],
    function createConsultationRow(error) {
      if (error) {
        return res.status(500).json({
          success: false,
          message: 'Không thể lưu yêu cầu tư vấn.',
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Yêu cầu tư vấn đã được ghi nhận.',
        data: {
          consultation: {
            id: this.lastID,
            full_name: normalizedName,
            phone: normalizedPhone,
            email: normalizedEmail,
            interested_product: normalizedProduct,
            status: 'PENDING',
          },
        },
      });
    },
  );
};

const getAllConsultations = (req, res) => {
  db.all(
    `
      SELECT
        id,
        full_name,
        phone,
        email,
        interested_product,
        status,
        created_at
      FROM consultation_requests
      ORDER BY created_at DESC
    `,
    [],
    (error, consultations) => {
      if (error) {
        return res.status(500).json({
          success: false,
          message: 'Không thể tải danh sách yêu cầu tư vấn.',
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          consultations,
        },
      });
    },
  );
};

const updateConsultationStatus = (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['PENDING', 'CONTACTED', 'CLOSED'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Status không hợp lệ.',
    });
  }

  db.run(
    `
      UPDATE consultation_requests
      SET status = ?
      WHERE id = ?
    `,
    [status, id],
    function updateStatus(error) {
      if (error) {
        return res.status(500).json({
          success: false,
          message: 'Không thể cập nhật trạng thái.',
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy yêu cầu tư vấn.',
        });
      }

      db.get(
        `
          SELECT
            id,
            full_name,
            phone,
            email,
            interested_product,
            status,
            created_at
          FROM consultation_requests
          WHERE id = ?
        `,
        [id],
        (fetchError, consultation) => {
          if (fetchError) {
            return res.status(500).json({
              success: false,
              message: 'Không thể tải lại yêu cầu tư vấn.',
            });
          }

          return res.status(200).json({
            success: true,
            message: 'Cập nhật trạng thái thành công.',
            data: {
              consultation,
            },
          });
        },
      );
    },
  );
};

module.exports = {
  createConsultation,
  getAllConsultations,
  updateConsultationStatus,
};
