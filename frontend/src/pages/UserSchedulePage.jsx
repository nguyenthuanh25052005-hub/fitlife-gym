import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyBookings, bookClass, cancelBooking } from "../services/userService";
import api from "../services/api";

export default function UserSchedulePage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [showBooking, setShowBooking] = useState(false);
  const user = JSON.parse(localStorage.getItem("fitlife_user") || "{}");

  const loadData = async () => {
    try {
      const [bResult, cResult] = await Promise.all([
        getMyBookings(),
        api.get("/classes")
      ]);
      setBookings(bResult.data.bookings);
      setClasses(cResult.data.data.classes.filter(c => c.status === "scheduled"));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleBook = async (classId) => {
    try {
      await bookClass({ class_id: classId });
      setMessage({ type: "success", text: "Đăng ký lớp thành công!" });
      loadData();
      setShowBooking(false);
    } catch {
      setMessage({ type: "error", text: error.response?.data?.message || "Đăng ký thất bại" });
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Bạn có chắc muốn hủy đăng ký lớp này?")) return;
    try {
      await cancelBooking(id);
      setMessage({ type: "success", text: "Hủy đăng ký thành công!" });
      loadData();
    } catch {
      setMessage({ type: "error", text: "Hủy thất bại" });
    }
  };

  const sidebarItems = [
    { label: "Tổng quan", icon: "📊", path: "/member/dashboard" },
    { label: "Hồ sơ", icon: "👤", path: "/member/profile" },
    { label: "Lịch tập", icon: "📅", path: "/member/schedule", active: true },
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
            <h1>Lịch tập</h1>
            <p>Quản lý lịch tập và đăng ký lớp học</p>
          </div>
          <button className="primary-btn" onClick={() => setShowBooking(!showBooking)}>
            {showBooking ? "Đóng" : "+ Đặt lịch mới"}
          </button>
        </header>
        <div className="user-content">
          {message.text && (
            <div className={`notification ${message.type}`} onClick={() => setMessage({ type: "", text: "" })}>
              {message.text}
            </div>
          )}

          {showBooking && (
            <div className="user-panel">
              <div className="panel-header"><h3>Đăng ký lớp học</h3></div>
              <div className="class-grid">
                {classes.map((cls) => (
                  <div className="class-card" key={cls.id}>
                    <div className="class-card-header">
                      <strong>{cls.name}</strong>
                      <span className="class-type">{cls.class_type}</span>
                    </div>
                    <div className="class-card-body">
                      <div>🕐 {cls.start_time?.slice(11, 16)} - {cls.end_time?.slice(11, 16)}</div>
                      <div>📅 {cls.start_time?.slice(0, 10)}</div>
                      <div>🏠 Phòng {cls.room}</div>
                      <div>👥 Sức chứa: {cls.capacity}</div>
                    </div>
                    <button className="primary-btn full-width" onClick={() => handleBook(cls.id)}>
                      Đăng ký
                    </button>
                  </div>
                ))}
                {classes.length === 0 && <p className="empty-text">Hiện chưa có lớp học nào khả dụng.</p>}
              </div>
            </div>
          )}

          <div className="user-panel">
            <div className="panel-header"><h3>Lịch sử đăng ký</h3></div>
            {loading ? (
              <div className="loading-spinner"><div className="spinner"></div></div>
            ) : bookings.length === 0 ? (
              <div className="empty-state"><p>Bạn chưa đăng ký lớp học nào.</p></div>
            ) : (
              <div className="booking-list">
                <table className="booking-table">
                  <thead>
                    <tr>
                      <th>Lớp học</th>
                      <th>Ngày</th>
                      <th>Giờ</th>
                      <th>HLV</th>
                      <th>Trạng thái</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b) => (
                      <tr key={b.id}>
                        <td><strong>{b.class_name}</strong></td>
                        <td>{b.start_time?.slice(0, 10)}</td>
                        <td>{b.start_time?.slice(11, 16)}</td>
                        <td>{b.trainer_name || "Chưa có"}</td>
                        <td><span className={`booking-status ${b.status}`}>{b.status === "booked" ? "Đã đăng ký" : b.status === "completed" ? "Hoàn thành" : b.status === "cancelled" ? "Đã hủy" : b.status}</span></td>
                        <td>
                          {b.status === "booked" && (
                            <button className="danger-btn small" onClick={() => handleCancel(b.id)}>Hủy</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}