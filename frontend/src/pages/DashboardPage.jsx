import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDashboard } from "../services/dashboardService";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem("fitlife_token");
    localStorage.removeItem("fitlife_user");
    window.location.href = "/login";
  };

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const result = await getDashboard();
        setDashboard(result.data);
      } catch (error) {
        console.error("Dashboard error:", error);
        alert(error.response?.data?.message || "Không thể tải dashboard.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const stats = useMemo(() => {
    const overview = dashboard?.overview || {};
    const finance = dashboard?.finance || {};
    const operations = dashboard?.operations || {};

    return [
      {
        label: "Tổng hội viên",
        value: overview.total_members || 0,
        change: "Dữ liệu thật",
        icon: "👥",
      },
      {
        label: "HLV đang hoạt động",
        value: overview.active_trainers || 0,
        change: "Dữ liệu thật",
        icon: "🏋️",
      },
      {
        label: "Doanh thu",
        value: `${Number(finance.total_revenue || 0).toLocaleString("vi-VN")}đ`,
        change: "Tổng thanh toán",
        icon: "💰",
      },
      {
        label: "Check-in hôm nay",
        value: operations.today_checkins || 0,
        change: "Theo ngày hiện tại",
        icon: "✅",
      },
    ];
  }, [dashboard]);

  const expiringMemberships = dashboard?.alerts?.expiring_memberships || [];
  const upcomingClasses = dashboard?.schedule?.upcoming_classes || [];
  const finance = dashboard?.finance || {};
  const operations = dashboard?.operations || {};

  return (
    <main className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-logo">
          Fit<span>Life</span>
        </div>

        <nav className="admin-menu">
          <a className="active">📊 Dashboard</a>
          <a onClick={() => navigate("/dashboard/members")}>👥 Hội viên</a>
          <a onClick={() => navigate("/dashboard/packages")}>💳 Gói tập</a>
          <a onClick={() => navigate("/dashboard/trainers")}>
            🏋️ Huấn luyện viên
          </a>
          <a onClick={() => navigate("/dashboard/classes")}>📅 Lịch lớp</a>
          <a onClick={() => navigate("/dashboard/checkin")}>✅ Check-in</a>
          <a onClick={() => navigate("/dashboard/payments")}>💰 Thanh toán</a>
          <a onClick={() => navigate("/dashboard/reports")}>📈 Báo cáo</a>
        </nav>

        <button className="sidebar-logout" onClick={handleLogout}>
          Đăng xuất
        </button>
      </aside>

      <section className="admin-main">
        <header className="admin-header">
          <div>
            <p>FITLIFE ADMIN</p>
            <h1>Tổng quan vận hành</h1>
          </div>

          <div className="admin-actions">
            
            <button onClick={() => navigate("/")}>Trang chủ</button>
            <button
              className="primary"
              onClick={() => navigate("/dashboard/members")}
            >
              Quản lý hội viên
            </button>
          </div>
        </header>

        {loading ? (
          <p className="members-empty">Đang tải dashboard...</p>
        ) : (
          <>
            <section className="stat-grid">
              {stats.map((item) => (
                <article className="admin-stat-card" key={item.label}>
                  <div>
                    <span>{item.label}</span>
                    <h2>{item.value}</h2>
                    <small>{item.change}</small>
                  </div>
                  <strong>{item.icon}</strong>
                </article>
              ))}
            </section>

            <section className="dashboard-grid">
              <article className="dashboard-panel revenue-panel">
                <div className="panel-head">
                  <div>
                    <span>TÀI CHÍNH</span>
                    <h3>Tổng quan doanh thu</h3>
                  </div>
                  <b>
                    {Number(finance.total_revenue || 0).toLocaleString("vi-VN")}
                    đ
                  </b>
                </div>

                <div className="revenue-chart">
                  <i style={{ height: "45%" }}></i>
                  <i style={{ height: "60%" }}></i>
                  <i style={{ height: "52%" }}></i>
                  <i style={{ height: "78%" }}></i>
                  <i style={{ height: "67%" }}></i>
                  <i style={{ height: "88%" }}></i>
                  <i style={{ height: "100%" }}></i>
                </div>

                <p className="dashboard-note">
                  Công nợ hiện tại:{" "}
                  <strong>
                    {Number(finance.total_debt || 0).toLocaleString("vi-VN")}đ
                  </strong>
                </p>
              </article>

              <article className="dashboard-panel">
                <div className="panel-head">
                  <div>
                    <span>CHECK-IN</span>
                    <h3>Hoạt động hôm nay</h3>
                  </div>
                </div>

                <div className="checkin-circle">
                  <div>
                    <strong>{operations.today_checkins || 0}</strong>
                    <span>Lượt check-in</span>
                  </div>
                </div>
              </article>
            </section>

            <section className="dashboard-grid bottom">
              <article className="dashboard-panel table-panel">
                <div className="panel-head">
                  <div>
                    <span>CẢNH BÁO</span>
                    <h3>Gói tập sắp hết hạn</h3>
                  </div>
                  <a>{expiringMemberships.length} mục</a>
                </div>

                <table>
                  <thead>
                    <tr>
                      <th>Hội viên</th>
                      <th>Gói tập</th>
                      <th>Ngày hết hạn</th>
                      <th>Còn lại</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expiringMemberships.map((item) => (
                      <tr key={item.id}>
                        <td>{item.full_name}</td>
                        <td>{item.plan_name}</td>
                        <td>{item.end_date}</td>
                        <td>
                          <span className="danger">
                            {item.days_remaining} ngày
                          </span>
                        </td>
                      </tr>
                    ))}

                    {expiringMemberships.length === 0 && (
                      <tr>
                        <td colSpan="4">Không có gói sắp hết hạn.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </article>

              <article className="dashboard-panel schedule-panel">
                <div className="panel-head">
                  <div>
                    <span>LỊCH TẬP</span>
                    <h3>Lớp sắp diễn ra</h3>
                  </div>
                  <a onClick={() => navigate("/dashboard/classes")}>
                    Quản lý lịch
                  </a>
                </div>

                <div className="schedule-list">
                  {upcomingClasses.map((item) => (
                    <div className="schedule-item" key={item.id}>
                      <strong>{item.start_time}</strong>
                      <div>
                        <b>{item.name}</b>
                        <span>
                          {item.trainer_name || "Chưa phân công"} · {item.room}
                        </span>
                      </div>
                      <em>
                        {item.booked_count}/{item.capacity}
                      </em>
                    </div>
                  ))}

                  {upcomingClasses.length === 0 && (
                    <p className="members-empty">Chưa có lớp sắp diễn ra.</p>
                  )}
                </div>
              </article>
            </section>
          </>
        )}
      </section>
    </main>
  );
}
