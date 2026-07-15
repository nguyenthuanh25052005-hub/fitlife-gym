import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, CalendarDays, HeartPulse, LockKeyhole, Mail, MapPin, Phone, Save, ShieldCheck, UserRound } from "lucide-react";
import { getMyProfile, updateMyProfile, changePassword, updateBodyMetrics } from "../services/userService";

const menu = [
  ["Tổng quan", "📊", "/member/dashboard"], ["Hồ sơ", "👤", "/member/profile"],
  ["Lịch tập", "📅", "/member/schedule"], ["Gói tập", "💳", "/member/packages"],
  ["HLV của tôi", "🏋️", "/member/coach"], ["Sức khỏe", "❤️", "/member/health"],
];

export default function UserProfilePage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("fitlife_user") || "{}");
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [form, setForm] = useState({ full_name: "", phone: "", gender: "", date_of_birth: "", address: "", emergency_contact: "", health_note: "" });
  const [passwordForm, setPasswordForm] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [passwordMessage, setPasswordMessage] = useState("");
  const [metricsForm, setMetricsForm] = useState({ height: "", weight: "", body_fat: "", muscle_mass: "" });
  const [metricsMessage, setMetricsMessage] = useState("");

  useEffect(() => {
    getMyProfile().then((result) => {
      const p = result.data.profile;
      setProfile(p);
      setForm({ full_name: p.full_name || "", phone: p.phone || "", gender: p.gender || "", date_of_birth: p.date_of_birth || "", address: p.address || "", emergency_contact: p.emergency_contact || "", health_note: p.health_note || "" });
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const updateField = (key, value) => setForm((old) => ({ ...old, [key]: value }));
  const updatePassword = (key, value) => setPasswordForm((old) => ({ ...old, [key]: value }));
  const updateMetric = (key, value) => setMetricsForm((old) => ({ ...old, [key]: value }));

  const handleProfileSubmit = async (event) => {
    event.preventDefault(); setSaving(true); setMessage({ type: "", text: "" });
    try {
      await updateMyProfile(form);
      const stored = JSON.parse(localStorage.getItem("fitlife_user") || "{}");
      localStorage.setItem("fitlife_user", JSON.stringify({ ...stored, full_name: form.full_name }));
      setMessage({ type: "success", text: "Đã lưu thông tin cá nhân." });
    } catch (error) { setMessage({ type: "error", text: error.response?.data?.message || "Không thể cập nhật hồ sơ." }); }
    finally { setSaving(false); }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault(); setPasswordMessage("");
    if (passwordForm.new_password.length < 6) return setPasswordMessage("Mật khẩu mới cần ít nhất 6 ký tự.");
    if (passwordForm.new_password !== passwordForm.confirm_password) return setPasswordMessage("Mật khẩu xác nhận không khớp.");
    try {
      await changePassword({ current_password: passwordForm.current_password, new_password: passwordForm.new_password });
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
      setPasswordMessage("Đổi mật khẩu thành công.");
    } catch (error) { setPasswordMessage(error.response?.data?.message || "Đổi mật khẩu thất bại."); }
  };

  const handleMetricsSubmit = async (event) => {
    event.preventDefault(); setMetricsMessage("");
    const height = Number(metricsForm.height), weight = Number(metricsForm.weight);
    if (height < 80 || height > 250 || weight < 20 || weight > 300) return setMetricsMessage("Chiều cao hoặc cân nặng không hợp lệ.");
    try {
      const result = await updateBodyMetrics({ height, weight, body_fat: metricsForm.body_fat ? Number(metricsForm.body_fat) : undefined, muscle_mass: metricsForm.muscle_mass ? Number(metricsForm.muscle_mass) : undefined });
      setMetricsMessage(`Đã cập nhật. BMI hiện tại: ${result.data.bmi}`);
    } catch (error) { setMetricsMessage(error.response?.data?.message || "Không thể cập nhật chỉ số."); }
  };

  return (
    <main className="user-layout">
      <aside className="user-sidebar">
        <div className="user-sidebar-header"><div className="user-sidebar-logo">Fit<span>Life</span></div><div className="user-sidebar-user"><div className="user-avatar-small">{user.full_name?.[0] || "U"}</div><div><strong>{user.full_name || "Hội viên"}</strong><span>{user.email}</span></div></div></div>
        <nav className="user-sidebar-nav">{menu.map(([label, icon, path]) => <a key={path} className={path === "/member/profile" ? "active" : ""} onClick={() => navigate(path)}><span>{icon}</span>{label}</a>)}</nav>
        <div className="user-sidebar-footer"><a onClick={() => navigate("/")}>🏠 Trang chủ</a><a onClick={() => { localStorage.clear(); window.location.href = "/member/login"; }}>🚪 Đăng xuất</a></div>
      </aside>
      <section className="user-main profile-page-modern">
        <header className="user-header profile-hero">
          <div><span className="profile-eyebrow">TRUNG TÂM TÀI KHOẢN</span><h1>Hồ sơ của tôi</h1><p>Cập nhật thông tin, bảo mật và chỉ số cơ thể trong một nơi.</p></div>
          <div className="profile-identity"><div className="profile-avatar-large">{form.full_name?.[0] || "U"}</div><div><strong>{form.full_name || "Hội viên"}</strong><span>{profile?.member_code || "Đang tải mã"}</span></div><ShieldCheck size={22} /></div>
        </header>

        {loading ? <div className="loading-spinner"><div className="spinner"/><p>Đang tải hồ sơ...</p></div> : (
          <div className="user-content profile-content-modern">
            <form onSubmit={handleProfileSubmit} className="profile-card profile-card-wide">
              <div className="profile-card-heading"><div className="profile-card-icon"><UserRound /></div><div><h2>Thông tin cá nhân</h2><p>Thông tin dùng để liên hệ và hỗ trợ hội viên.</p></div></div>
              <div className="modern-form-grid">
                <label className="modern-field"><span>Họ và tên</span><div className="modern-input-wrap"><UserRound size={18}/><input value={form.full_name} onChange={(e) => updateField("full_name", e.target.value)} required /></div></label>
                <label className="modern-field"><span>Email</span><div className="modern-input-wrap is-disabled"><Mail size={18}/><input value={profile?.email || ""} disabled /></div></label>
                <label className="modern-field"><span>Số điện thoại</span><div className="modern-input-wrap"><Phone size={18}/><input value={form.phone} onChange={(e) => updateField("phone", e.target.value)} /></div></label>
                <label className="modern-field"><span>Giới tính</span><select value={form.gender} onChange={(e) => updateField("gender", e.target.value)}><option value="">Chọn giới tính</option><option value="male">Nam</option><option value="female">Nữ</option><option value="other">Khác</option></select></label>
                <label className="modern-field"><span>Ngày sinh</span><div className="modern-input-wrap"><CalendarDays size={18}/><input type="date" value={form.date_of_birth} onChange={(e) => updateField("date_of_birth", e.target.value)} /></div></label>
                <label className="modern-field"><span>Liên hệ khẩn cấp</span><div className="modern-input-wrap"><Phone size={18}/><input value={form.emergency_contact} onChange={(e) => updateField("emergency_contact", e.target.value)} placeholder="Số điện thoại người thân" /></div></label>
                <label className="modern-field modern-field-full"><span>Địa chỉ</span><div className="modern-input-wrap"><MapPin size={18}/><input value={form.address} onChange={(e) => updateField("address", e.target.value)} /></div></label>
                <label className="modern-field modern-field-full"><span>Ghi chú sức khỏe</span><textarea value={form.health_note} onChange={(e) => updateField("health_note", e.target.value)} rows="4" placeholder="Dị ứng, tiền sử chấn thương hoặc lưu ý dành cho huấn luyện viên..." /></label>
              </div>
              {message.text && <div className={`modern-form-message ${message.type}`}>{message.text}</div>}
              <div className="profile-card-actions"><span>Mã hội viên: <strong>{profile?.member_code}</strong></span><button className="profile-save-btn" disabled={saving}><Save size={18}/>{saving ? "Đang lưu..." : "Lưu thay đổi"}</button></div>
            </form>

            <div className="profile-side-stack">
              <form onSubmit={handlePasswordSubmit} className="profile-card">
                <div className="profile-card-heading"><div className="profile-card-icon purple"><LockKeyhole /></div><div><h2>Bảo mật</h2><p>Đổi mật khẩu tài khoản.</p></div></div>
                <div className="modern-form-stack">
                  <label className="modern-field"><span>Mật khẩu hiện tại</span><input type="password" value={passwordForm.current_password} onChange={(e) => updatePassword("current_password", e.target.value)} required /></label>
                  <label className="modern-field"><span>Mật khẩu mới</span><input type="password" value={passwordForm.new_password} onChange={(e) => updatePassword("new_password", e.target.value)} required /></label>
                  <label className="modern-field"><span>Xác nhận mật khẩu</span><input type="password" value={passwordForm.confirm_password} onChange={(e) => updatePassword("confirm_password", e.target.value)} required /></label>
                </div>
                {passwordMessage && <div className={`modern-form-message ${passwordMessage.includes("thành công") ? "success" : "error"}`}>{passwordMessage}</div>}
                <button className="profile-secondary-btn"><LockKeyhole size={17}/>Đổi mật khẩu</button>
              </form>

              <form onSubmit={handleMetricsSubmit} className="profile-card">
                <div className="profile-card-heading"><div className="profile-card-icon orange"><Activity /></div><div><h2>Chỉ số cơ thể</h2><p>Theo dõi tiến trình luyện tập.</p></div></div>
                <div className="metrics-grid">
                  {[['height','Chiều cao','cm'],['weight','Cân nặng','kg'],['body_fat','Tỷ lệ mỡ','%'],['muscle_mass','Khối lượng cơ','kg']].map(([key,label,unit]) => <label className="metric-field" key={key}><span>{label}</span><div><input type="number" step="0.1" value={metricsForm[key]} onChange={(e) => updateMetric(key, e.target.value)} required={key === 'height' || key === 'weight'} /><b>{unit}</b></div></label>)}
                </div>
                {metricsMessage && <div className={`modern-form-message ${metricsMessage.includes("Đã cập nhật") ? "success" : "error"}`}>{metricsMessage}</div>}
                <button className="profile-secondary-btn"><HeartPulse size={17}/>Cập nhật chỉ số</button>
              </form>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
