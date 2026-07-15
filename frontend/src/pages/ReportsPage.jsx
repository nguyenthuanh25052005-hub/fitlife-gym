import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDashboard } from "../services/dashboardService";

export default function ReportsPage() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReports = async () => {
      try {
        const result = await getDashboard();
        setDashboard(result.data);
      } catch (error) {
        console.error("Reports error:", error);
        alert(error.response?.data?.message || "Không thể tải báo cáo.");
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, []);

  const overview = dashboard?.overview || {};
  const finance = dashboard?.finance || {};
  const operations = dashboard?.operations || {};
  const expiringMemberships = dashboard?.alerts?.expiring_memberships || [];
  const upcomingClasses = dashboard?.schedule?.upcoming_classes || [];

  const reportCards = [
    {
      label: "Tổng hội viên",
      value: overview.total_members || 0,
      change: "Dữ liệu thật",
    },
    {
      label: "HLV đang hoạt động",
      value: overview.active_trainers || 0,
      change: "Dữ liệu thật",
    },
    {
      label: "Doanh thu",
      value: `${Number(finance.total_revenue || 0).toLocaleString("vi-VN")}đ`,
      change: "Tổng thanh toán",
    },
    {
      label: "Check-in hôm nay",
      value: operations.today_checkins || 0,
      change: "Theo ngày hiện tại",
    },
  ];

  return (
    <main className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-logo">
          Fit<span>Life</span>
        </div>

        <nav className="admin-menu">
          <a onClick={() => navigate("/dashboard")}>📊 Dashboard</a>
          <a onClick={() => navigate("/dashboard/members")}>👥 Hội viên</a>
          <a onClick={() => navigate("/dashboard/packages")}>💳 Gói tập</a>
          <a onClick={() => navigate("/dashboard/trainers")}>
            🏋️ Huấn luyện viên
          </a>
          <a onClick={() => navigate("/dashboard/classes")}>📅 Lịch lớp</a>
          <a onClick={() => navigate("/dashboard/checkin")}>✅ Check-in</a>
          <a onClick={() => navigate("/dashboard/payments")}>💰 Thanh toán</a>
          <a className="active">📈 Báo cáo</a>
        </nav>

        <button
          className="sidebar-logout"
          onClick={() => {
            localStorage.removeItem("fitlife_token");
            localStorage.removeItem("fitlife_user");
            window.location.href = "/login";
          }}
        >
          Đăng xuất
        </button>
      </aside>

      <section className="admin-main">
        <header className="admin-header">
          <div>
            <p>REPORTS & ANALYTICS</p>
            <h1>Báo cáo tổng quan</h1>
          </div>

          <div className="admin-actions">
            <button onClick={() => navigate("/dashboard")}>Dashboard</button>
            <button className="primary" onClick={() => window.print()}>
              Xuất báo cáo
            </button>
          </div>
        </header>

        {loading ? (
          <p className="members-empty">Đang tải báo cáo...</p>
        ) : (
          <>
            <section className="member-summary-grid">
              {reportCards.map((item) => (
                <article key={item.label}>
                  <span>{item.label}</span>
                  <b>{item.value}</b>
                  <small className="report-change">{item.change}</small>
                </article>
              ))}
            </section>

            <section className="dashboard-grid">
              <article className="dashboard-panel revenue-panel">
                <div className="panel-head">
                  <div>
                    <span>TÀI CHÍNH</span>
                    <h3>Phân tích doanh thu</h3>
                  </div>
                  <b>
                    {Number(finance.total_revenue || 0).toLocaleString("vi-VN")}
                    đ
                  </b>
                </div>

                <div className="report-chart">
                  <i style={{ height: "42%" }}></i>
                  <i style={{ height: "55%" }}></i>
                  <i style={{ height: "48%" }}></i>
                  <i style={{ height: "71%" }}></i>
                  <i style={{ height: "64%" }}></i>
                  <i style={{ height: "86%" }}></i>
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
                    <span>VẬN HÀNH</span>
                    <h3>Chỉ số hoạt động</h3>
                  </div>
                </div>

                <div className="report-ring">
                  <div>
                    <strong>{operations.today_checkins || 0}</strong>
                    <span>Check-in hôm nay</span>
                  </div>
                </div>

                <p className="dashboard-note">
                  Booking đang chờ:{" "}
                  <strong>{operations.pending_bookings || 0}</strong>
                </p>
              </article>
            </section>

            <section className="dashboard-grid bottom">
              <article className="dashboard-panel table-panel">
                <div className="panel-head">
                  <div>
                    <span>GÓI SẮP HẾT HẠN</span>
                    <h3>Cần chăm sóc hội viên</h3>
                  </div>
                  <a>{expiringMemberships.length} mục</a>
                </div>

                <table>
                  <thead>
                    <tr>
                      <th>Hội viên</th>
                      <th>Gói tập</th>
                      <th>Hết hạn</th>
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

              <article className="dashboard-panel report-note">
                <div className="panel-head">
                  <div>
                    <span>LỊCH SẮP DIỄN RA</span>
                    <h3>Lớp học cần theo dõi</h3>
                  </div>
                </div>

                <ul>
                  {upcomingClasses.map((item) => (
                    <li key={item.id}>
                      <strong>{item.name}</strong>
                      <br />
                      {item.trainer_name || "Chưa phân công"} · {item.room} ·{" "}
                      {item.booked_count}/{item.capacity}
                    </li>
                  ))}

                  {upcomingClasses.length === 0 && (
                    <li>Chưa có lớp sắp diễn ra.</li>
                  )}
                </ul>
              </article>
            </section>
          </>
        )}
      </section>
    </main>
  );
}
