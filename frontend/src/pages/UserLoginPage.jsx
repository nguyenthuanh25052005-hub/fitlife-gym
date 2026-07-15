import { useState } from "react";
import { Link } from "react-router-dom";
import { login } from "../services/authService";

export default function UserLoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.email.trim() || !form.password.trim()) {
      setError("Vui lòng nhập đầy đủ email và mật khẩu.");
      return;
    }
    try {
      setIsSubmitting(true);
      const result = await login(form.email.trim(), form.password);
      const user = result.data.user;
      if (user.role !== "member") {
        setError("Tài khoản này không phải hội viên. Vui lòng dùng tài khoản hội viên.");
        return;
      }
      localStorage.setItem("fitlife_token", result.data.token);
      localStorage.setItem("fitlife_user", JSON.stringify(user));
      window.location.href = "/member/dashboard";
    } catch (error) {
      setError(error.response?.data?.message || "Không thể kết nối đến máy chủ.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="user-login-page">
      <div className="user-login-container">
        <div className="user-login-left">
          <div className="user-login-brand">
            <span className="brand-icon">💪</span>
            <h1>Fit<span>Life</span></h1>
          </div>
          <div className="user-login-hero">
            <h2>Chào mừng bạn quay trở lại!</h2>
            <p>Đăng nhập để tiếp tục hành trình tập luyện và chinh phục mục tiêu sức khỏe của bạn.</p>
            <div className="user-login-features">
              <div className="feature-item">
                <span className="feature-icon">📅</span>
                <span>Quản lý lịch tập</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🏋️</span>
                <span>Huấn luyện viên riêng</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📊</span>
                <span>Theo dõi sức khỏe</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">💳</span>
                <span>Thanh toán online</span>
              </div>
            </div>
          </div>
          <div className="user-login-footer">
            <Link to="/">← Về trang chủ FitLife</Link>
          </div>
        </div>
        <div className="user-login-right">
          <div className="user-login-form-wrap">
            <div className="user-login-header">
              <h2>Đăng nhập</h2>
              <p>Chưa có tài khoản? <Link to="/member/register">Đăng ký ngay</Link></p>
            </div>
            <form onSubmit={handleSubmit} className="user-login-form">
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Mật khẩu</label>
                <div className="password-input-wrap">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                  />
                  <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>
              {error && <div className="form-error">{error}</div>}
              <button type="submit" className="user-login-btn" disabled={isSubmitting}>
                {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
              </button>
            </form>
            <div className="user-login-divider">
              <span>hoặc</span>
            </div>
            <div className="user-login-demo">
              <p>Tài khoản demo hội viên:</p>
              <div className="demo-account-card" onClick={() => setForm({ email: "ha.member@fitlife.vn", password: "member123" })}>
                <strong>ha.member@fitlife.vn</strong>
                <span>Mật khẩu: member123</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}