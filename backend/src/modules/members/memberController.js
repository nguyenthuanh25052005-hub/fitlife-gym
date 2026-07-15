const bcrypt = require("bcryptjs");
const db = require("../../database/db");

const getAllMembers = (req, res) => {
  const { search = "", status = "", page = 1, limit = 10 } = req.query;

  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
  const offset = (safePage - 1) * safeLimit;

  const conditions = [];
  const params = [];

  if (search.trim()) {
    conditions.push(`
      (
        users.full_name LIKE ?
        OR users.email LIKE ?
        OR users.phone LIKE ?
        OR members.member_code LIKE ?
      )
    `);

    const keyword = `%${search.trim()}%`;
    params.push(keyword, keyword, keyword, keyword);
  }

  if (status) {
    conditions.push("members.status = ?");
    params.push(status);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  const countSql = `
    SELECT COUNT(*) AS total
    FROM members
    JOIN users ON members.user_id = users.id
    ${whereClause}
  `;

  const dataSql = `
    SELECT
      members.id,
      members.member_code,
      members.gender,
      members.date_of_birth,
      members.join_date,
      members.status,
      users.full_name,
      users.email,
      users.phone,
      users.avatar_url,
      memberships.id AS membership_id,
      memberships.end_date,
      memberships.status AS membership_status,
      plans.name AS plan_name
    FROM members
    JOIN users
      ON members.user_id = users.id
    LEFT JOIN memberships
      ON memberships.id = (
        SELECT id
        FROM memberships AS latest_membership
        WHERE latest_membership.member_id = members.id
        ORDER BY latest_membership.id DESC
        LIMIT 1
      )
    LEFT JOIN plans
      ON memberships.plan_id = plans.id
    ${whereClause}
    ORDER BY members.id DESC
    LIMIT ? OFFSET ?
  `;

  db.get(countSql, params, (countError, countResult) => {
    if (countError) {
      return res.status(500).json({
        success: false,
        message: "Không thể đếm danh sách hội viên",
      });
    }

    db.all(dataSql, [...params, safeLimit, offset], (dataError, members) => {
      if (dataError) {
        return res.status(500).json({
          success: false,
          message: "Không thể tải danh sách hội viên",
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          members,
          pagination: {
            page: safePage,
            limit: safeLimit,
            total: countResult.total,
            total_pages: Math.ceil(countResult.total / safeLimit),
          },
        },
      });
    });
  });
};

const getMemberById = (req, res) => {
  const { id } = req.params;

  const profileSql = `
    SELECT
      members.*,
      users.full_name,
      users.email,
      users.phone,
      users.avatar_url,
      users.created_at AS account_created_at
    FROM members
    JOIN users
      ON members.user_id = users.id
    WHERE members.id = ?
  `;

  db.get(profileSql, [id], (profileError, member) => {
    if (profileError) {
      return res.status(500).json({
        success: false,
        message: "Không thể tải hồ sơ hội viên",
      });
    }

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy hội viên",
      });
    }

    const queries = [
      new Promise((resolve, reject) => {
        db.all(
          `
            SELECT
              memberships.*,
              plans.name AS plan_name,
              plans.plan_type,
              plans.price
            FROM memberships
            JOIN plans
              ON memberships.plan_id = plans.id
            WHERE memberships.member_id = ?
            ORDER BY memberships.id DESC
          `,
          [id],
          (error, rows) => (error ? reject(error) : resolve(rows)),
        );
      }),

      new Promise((resolve, reject) => {
        db.all(
          `
            SELECT *
            FROM payments
            WHERE member_id = ?
            ORDER BY payment_date DESC
          `,
          [id],
          (error, rows) => (error ? reject(error) : resolve(rows)),
        );
      }),

      new Promise((resolve, reject) => {
        db.all(
          `
            SELECT *
            FROM checkins
            WHERE member_id = ?
            ORDER BY checkin_time DESC
            LIMIT 20
          `,
          [id],
          (error, rows) => (error ? reject(error) : resolve(rows)),
        );
      }),

      new Promise((resolve, reject) => {
        db.all(
          `
            SELECT *
            FROM body_metrics
            WHERE member_id = ?
            ORDER BY recorded_at DESC
          `,
          [id],
          (error, rows) => (error ? reject(error) : resolve(rows)),
        );
      }),
    ];

    Promise.all(queries)
      .then(([memberships, payments, checkins, bodyMetrics]) => {
        return res.status(200).json({
          success: true,
          data: {
            profile: member,
            memberships,
            payments,
            checkins,
            body_metrics: bodyMetrics,
          },
        });
      })
      .catch(() => {
        return res.status(500).json({
          success: false,
          message: "Không thể tải hồ sơ hội viên 360°",
        });
      });
  });
};

const createMember = async (req, res) => {
  try {
    const {
      full_name,
      email,
      password = "member123",
      phone,
      gender,
      date_of_birth,
      address,
      emergency_contact,
      health_note,
    } = req.body;

    if (!full_name || !email) {
      return res.status(400).json({
        success: false,
        message: "Họ tên và email là bắt buộc",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    db.get(
      "SELECT id FROM users WHERE email = ?",
      [normalizedEmail],
      async (findError, existingUser) => {
        if (findError) {
          return res.status(500).json({
            success: false,
            message: "Lỗi truy vấn cơ sở dữ liệu",
          });
        }

        if (existingUser) {
          return res.status(409).json({
            success: false,
            message: "Email đã tồn tại",
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
            VALUES (?, ?, ?, 'member', ?, 'active')
          `,
          [full_name.trim(), normalizedEmail, hashedPassword, phone || null],
          function createUser(userError) {
            if (userError) {
              return res.status(500).json({
                success: false,
                message: "Không thể tạo tài khoản hội viên",
              });
            }

            const userId = this.lastID;
            const memberCode = `MB${String(userId).padStart(4, "0")}`;

            db.run(
              `
                INSERT INTO members (
                  user_id,
                  member_code,
                  gender,
                  date_of_birth,
                  address,
                  emergency_contact,
                  health_note,
                  status
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
              `,
              [
                userId,
                memberCode,
                gender || null,
                date_of_birth || null,
                address || null,
                emergency_contact || null,
                health_note || null,
              ],
              function createProfile(memberError) {
                if (memberError) {
                  db.run("DELETE FROM users WHERE id = ?", [userId]);

                  return res.status(500).json({
                    success: false,
                    message: "Không thể tạo hồ sơ hội viên",
                  });
                }

                return res.status(201).json({
                  success: true,
                  message: "Tạo hội viên thành công",
                  data: {
                    member: {
                      id: this.lastID,
                      user_id: userId,
                      member_code: memberCode,
                      full_name: full_name.trim(),
                      email: normalizedEmail,
                    },
                  },
                });
              },
            );
          },
        );
      },
    );
  } catch (_error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống",
    });
  }
};

const updateMember = (req, res) => {
  const { id } = req.params;

  const {
    full_name,
    phone,
    gender,
    date_of_birth,
    address,
    emergency_contact,
    health_note,
    status,
  } = req.body;

  db.get(
    "SELECT user_id FROM members WHERE id = ?",
    [id],
    (findError, member) => {
      if (findError) {
        return res.status(500).json({
          success: false,
          message: "Lỗi truy vấn cơ sở dữ liệu",
        });
      }

      if (!member) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy hội viên",
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
        [full_name || null, phone || null, member.user_id],
        (userError) => {
          if (userError) {
            return res.status(500).json({
              success: false,
              message: "Không thể cập nhật tài khoản",
            });
          }

          db.run(
            `
              UPDATE members
              SET
                gender = COALESCE(?, gender),
                date_of_birth = COALESCE(?, date_of_birth),
                address = COALESCE(?, address),
                emergency_contact = COALESCE(?, emergency_contact),
                health_note = COALESCE(?, health_note),
                status = COALESCE(?, status)
              WHERE id = ?
            `,
            [
              gender || null,
              date_of_birth || null,
              address || null,
              emergency_contact || null,
              health_note || null,
              status || null,
              id,
            ],
            (updateError) => {
              if (updateError) {
                return res.status(500).json({
                  success: false,
                  message: "Không thể cập nhật hội viên",
                });
              }

              return res.status(200).json({
                success: true,
                message: "Cập nhật hội viên thành công",
              });
            },
          );
        },
      );
    },
  );
};

const deleteMember = (req, res) => {
  const { id } = req.params;

  db.get(
    "SELECT user_id FROM members WHERE id = ?",
    [id],
    (findError, member) => {
      if (findError) {
        return res.status(500).json({
          success: false,
          message: "Lỗi truy vấn cơ sở dữ liệu",
        });
      }

      if (!member) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy hội viên",
        });
      }

      db.run(
        "DELETE FROM users WHERE id = ?",
        [member.user_id],
        (deleteError) => {
          if (deleteError) {
            return res.status(500).json({
              success: false,
              message: "Không thể xóa hội viên",
            });
          }

          return res.status(200).json({
            success: true,
            message: "Xóa hội viên thành công",
          });
        },
      );
    },
  );
};

module.exports = {
  getAllMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
};
