const db = require('../../database/db');

const addDays = (dateText, days) => {
  const date = new Date(dateText);
  date.setDate(date.getDate() + Number(days));
  return date.toISOString().slice(0, 10);
};

const getAllMemberships = (req, res) => {
  db.all(
    `
      SELECT
        memberships.*,
        members.member_code,
        users.full_name,
        users.phone,
        plans.name AS plan_name,
        plans.plan_type,
        plans.price
      FROM memberships
      JOIN members ON memberships.member_id = members.id
      JOIN users ON members.user_id = users.id
      JOIN plans ON memberships.plan_id = plans.id
      ORDER BY memberships.id DESC
    `,
    [],
    (error, memberships) => {
      if (error) {
        return res.status(500).json({
          success: false,
          message: 'Không thể tải danh sách gói hội viên'
        });
      }

      return res.status(200).json({
        success: true,
        data: { memberships }
      });
    }
  );
};

const getMembershipById = (req, res) => {
  db.get(
    `
      SELECT
        memberships.*,
        members.member_code,
        users.full_name,
        users.phone,
        plans.name AS plan_name,
        plans.plan_type,
        plans.price
      FROM memberships
      JOIN members ON memberships.member_id = members.id
      JOIN users ON members.user_id = users.id
      JOIN plans ON memberships.plan_id = plans.id
      WHERE memberships.id = ?
    `,
    [req.params.id],
    (error, membership) => {
      if (error) {
        return res.status(500).json({
          success: false,
          message: 'Không thể tải chi tiết gói hội viên'
        });
      }

      if (!membership) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy gói hội viên'
        });
      }

      db.all(
        `
          SELECT *
          FROM membership_actions
          WHERE membership_id = ?
          ORDER BY created_at DESC
        `,
        [req.params.id],
        (actionError, actions) => {
          if (actionError) {
            return res.status(500).json({
              success: false,
              message: 'Không thể tải lịch sử gói'
            });
          }

          return res.status(200).json({
            success: true,
            data: {
              membership,
              actions
            }
          });
        }
      );
    }
  );
};

const createMembership = (req, res) => {
  const {
    member_id,
    plan_id,
    start_date,
    paid_amount = 0,
    method = 'cash',
    note
  } = req.body;

  if (!member_id || !plan_id || !start_date) {
    return res.status(400).json({
      success: false,
      message: 'member_id, plan_id và start_date là bắt buộc'
    });
  }

  db.get(
    "SELECT * FROM plans WHERE id = ? AND status = 'active'",
    [plan_id],
    (planError, plan) => {
      if (planError) {
        return res.status(500).json({
          success: false,
          message: 'Lỗi truy vấn gói tập'
        });
      }

      if (!plan) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy gói tập đang hoạt động'
        });
      }

      const endDate = addDays(start_date, plan.duration_days);
      const remainingSessions = plan.session_limit || null;
      const debtAmount = Math.max(Number(plan.price) - Number(paid_amount), 0);
      const paymentStatus = debtAmount === 0
        ? 'paid'
        : Number(paid_amount) > 0
          ? 'partial'
          : 'unpaid';

      db.run(
        `
          INSERT INTO memberships (
            member_id,
            plan_id,
            start_date,
            end_date,
            remaining_sessions,
            status,
            note
          )
          VALUES (?, ?, ?, ?, ?, 'active', ?)
        `,
        [
          member_id,
          plan_id,
          start_date,
          endDate,
          remainingSessions,
          note || null
        ],
        function insertMembership(membershipError) {
          if (membershipError) {
            return res.status(500).json({
              success: false,
              message: 'Không thể đăng ký gói cho hội viên'
            });
          }

          const membershipId = this.lastID;

          db.run(
            `
              INSERT INTO membership_actions (
                membership_id,
                action_type,
                new_end_date,
                note
              )
              VALUES (?, 'create', ?, ?)
            `,
            [
              membershipId,
              endDate,
              'Đăng ký gói mới'
            ]
          );

          db.run(
            `
              INSERT INTO payments (
                member_id,
                membership_id,
                amount,
                paid_amount,
                debt_amount,
                method,
                status,
                note
              )
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
              member_id,
              membershipId,
              plan.price,
              paid_amount,
              debtAmount,
              method,
              paymentStatus,
              note || 'Thanh toán đăng ký gói'
            ],
            (paymentError) => {
              if (paymentError) {
                return res.status(500).json({
                  success: false,
                  message: 'Đăng ký gói thành công nhưng tạo thanh toán thất bại'
                });
              }

              return res.status(201).json({
                success: true,
                message: 'Đăng ký gói thành công',
                data: {
                  membership: {
                    id: membershipId,
                    member_id,
                    plan_id,
                    start_date,
                    end_date: endDate,
                    remaining_sessions: remainingSessions,
                    status: 'active'
                  },
                  payment: {
                    amount: plan.price,
                    paid_amount,
                    debt_amount: debtAmount,
                    status: paymentStatus
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

const renewMembership = (req, res) => {
  const { id } = req.params;
  const { extra_days, paid_amount = 0, method = 'cash', note } = req.body;

  if (!extra_days) {
    return res.status(400).json({
      success: false,
      message: 'extra_days là bắt buộc'
    });
  }

  db.get(
    `
      SELECT memberships.*, plans.price
      FROM memberships
      JOIN plans ON memberships.plan_id = plans.id
      WHERE memberships.id = ?
    `,
    [id],
    (error, membership) => {
      if (error || !membership) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy gói hội viên'
        });
      }

      const oldEndDate = membership.end_date;
      const newEndDate = addDays(oldEndDate, extra_days);
      const debtAmount = Math.max(Number(membership.price) - Number(paid_amount), 0);
      const paymentStatus = debtAmount === 0 ? 'paid' : 'partial';

      db.run(
        `
          UPDATE memberships
          SET end_date = ?, status = 'active'
          WHERE id = ?
        `,
        [newEndDate, id],
        (updateError) => {
          if (updateError) {
            return res.status(500).json({
              success: false,
              message: 'Không thể gia hạn gói'
            });
          }

          db.run(
            `
              INSERT INTO membership_actions (
                membership_id,
                action_type,
                old_end_date,
                new_end_date,
                note
              )
              VALUES (?, 'renew', ?, ?, ?)
            `,
            [id, oldEndDate, newEndDate, note || 'Gia hạn gói']
          );

          db.run(
            `
              INSERT INTO payments (
                member_id,
                membership_id,
                amount,
                paid_amount,
                debt_amount,
                method,
                status,
                note
              )
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
              membership.member_id,
              id,
              membership.price,
              paid_amount,
              debtAmount,
              method,
              paymentStatus,
              note || 'Thanh toán gia hạn'
            ]
          );

          return res.status(200).json({
            success: true,
            message: 'Gia hạn gói thành công',
            data: {
              old_end_date: oldEndDate,
              new_end_date: newEndDate
            }
          });
        }
      );
    }
  );
};

const freezeMembership = (req, res) => {
  const { note } = req.body;

  db.run(
    `
      UPDATE memberships
      SET status = 'frozen'
      WHERE id = ?
    `,
    [req.params.id],
    function update(error) {
      if (error) {
        return res.status(500).json({
          success: false,
          message: 'Không thể bảo lưu gói'
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy gói hội viên'
        });
      }

      db.run(
        `
          INSERT INTO membership_actions (
            membership_id,
            action_type,
            note
          )
          VALUES (?, 'freeze', ?)
        `,
        [req.params.id, note || 'Bảo lưu gói']
      );

      return res.status(200).json({
        success: true,
        message: 'Bảo lưu gói thành công'
      });
    }
  );
};

const unfreezeMembership = (req, res) => {
  const { note } = req.body;

  db.run(
    `
      UPDATE memberships
      SET status = 'active'
      WHERE id = ?
    `,
    [req.params.id],
    function update(error) {
      if (error) {
        return res.status(500).json({
          success: false,
          message: 'Không thể kích hoạt lại gói'
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy gói hội viên'
        });
      }

      db.run(
        `
          INSERT INTO membership_actions (
            membership_id,
            action_type,
            note
          )
          VALUES (?, 'unfreeze', ?)
        `,
        [req.params.id, note || 'Kích hoạt lại gói']
      );

      return res.status(200).json({
        success: true,
        message: 'Kích hoạt lại gói thành công'
      });
    }
  );
};

const cancelMembership = (req, res) => {
  const { note } = req.body;

  db.run(
    `
      UPDATE memberships
      SET status = 'cancelled'
      WHERE id = ?
    `,
    [req.params.id],
    function update(error) {
      if (error) {
        return res.status(500).json({
          success: false,
          message: 'Không thể hủy gói'
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy gói hội viên'
        });
      }

      db.run(
        `
          INSERT INTO membership_actions (
            membership_id,
            action_type,
            note
          )
          VALUES (?, 'cancel', ?)
        `,
        [req.params.id, note || 'Hủy gói']
      );

      return res.status(200).json({
        success: true,
        message: 'Hủy gói thành công'
      });
    }
  );
};

module.exports = {
  getAllMemberships,
  getMembershipById,
  createMembership,
  renewMembership,
  freezeMembership,
  unfreezeMembership,
  cancelMembership
};