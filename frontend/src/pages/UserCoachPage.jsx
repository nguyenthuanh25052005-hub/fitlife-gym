import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyCoach, changeCoach } from "../services/userService";
import api from "../services/api";

export default function UserCoachPage() {
  const navigate = useNavigate();
  const [coach, setCoach] = useState(null);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [showChange, setShowChange] = useState(false);
  const user = JSON.parse(localStorage.getItem("fitlife_user") || "{}");

  const loadData = async () => {
    try {
      const [cResult, tResult] = await Promise.all([
        getMyCoach(),
        api.get("/trainers")
      ]);
      setCoach(cResult.data.coach);
      setTrainers(tResult.data.data.trainers.filter(t => t.status === "active"));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleChangeCoach = async (trainerId) => {
    try {
      await changeCoach({ trainer_id: trainerId });
      setMessage({ type: "success", text: "Đổi huấn luyện viên thành công!" });
      setShowChange(false);
      loadData();
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Đổi HLV thất bại" });
    }
  };

  const sidebarItems = [
    { label: "Tổng quan", icon: "📊", path: "/member/dashboard" },
    { label: "Hồ sơ", icon: "👤", path: "/member/profile" },
    { label: "Lịch tập", icon: "📅", path: "/member/schedule" },
    { label: "Gói tập", icon: "💳", path: "/member/packages" },
    { label: "HLV của tôi", icon: "🏋️", path: "/member/coach", active: true },
    { label: "Sức khỏe", icon: "❤️", path: "/member/health" },
  ];

  return (
    <main className="user-layout">
      <aside className="user-sidebar">
        <div className="user-sidebar-header">
          <div className="user-sidebar-logo">Fit<span>Life</span></div>
          <div className="user-sidebar-user">
            <div className="user-avatar-small">{user.full_name?.charAt(0) || "U"}</div>
            <div><strong>{user.full_name || "Hội viên"}</strong><span>{user.email}</span></div>
          </div>
        </div>
        <nav className="user-sidebar-nav">
          {sidebarItems.map((item) => (
            <a key={item.path} className={item.active ? "active" : ""} onClick={() => navigate(item.path)}>
              <span>{item.icon}</span>{item.label}
            </a>
          ))}
        </nav>
        <div className="user-sidebar-footer">
          <a onClick={() => navigate("/")}>🏠 Trang chủ</a>
          <a onClick={() => { localStorage.removeItem("fitlife_token"); localStorage.removeItem("fitlife_user"); window.location.href = "/member/login"; }}>🚪 Đăng xuất</a>
        </div>
      </aside>
      <section className="user-main">
        <header className="user-header">
          <div>
            <h1>Huấn luyện viên của tôi</h1>
            <p>Quản lý huấn luyện viên cá nhân</p>
          </div>
          <button className="primary-btn" onClick={() => setShowChange(!showChange)}>
            {showChange ? "Đóng" : "Đổi HLV"}
          </button>
        </header>
        <div className="user-content">
          {message.text && (
            <div className={`notification ${message.type}`} onClick={() => setMessage({ type: "", text: "" })}>
              {message.text}
            </div>
          )}

          {loading ? (
            <div className="loading-spinner"><div className="spinner"></div><p>Đang tải...</p></div>
          ) : coach ? (
            <div className="user-panel">
              <div className="panel-header"><h3>HLV hiện tại</h3></div>
              <div className="coach-detailed-card">
                <div className="coach-avatar-big">{coach.full_name?.charAt(0)}</div>
                <div className="coach-info-detailed">
                  <h2>{coach.full_name}</h2>
                  <div className="coach-tags">
                    <span className="coach-tag">Mã: {coach.trainer_code}</span>
                    <span className="coach-tag">{coach.specialty || "Chuyên gia thể hình"}</span>
                    <span className="coach-tag">{coach.experience_years || 0} năm kinh nghiệm</span>
                  </div>
                  <p className="coach-bio">{coach.bio || "Huấn luyện viên chuyên nghiệp tại FitLife Gym"}</p>
                  <div className="coach-contact">
                    <div>📧 {coach.email}</div>
                    <div>📞 {coach.phone || "Chưa cập nhật"}</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="user-panel">
              <div className="panel-header"><h3>HLV hiện tại</h3></div>
              <div className="empty-state">
                <p>Bạn chưa có huấn luyện viên nào.</p>
                <button className="primary-btn" onClick={() => setShowChange(true)}>Chọn HLV ngay</button>
              </div>
            </div>
          )}

          {showChange && (
            <div className="user-panel">
              <div className="panel-header"><h3>Danh sách huấn luyện viên</h3></div>
              <div className="trainers-grid">
                {trainers.map((t) => (
                  <div className={`trainer-card ${coach?.id === t.id ? "selected" : ""}`} key={t.id}>
                    <div className="trainer-avatar">{t.full_name?.charAt(0)}</div>
                    <div className="trainer-card-info">
                      <strong>{t.full_name}</strong>
                      <span>{t.specialty || "Chuyên gia thể hình"}</span>
                      <small>{t.experience_years || 0} năm KN</small>
                    </div>
                    {coach?.id === t.id ? (
                      <span className="current-badge">HLV hiện tại</span>
                    ) : (
                      <button className="primary-btn small" onClick={() => handleChangeCoach(t.id)}>Chọn</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}