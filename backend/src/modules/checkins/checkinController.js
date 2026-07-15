const db = require('../../database/db');

const getAllCheckins = (req, res) => {
  db.all(
    `
      SELECT
        checkins.*,
        members.member_code,
        users.full_name,
        users.phone,
        plans.name AS plan_name
      FROM checkins
      JOIN members ON checkins.member_id = members.id
      JOIN users ON members.user_id = users.id
      LEFT JOIN memberships ON checkins.membership_id = memberships.id
      LEFT JOIN plans ON memberships.plan_id = plans.id
      ORDER BY checkins.checkin_time DESC
    `,
    [],
    (error, checkins) => {
      if (error) {
        return res.status(500).json({
          success: false,
          message: 'Không thể tải lịch sử check-in'
        });
      }

      return res.status(200).json({
        success: true,
        data: { checkins }
      });
    }
  );
};

const createCheckin = (req, res) => {
  const {
    member_id,
    method = 'manual',
    note
  } = req.body;

  if (!member_id) {
    return res.status(400).json({
      success: false,
      message: 'member_id là bắt buộc'
    });
  }

  db.get(
    `
      SELECT *
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

      if (
        membership.remaining_sessions !== null &&
        Number(membership.remaining_sessions) <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: 'Gói tập đã hết số buổi'
        });
      }

      db.run(
        `
          INSERT INTO checkins (
            member_id,
            membership_id,
            method,
            status,
            note
          )
          VALUES (?, ?, ?, 'valid', ?)
        `,
        [
          member_id,
          membership.id,
          method,
          note || 'Check-in thành công'
        ],
        function insertCheckin(checkinError) {
          if (checkinError) {
            return res.status(500).json({
              success: false,
              message: 'Không thể tạo check-in'
            });
          }

          if (membership.remaining_sessions !== null) {
            db.run(
              `
                UPDATE memberships
                SET remaining_sessions = remaining_sessions - 1
                WHERE id = ?
              `,
              [membership.id]
            );
          }

          return res.status(201).json({
            success: true,
            message: 'Check-in thành công',
            data: {
              checkin: {
                id: this.lastID,
                member_id,
                membership_id: membership.id,
                method,
                status: 'valid'
              },
              membership: {
                id: membership.id,
                remaining_sessions_before: membership.remaining_sessions,
                remaining_sessions_after:
                  membership.remaining_sessions === null
                    ? null
                    : Number(membership.remaining_sessions) - 1
              }
            }
          });
        }
      );
    }
  );
};

module.exports = {
  getAllCheckins,
  createCheckin
};