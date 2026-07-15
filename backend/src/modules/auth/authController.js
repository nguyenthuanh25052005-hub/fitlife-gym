const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../../database/db");

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d",
    },
  );
};

const login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email và mật khẩu là bắt buộc",
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  db.get(
    "SELECT * FROM users WHERE email = ?",
    [normalizedEmail],
    async (error, user) => {
      if (error) {
        return res.status(500).json({
          success: false,
          message: "Lỗi truy vấn cơ sở dữ liệu",
        });
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Email hoặc mật khẩu không chính xác",
        });
      }

      if (user.status !== "active") {
        return res.status(403).json({
          success: false,
          message: "Tài khoản hiện không hoạt động",
        });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Email hoặc mật khẩu không chính xác",
        });
      }

      const token = generateToken(user);

      return res.status(200).json({
        success: true,
        message: "Đăng nhập thành công",
        data: {
          token,
          user: {
            id: user.id,
            full_name: user.full_name,
            email: user.email,
            phone: user.phone,
            avatar_url: user.avatar_url,
            role: user.role,
            status: user.status,
          },
        },
      });
    },
  );
};

const register = async (req, res) => {
  try {
    const { full_name, email, password, phone, gender, date_of_birth } =
      req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Họ tên, email và mật khẩu là bắt buộc",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu phải có ít nhất 6 ký tự",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    db.get(
      "SELECT id FROM users WHERE email = ?",
      [normalizedEmail],
      async (error, existingUser) => {
        if (error) {
          return res.status(500).json({
            success: false,
            message: "Lỗi truy vấn cơ sở dữ liệu",
          });
        }

        if (existingUser) {
          return res.status(409).json({
            success: false,
            message: "Email đã được sử dụng",
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
                message: "Không thể tạo tài khoản",
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
                  status
                )
                VALUES (?, ?, ?, ?, 'active')
              `,
              [userId, memberCode, gender || null, date_of_birth || null],
              function createMember(memberError) {
                if (memberError) {
                  db.run("DELETE FROM users WHERE id = ?", [userId]);

                  return res.status(500).json({
                    success: false,
                    message: "Không thể tạo hồ sơ hội viên",
                  });
                }

                const newUser = {
                  id: userId,
                  role: "member",
                };

                const token = generateToken(newUser);

                return res.status(201).json({
                  success: true,
                  message: "Đăng ký hội viên thành công",
                  data: {
                    token,
                    user: {
                      id: userId,
                      full_name: full_name.trim(),
                      email: normalizedEmail,
                      phone: phone || null,
                      role: "member",
                    },
                    member: {
                      id: this.lastID,
                      member_code: memberCode,
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

const getMe = (req, res) => {
  db.get(
    `
      SELECT
        id,
        full_name,
        email,
        phone,
        avatar_url,
        role,
        status,
        created_at
      FROM users
      WHERE id = ?
    `,
    [req.user.id],
    (error, user) => {
      if (error) {
        return res.status(500).json({
          success: false,
          message: "Lỗi truy vấn cơ sở dữ liệu",
        });
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          code: "ACCOUNT_NOT_FOUND",
          message: "Tài khoản không còn tồn tại",
        });
      }

      if (user.status !== "active") {
        return res.status(403).json({
          success: false,
          code: "ACCOUNT_DISABLED",
          message: "Tài khoản hiện không hoạt động",
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          user,
        },
      });
    },
  );
};

module.exports = {
  login,
  register,
  getMe,
};
