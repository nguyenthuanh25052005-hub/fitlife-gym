import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/authService";

export default function LoginPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: localStorage.getItem("fitlife_email") || "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.email.trim() || !form.password.trim()) {
      setError("Vui lòng nhập đầy đủ email và mật khẩu.");
      return;
    }

    try {
      setIsSubmitting(true);

      const result = await login(
        form.email.trim(),
        form.password
      );

      localStorage.setItem(
        "fitlife_token",
        result.data.token
      );

      localStorage.setItem(
        "fitlife_user",
        JSON.stringify(result.data.user)
      );

      if (remember) {
        localStorage.setItem(
          "fitlife_email",
          form.email.trim()
        );
      } else {
        localStorage.removeItem("fitlife_email");
      }

      window.location.href = "/dashboard";
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Không thể kết nối đến máy chủ."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemoAccount = () => {
    setForm({
      email: "admin@fitlife.vn",
      password: "admin123",
    });

    setError("");
  };

  return (
    <main className="login-page">
      <section className="login-showcase">
        <button
          className="login-brand"
          type="button"
          onClick={() => navigate("/")}
        >
          Fit<span>Life</span>
        </button>

        <div className="login-showcase-content">
          <div className="login-badge">
            ● NỀN TẢNG QUẢN LÝ PHÒNG TẬP
          </div>

          <h1>
            Vận hành phòng tập
            <br />
            thông minh hơn với
            <br />
            <span>FitLife</span>
          </h1>

          <p>
            Quản lý hội viên, gói tập, thanh toán,
            huấn luyện viên và check-in trên một nền
            tảng duy nhất.
          </p>

          <div className="login-preview">
            <div className="preview-top">
              <div>
                <small>TỔNG QUAN HÔM NAY</small>
                <strong>Dashboard</strong>
              </div>

              <span>● Trực tuyến</span>
            </div>

            <div className="preview-stats">
              <article>
                <small>Hội viên</small>
                <strong>1,248</strong>
                <span>↗ 12.5%</span>
              </article>

              <article>
                <small>Check-in</small>
                <strong>326</strong>
                <span>↗ 8.2%</span>
              </article>

              <article>
                <small>Doanh thu</small>
                <strong>84.2M</strong>
                <span>↗ 16.4%</span>
              </article>
            </div>

            <div className="preview-chart">
              <div className="chart-info">
                <span>Doanh thu 7 ngày gần nhất</span>
                <strong>168.5 triệu</strong>
              </div>

              <div className="chart-bars">
                <i style={{ height: "34%" }}></i>
                <i style={{ height: "52%" }}></i>
                <i style={{ height: "44%" }}></i>
                <i style={{ height: "70%" }}></i>
                <i style={{ height: "58%" }}></i>
                <i style={{ height: "82%" }}></i>
                <i style={{ height: "100%" }}></i>
              </div>
            </div>
          </div>
        </div>

        <div className="login-showcase-footer">
          <span>✓ Bảo mật dữ liệu</span>
          <span>✓ Hỗ trợ 24/7</span>
          <span>✓ Quản lý tập trung</span>
        </div>
      </section>

      <section className="login-panel">
        <button
          className="login-back"
          type="button"
          onClick={() => navigate("/")}
        >
          ← Về trang chủ
        </button>

        <div className="login-form-wrap">
          <div className="login-mobile-brand">
            Fit<span>Life</span>
          </div>

          <div className="login-heading">
            <span>CHÀO MỪNG TRỞ LẠI</span>

            <h2>Đăng nhập FitLife</h2>

            <p>
              Truy cập hệ thống quản lý và tiếp tục
              vận hành phòng tập của bạn.
            </p>
          </div>

          <form
            className="login-form"
            onSubmit={handleSubmit}
          >
            <label htmlFor="email">
              Email đăng nhập
            </label>

            <div className="login-input-wrap">
              <span>✉</span>

              <input
                id="email"
                name="email"
                type="email"
                placeholder="admin@fitlife.vn"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </div>

            <div className="login-password-row">
              <label htmlFor="password">
                Mật khẩu
              </label>

              <button type="button">
                Quên mật khẩu?
              </button>
            </div>

            <div className="login-input-wrap">
              <span>⌑</span>

              <input
                id="password"
                name="password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="Nhập mật khẩu"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
              />

              <button
                className="show-password"
                type="button"
                onClick={() =>
                  setShowPassword(
                    (current) => !current
                  )
                }
              >
                {showPassword ? "Ẩn" : "Hiện"}
              </button>
            </div>

            <label className="remember-row">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) =>
                  setRemember(event.target.checked)
                }
              />

              <span>
                Ghi nhớ đăng nhập trên thiết bị này
              </span>
            </label>

            {error && (
              <div className="login-error">
                {error}
              </div>
            )}

            <button
              className="login-submit"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Đang đăng nhập..."
                : "Đăng nhập"}

              <span>→</span>
            </button>
          </form>

          <div className="login-demo-account">
            <div>
              <span>⚡</span>

              <div>
                <strong>Tài khoản demo</strong>

                <p>
                  Dùng để đăng nhập và kiểm tra
                  hệ thống.
                </p>
              </div>
            </div>

            <small>
              Email: admin@fitlife.vn
              <br />
              Mật khẩu: admin123
            </small>

            <button
              type="button"
              onClick={fillDemoAccount}
            >
              Điền tài khoản demo
            </button>
          </div>

          <p className="login-register">
            Chưa có tài khoản?

            <button type="button">
              Đăng ký dùng thử miễn phí
            </button>
          </p>
        </div>

        <footer className="login-copyright">
          © 2026 FitLife Gym Management System
        </footer>
      </section>
    </main>
  );
}