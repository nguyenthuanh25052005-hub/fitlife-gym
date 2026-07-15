import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

export default function UserRegisterPage() {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    gender: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.full_name.trim() || !form.email.trim() || !form.password.trim()) {
      setError("Vui lòng điền đầy đủ thông tin bắt buộc.");
      return;
    }
    if (form.password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await api.post("/auth/register", {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone || undefined,
        gender: form.gender || undefined
      });

      const result = response.data;
      if (result.success) {
        localStorage.setItem("fitlife_token", result.data.token);
        localStorage.setItem("fitlife_user", JSON.stringify(result.data.user));
        setSuccess("Đăng ký thành công! Đang chuyển hướng...");
        setTimeout(() => {
          window.location.href = "/member/dashboard";
        }, 1500);
      }
    } catch (error) {
      setError(error.response?.data?.message || "Không thể đăng ký. Vui lòng thử lại.");
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
            <h2>Bắt đầu hành trình của bạn!</h2>
            <p>Đăng ký ngay để trải nghiệm hệ thống phòng tập hiện đại với đầy đủ tiện ích.</p>
            <div className="user-login-features">
              <div className="feature-item">
                <span className="feature-icon">✅</span>
                <span>Đăng ký nhanh chóng</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🆓</span>
                <span>Dùng thử miễn phí</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🔒</span>
                <span>Bảo mật thông tin</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🎯</span>
                <span>Lộ trình cá nhân hóa</span>
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
              <h2>Đăng ký tài khoản</h2>
              <p>Đã có tài khoản? <Link to="/member/login">Đăng nhập</Link></p>
            </div>
            <form onSubmit={handleSubmit} className="user-login-form">
              <div className="form-group">
                <label htmlFor="full_name">Họ và tên *</label>
                <input id="full_name" name="full_name" type="text" placeholder="Nguyễn Văn A" value={form.full_name} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input id="email" name="email" type="email" placeholder="your@email.com" value={form.email} onChange={handleChange} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="password">Mật khẩu *</label>
                  <input id="password" name="password" type="password" placeholder="Ít nhất 6 ký tự" value={form.password} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label htmlFor="confirmPassword">Xác nhận mật khẩu *</label>
                  <input id="confirmPassword" name="confirmPassword" type="password" placeholder="Nhập lại mật khẩu" value={form.confirmPassword} onChange={handleChange} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phone">Số điện thoại</label>
                  <input id="phone" name="phone" type="tel" placeholder="090xxxxxxx" value={form.phone} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label htmlFor="gender">Giới tính</label>
                  <select id="gender" name="gender" value={form.gender} onChange={handleChange}>
                    <option value="">Chọn giới tính</option>
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
              </div>
              {error && <div className="form-error">{error}</div>}
              {success && <div className="form-success">{success}</div>}
              <button type="submit" className="user-login-btn" disabled={isSubmitting}>
                {isSubmitting ? "Đang đăng ký..." : "Đăng ký ngay"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}