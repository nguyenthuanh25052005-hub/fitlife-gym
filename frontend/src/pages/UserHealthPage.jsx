import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getHealthAdvice, getMyBodyMetrics, updateBodyMetrics } from "../services/userService";

export default function UserHealthPage() {
  const navigate = useNavigate();
  const [advice, setAdvice] = useState(null);
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ height: "", weight: "", body_fat: "", muscle_mass: "" });
  const [message, setMessage] = useState("");

  const user = JSON.parse(localStorage.getItem("fitlife_user") || "{}");

  const loadData = async () => {
    try {
      const [adviceResult, metricsResult] = await Promise.all([
        getHealthAdvice(),
        getMyBodyMetrics()
      ]);
      setAdvice(adviceResult.data);
      setMetrics(metricsResult.data.metrics);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.height || !form.weight) {
      setMessage("Vui lòng nhập chiều cao và cân nặng");
      return;
    }
    try {
      const result = await updateBodyMetrics({
        height: parseFloat(form.height),
        weight: parseFloat(form.weight),
        body_fat: form.body_fat ? parseFloat(form.body_fat) : undefined,
        muscle_mass: form.muscle_mass ? parseFloat(form.muscle_mass) : undefined
      });
      setMessage(`Cập nhật thành công! BMI: ${result.data.bmi}`);
      setForm({ height: "", weight: "", body_fat: "", muscle_mass: "" });
      loadData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Cập nhật thất bại");
    }
  };

  const getBMIColor = (bmi) => {
    if (bmi < 18.5) return "#f59e0b";
    if (bmi < 25) return "#10b981";
    if (bmi < 30) return "#f59e0b";
    return "#ef4444";
  };

  const sidebarItems = [
    { label: "Tổng quan", icon: "📊", path: "/member/dashboard" },
    { label: "Hồ sơ", icon: "👤", path: "/member/profile" },
    { label: "Lịch tập", icon: "📅", path: "/member/schedule" },
    { label: "Gói tập", icon: "💳", path: "/member/packages" },
    { label: "HLV của tôi", icon: "🏋️", path: "/member/coach" },
    { label: "Sức khỏe", icon: "❤️", path: "/member/health", active: true },
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
            <h1>Sức khỏe của tôi</h1>
            <p>Theo dõi và cải thiện sức khỏe của bạn</p>
          </div>
        </header>
        <div className="user-content">
          {message && (
            <div className={`notification ${message.includes("thành công") ? "success" : "error"}`} onClick={() => setMessage("")}>
              {message}
            </div>
          )}

          {/* Health Advice Section */}
          {loading ? (
            <div className="loading-spinner"><div className="spinner"></div><p>Đang tải...</p></div>
          ) : (
            <>
              {advice?.bmi && (
                <div className="user-panel">
                  <div className="panel-header"><h3>Đánh giá sức khỏe</h3></div>
                  <div className="health-assessment">
                    <div className="bmi-display" style={{ borderColor: advice.color }}>
                      <div className="bmi-circle" style={{ background: `conic-gradient(${advice.color} ${(advice.bmi / 40) * 360}deg, #f0f0f0 0deg)` }}>
                        <div className="bmi-inner">
                          <strong style={{ color: advice.color }}>{advice.bmi}</strong>
                          <span>BMI</span>
                        </div>
                      </div>
                      <div className="bmi-details">
                        <div className="bmi-stat">
                          <span>Chiều cao</span>
                          <strong>{advice.height} cm</strong>
                        </div>
                        <div className="bmi-stat">
                          <span>Cân nặng</span>
                          <strong>{advice.weight} kg</strong>
                        </div>
                        <div className="bmi-stat">
                          <span>Phân loại</span>
                          <strong className="bmi-category" style={{ color: advice.color }}>{advice.category}</strong>
                        </div>
                        <div className="bmi-stat">
                          <span>Cập nhật</span>
                          <strong>{advice.recorded_at?.slice(0, 10)}</strong>
                        </div>
                      </div>
                    </div>
                    <div className="advice-card" style={{ borderLeft: `4px solid ${advice.color}` }}>
                      <h4>💡 Lời khuyên sức khỏe</h4>
                      <p>{advice.advice}</p>
                    </div>
                  </div>
                </div>
              )}

              {advice && !advice.bmi && (
                <div className="user-panel">
                  <div className="empty-state">
                    <p>{advice.advice}</p>
                  </div>
                </div>
              )}

              {/* BMI History */}
              {metrics.length > 0 && (
                <div className="user-panel">
                  <div className="panel-header"><h3>Lịch sử chỉ số BMI</h3></div>
                  <div className="metrics-history">
                    <table className="metrics-table">
                      <thead>
                        <tr>
                          <th>Ngày</th>
                          <th>Cao (cm)</th>
                          <th>Nặng (kg)</th>
                          <th>BMI</th>
                          <th>Mỡ %</th>
                          <th>Cơ (kg)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {metrics.map((m) => (
                          <tr key={m.id}>
                            <td>{m.recorded_at?.slice(0, 10)}</td>
                            <td>{m.height}</td>
                            <td>{m.weight}</td>
                            <td style={{ color: getBMIColor(m.bmi), fontWeight: 'bold' }}>{m.bmi}</td>
                            <td>{m.body_fat || '-'}</td>
                            <td>{m.muscle_mass || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Update Form */}
              <div className="user-panel">
                <div className="panel-header"><h3>Cập nhật chỉ số mới</h3></div>
                <form onSubmit={handleSubmit} className="profile-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Chiều cao (cm)</label>
                      <input type="number" step="0.1" value={form.height} onChange={(e) => setForm({...form, height: e.target.value})} placeholder="170" required />
                    </div>
                    <div className="form-group">
                      <label>Cân nặng (kg)</label>
                      <input type="number" step="0.1" value={form.weight} onChange={(e) => setForm({...form, weight: e.target.value})} placeholder="65" required />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Tỷ lệ mỡ (%)</label>
                      <input type="number" step="0.1" value={form.body_fat} onChange={(e) => setForm({...form, body_fat: e.target.value})} placeholder="15" />
                    </div>
                    <div className="form-group">
                      <label>Khối lượng cơ (kg)</label>
                      <input type="number" step="0.1" value={form.muscle_mass} onChange={(e) => setForm({...form, muscle_mass: e.target.value})} placeholder="30" />
                    </div>
                  </div>
                  <button type="submit" className="primary-btn">Cập nhật và nhận lời khuyên</button>
                </form>
              </div>

              {/* BMI Reference */}
              <div className="user-panel">
                <div className="panel-header"><h3>Bảng phân loại BMI</h3></div>
                <div className="bmi-reference">
                  <div className="bmi-bar">
                    <div className="bmi-segment underweight" style={{ flex: 18.5 }}><span>Dưới 18.5</span><small>Thiếu cân</small></div>
                    <div className="bmi-segment normal" style={{ flex: 6.5 }}><span>18.5-25</span><small>Bình thường</small></div>
                    <div className="bmi-segment overweight" style={{ flex: 5 }}><span>25-30</span><small>Thừa cân</small></div>
                    <div className="bmi-segment obese" style={{ flex: 10 }}><span>30+</span><small>Béo phì</small></div>
                  </div>
                  <div className="bmi-legend">
                    <div className="legend-item"><div className="legend-color" style={{background: '#f59e0b'}}></div> Thiếu cân {'(<18.5)'}</div>
                    <div className="legend-item"><div className="legend-color" style={{background: '#10b981'}}></div> Bình thường (18.5-25)</div>
                    <div className="legend-item"><div className="legend-color" style={{background: '#f59e0b'}}></div> Thừa cân (25-30)</div>
                    <div className="legend-item"><div className="legend-color" style={{background: '#ef4444'}}></div> Béo phì ({'>30'})</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}