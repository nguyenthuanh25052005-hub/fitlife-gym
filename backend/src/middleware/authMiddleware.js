const jwt = require("jsonwebtoken");
const db = require("../database/db");

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, code: "AUTH_REQUIRED", message: "Authentication required" });
  }

  const token = authHeader.split(" ")[1];
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (_error) {
    return res.status(401).json({ success: false, code: "TOKEN_INVALID", message: "Invalid or expired token" });
  }

  db.get("SELECT id, role, status FROM users WHERE id = ?", [decoded.id], (error, user) => {
    if (error) {
      return res.status(500).json({ success: false, message: "Không thể xác thực tài khoản" });
    }
    if (!user) {
      return res.status(401).json({ success: false, code: "ACCOUNT_NOT_FOUND", message: "Tài khoản không còn tồn tại" });
    }
    if (user.status !== "active") {
      return res.status(403).json({ success: false, code: "ACCOUNT_DISABLED", message: "Tài khoản hiện không hoạt động" });
    }

    req.user = { id: user.id, role: user.role };
    return next();
  });
};

module.exports = authenticate;
