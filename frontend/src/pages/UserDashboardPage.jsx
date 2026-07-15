import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserDashboard } from "../services/userService";

export default function UserDashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("fitlife_user") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("fitlife_token");
    localStorage.removeItem("fitlife_user");
    window.location.href = "/member/login";
  };

  useEffect(() => {
    const load = async () => {
      try {
        const result = await getUserDashboard();
        setData(result.data);
      } catch (error) {
        console.error("Dashboard error:", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const menuItems = [
    { label: "Tổng quan", icon: "📊", path: "/member/dashboard", active: true },
    { label: "Hồ sơ", icon: "👤", path: "/member/profile" },
    { label: "Lịch tập", icon: "📅", path: "/member/schedule" },
    { label: "Gói tập", icon: "💳", path: "/member/packages" },
    { label: "HLV của tôi", icon: "🏋️", path: "/member/coach" },
    { label: "Sức khỏe", icon: "❤️", path: "/member/health" },
  ];

  return (
    <main className="user-layout">
      <aside className="user-sidebar">
        <div className="user-sidebar-header">
          <div className="user-sidebar-logo">Fit<span>Life</span></div>
          <div className="user-sidebar-user">
            <div className="user-avatar-small">{user.full_name?.charAt(0) || "U"}</div>
            <div>
              <strong>{user.full_name || "Hội viên"}</strong>
              <span>{user.email}</span>
            </div>
          </div>
        </div>
        <nav className="user-sidebar-nav">
          {menuItems.map((item) => (
            <a
              key={item.path}
              className={item.active ? "active" : ""}
              onClick={() => navigate(item.path)}
            >
              <span>{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>
        <div className="user-sidebar-footer">
          <a onClick={() => navigate("/")}>🏠 Trang chủ</a>
          <a onClick={handleLogout}>🚪 Đăng xuất</a>
        </div>
      </aside>
      <section className="user-main">
        <header className="user-header">
          <div>
            <h1>Xin chào, {user.full_name || "Hội viên"}! 👋</h1>
            <p>Chào mừng bạn đến với FitLife Gym</p>
          </div>
          
        </header>

        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : (
          <div className="user-content">
            {/* Stats Cards */}
            <div className="user-stats-grid">
              <div className="user-stat-card membership-card">
                <div className="stat-icon">💳</div>
                <div className="stat-info">
                  <span>Gói tập hiện tại</span>
                  <strong>{data?.membership?.plan_name || "Chưa có gói"}</strong>
                  {data?.membership?.end_date && (
                    <small>Hết hạn: {data.membership.end_date}</small>
                  )}
                </div>
              </div>
              <div className="user-stat-card class-card">
                <div className="stat-icon">📅</div>
                <div className="stat-info">
                  <span>Lịch tập sắp tới</span>
                  <strong>{data?.upcoming_classes?.length || 0} buổi</strong>
                  {data?.upcoming_classes?.length > 0 && (
                    <small>{data.upcoming_classes[0]?.class_name}</small>
                  )}
                </div>
              </div>
              <div className="user-stat-card checkin-card">
                <div className="stat-icon">✅</div>
                <div className="stat-info">
                  <span>Check-in tháng này</span>
                  <strong>{data?.checkin_this_month || 0} lần</strong>
                  <small>Tiếp tục duy trì!</small>
                </div>
              </div>
              <div className="user-stat-card health-card">
                <div className="stat-icon">❤️</div>
                <div className="stat-info">
                  <span>BMI hiện tại</span>
                  <strong>{data?.body_metrics?.bmi ? `${data.body_metrics.bmi}` : "Chưa có"}</strong>
                  <small>Cập nhật trong hồ sơ</small>
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="user-dashboard-grid">
              {/* Active Membership */}
              <div className="user-panel">
                <div className="panel-header">
                  <h3>Gói tập đang hoạt động</h3>
                  <button className="panel-btn" onClick={() => navigate("/member/packages")}>
                    Quản lý gói
                  </button>
                </div>
                {data?.membership ? (
                  <div className="membership-info">
                    <div className="membership-plan-badge" style={{background: 'linear-gradient(135deg, #667eea, #764ba2)'}}>
                      <strong>{data.membership.plan_name}</strong>
                      <span>{data.membership.plan_type}</span>
                    </div>
                    <div className="membership-details">
                      <div><span>Ngày bắt đầu:</span> {data.membership.start_date}</div>
                      <div><span>Ngày kết thúc:</span> {data.membership.end_date}</div>
                      <div><span>Trạng thái:</span> <span className="status-active">Đang hoạt động</span></div>
                    </div>
                  </div>
                ) : (
                  <div className="empty-state">
                    <p>Bạn chưa đăng ký gói tập nào.</p>
                    <button className="primary-btn" onClick={() => navigate("/member/packages")}>
                      Đăng ký ngay
                    </button>
                  </div>
                )}
              </div>

              {/* Upcoming Classes */}
              <div className="user-panel">
                <div className="panel-header">
                  <h3>Lịch tập sắp tới</h3>
                  <button className="panel-btn" onClick={() => navigate("/member/schedule")}>
                    Xem lịch
                  </button>
                </div>
                {data?.upcoming_classes?.length > 0 ? (
                  <div className="upcoming-list">
                    {data.upcoming_classes.map((cls) => (
                      <div className="upcoming-item" key={cls.id}>
                        <div className="upcoming-time">
                          <strong>{cls.start_time?.slice(11, 16)}</strong>
                          <span>{cls.start_time?.slice(0, 10)}</span>
                        </div>
                        <div className="upcoming-info">
                          <strong>{cls.class_name}</strong>
                          <span>Phòng: {cls.room}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <p>Không có lịch tập nào sắp tới.</p>
                    <button className="primary-btn" onClick={() => navigate("/member/schedule")}>
                      Đặt lịch ngay
                    </button>
                  </div>
                )}
              </div>

              {/* Coach Info */}
              <div className="user-panel">
                <div className="panel-header">
                  <h3>Huấn luyện viên</h3>
                  <button className="panel-btn" onClick={() => navigate("/member/coach")}>
                    Chi tiết
                  </button>
                </div>
                {data?.coach ? (
                  <div className="coach-mini-card">
                    <div className="coach-avatar-large">{data.coach.full_name?.charAt(0)}</div>
                    <div>
                      <strong>{data.coach.full_name}</strong>
                      <span>{data.coach.specialty || "Chuyên gia thể hình"}</span>
                    </div>
                  </div>
                ) : (
                  <div className="empty-state">
                    <p>Bạn chưa có huấn luyện viên.</p>
                    <button className="primary-btn" onClick={() => navigate("/member/coach")}>
                      Chọn HLV
                    </button>
                  </div>
                )}
              </div>

              {/* Health Quick */}
              <div className="user-panel">
                <div className="panel-header">
                  <h3>Sức khỏe của bạn</h3>
                  <button className="panel-btn" onClick={() => navigate("/member/health")}>
                    Chi tiết
                  </button>
                </div>
                {data?.body_metrics ? (
                  <div className="health-mini">
                    <div className="health-stat">
                      <span>Cao</span>
                      <strong>{data.body_metrics.height}cm</strong>
                    </div>
                    <div className="health-stat">
                      <span>Nặng</span>
                      <strong>{data.body_metrics.weight}kg</strong>
                    </div>
                    <div className="health-stat">
                      <span>BMI</span>
                      <strong>{data.body_metrics.bmi}</strong>
                    </div>
                  </div>
                ) : (
                  <div className="empty-state">
                    <p>Chưa có dữ liệu sức khỏe.</p>
                    <button className="primary-btn" onClick={() => navigate("/member/health")}>
                      Cập nhật ngay
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}