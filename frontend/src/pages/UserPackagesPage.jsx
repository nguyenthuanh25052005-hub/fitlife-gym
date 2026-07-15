import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyMemberships, buyPlan, cancelMyMembership, upgradeMembership, createPaymentQR, submitPaymentConfirmation, cancelPaymentConfirmation } from "../services/userService";
import api from "../services/api";

export default function UserPackagesPage() {
  const navigate = useNavigate();
  const [memberships, setMemberships] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [showBuy, setShowBuy] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(null);
  const [showQR, setShowQR] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [proofImage, setProofImage] = useState("");
  const [proofFileName, setProofFileName] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentResult, setPaymentResult] = useState(null); // waiting | success | failed

  const user = JSON.parse(localStorage.getItem("fitlife_user") || "{}");

  const loadData = async () => {
    try {
      const [mResult, pResult] = await Promise.all([
        getMyMemberships(),
        api.get("/plans")
      ]);
      setMemberships(mResult.data.memberships);
      setPlans(pResult.data.data.plans.filter(p => p.status === "active"));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (paymentResult?.status !== "waiting") return undefined;
    const timer = setInterval(async () => {
      try {
        const result = await getMyMemberships();
        const nextMemberships = result.data.memberships || [];
        setMemberships(nextMemberships);
        const current = nextMemberships.find((item) => Number(item.id) === Number(paymentResult.membershipId));
        if (current?.payment_status === "paid" || current?.request_status === "approved") {
          setPaymentResult({ status: "success", membershipId: current.id, planName: current.plan_name });
        } else if (current?.request_status === "rejected") {
          setPaymentResult({ status: "failed", membershipId: current.id, planName: current.plan_name, note: current.payment_request_note });
        }
      } catch (error) {
        console.error("Payment status polling error:", error);
      }
    }, 2500);
    return () => clearInterval(timer);
  }, [paymentResult?.status, paymentResult?.membershipId]);

  const handleBuy = (planId) => {
    setSelectedPlan(plans.find((plan) => plan.id === planId) || null);
  };

  const handlePayNow = async () => {
    if (!selectedPlan) return;
    try {
      const result = await buyPlan({ plan_id: selectedPlan.id });
      const membershipId = result.data.membership.id;
      const qrResult = await createPaymentQR({ membership_id: membershipId, amount: selectedPlan.price });
      setQrData(qrResult.data);
      setShowQR(membershipId);
      setSelectedPlan(null);
      await loadData();
    } catch (error) {
      setSelectedPlan(null);
      setMessage({ type: "error", text: error.response?.data?.message || "Không thể tạo giao dịch thanh toán" });
    }
  };

  const handleProofChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Vui lòng chọn file ảnh JPG, PNG hoặc WEBP." });
      return;
    }
    if (file.size > 7 * 1024 * 1024) {
      setMessage({ type: "error", text: "Ảnh hóa đơn phải nhỏ hơn 7MB." });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setProofImage(String(reader.result || ""));
      setProofFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmPayment = async (membershipId) => {
    if (!proofImage) {
      setMessage({ type: "error", text: "Bạn cần tải ảnh hóa đơn trước khi gửi xác nhận." });
      return;
    }
    setConfirming(true);
    try {
      await submitPaymentConfirmation({
        membership_id: membershipId,
        note: paymentNote || "Hội viên đã chuyển khoản và gửi ảnh hóa đơn",
        proof_image: proofImage,
        proof_filename: proofFileName,
      });
      setShowQR(null);
      setQrData(null);
      setProofImage("");
      setProofFileName("");
      setPaymentNote("");
      setPaymentResult({ status: "waiting", membershipId });
      await loadData();
    } catch {
      setMessage({ type: "error", text: error.response?.data?.message || "Không thể gửi ảnh hóa đơn" });
    } finally {
      setConfirming(false);
    }
  };

  const handleCancelPayment = async () => {
    if (showQR) { try { await cancelPaymentConfirmation(showQR); } catch {} }
    setShowQR(null);
    setQrData(null);
    setProofImage("");
    setProofFileName("");
    setPaymentNote("");
    setMessage({ type: "", text: "" });
  };

  const handleUpgrade = async (membershipId, newPlanId) => {
    try {
      await upgradeMembership(membershipId, { new_plan_id: newPlanId });
      setMessage({ type: "success", text: "Nâng cấp gói thành công! Vui lòng thanh toán." });
      const price = plans.find(p => p.id === newPlanId)?.price;
      const qrResult = await createPaymentQR({ membership_id: membershipId, amount: price });
      setQrData(qrResult.data);
      setShowQR(membershipId);
      setShowUpgrade(null);
      loadData();
    } catch {
      setMessage({ type: "error", text: error.response?.data?.message || "Nâng cấp thất bại" });
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Bạn có chắc muốn hủy gói tập này?")) return;
    try {
      await cancelMyMembership(id, { note: "Hủy bởi hội viên" });
      setMessage({ type: "success", text: "Hủy gói thành công!" });
      loadData();
    } catch {
      setMessage({ type: "error", text: error.response?.data?.message || "Hủy thất bại" });
    }
  };

  const handleShowQR = async (membership) => {
    try {
      // Check if there's an unpaid payment for this membership
      const result = await createPaymentQR({ membership_id: membership.id, amount: membership.price });
      setQrData(result.data);
      setShowQR(membership.id);
    } catch {
      setMessage({ type: "error", text: "Không thể tạo mã QR" });
    }
  };

  const getStatusText = (status) => {
    const map = { active: "✅ Đang hoạt động", expired: "⏰ Đã hết hạn", cancelled: "❌ Đã hủy", frozen: "🧊 Bảo lưu" };
    return map[status] || status;
  };

  const sidebarItems = [
    { label: "Tổng quan", icon: "📊", path: "/member/dashboard" },
    { label: "Hồ sơ", icon: "👤", path: "/member/profile" },
    { label: "Lịch tập", icon: "📅", path: "/member/schedule" },
    { label: "Gói tập", icon: "💳", path: "/member/packages", active: true },
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
            <h1>Gói tập</h1>
            <p>Mua sắm và quản lý gói tập của bạn</p>
          </div>
          <button className="hp-btn hp-btn-primary" onClick={() => setShowBuy(!showBuy)}>
            {showBuy ? "✕ Đóng" : "+ Mua gói mới"}
          </button>
        </header>
        <div className="user-content">
          {message.text && (
            <div className={`notification ${message.type}`} onClick={() => setMessage({ type: "", text: "" })}>
              {message.type === "success" ? "✅ " : "❌ "} {message.text}
            </div>
          )}

          {/* Buy Plans */}
          {showBuy && (
            <div className="user-panel animate-slide-up">
              <div className="panel-header"><h3>🎯 Chọn gói tập phù hợp với bạn</h3></div>
              <div className="plans-grid">
                {plans.map((plan) => (
                  <div className="plan-card" key={plan.id}>
                    <div className="plan-card-header" style={{
                      background: plan.plan_type === 'premium' ? 'linear-gradient(135deg, #667eea, #764ba2)' :
                                  plan.plan_type === 'pt' ? 'linear-gradient(135deg, #f093fb, #f5576c)' :
                                  plan.plan_type === 'class' ? 'linear-gradient(135deg, #4facfe, #00f2fe)' :
                                  'linear-gradient(135deg, #43e97b, #38f9d7)'
                    }}>
                      <h4>{plan.name}</h4>
                      <div className="plan-price">{plan.price.toLocaleString()}đ</div>
                      <small>{plan.duration_days} ngày</small>
                    </div>
                    <div className="plan-card-body">
                      <p>{plan.description || `Gói tập ${plan.plan_type}`}</p>
                      {plan.session_limit && <div className="plan-detail"><span>🏋️</span> {plan.session_limit} buổi</div>}
                    </div>
                    <button className="hp-btn hp-btn-primary hp-btn-full" onClick={() => handleBuy(plan.id)}>
                      Đăng ký ngay
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* My Memberships */}
          <div className="user-panel">
            <div className="panel-header"><h3>📋 Gói tập của tôi</h3></div>
            {loading ? (
              <div className="loading-spinner"><div className="spinner"></div></div>
            ) : memberships.length === 0 ? (
              <div className="empty-state">
                <p>Bạn chưa đăng ký gói tập nào.</p>
                <button className="hp-btn hp-btn-primary" onClick={() => setShowBuy(true)}>Mua gói ngay</button>
              </div>
            ) : (
              <div className="memberships-list">
                {memberships.map((m) => {
                  const needsPayment = m.payment_status !== "paid" && m.status !== "cancelled";
                  return (
                    <div className={`membership-card ${m.status} animate-on-scroll`} key={m.id}>
                      <div className="membership-card-main">
                        <div className="membership-plan-badge" style={{
                          background: m.plan_type === 'premium' ? 'linear-gradient(135deg, #667eea, #764ba2)' :
                                      m.plan_type === 'pt' ? 'linear-gradient(135deg, #f093fb, #f5576c)' :
                                      m.plan_type === 'class' ? 'linear-gradient(135deg, #4facfe, #00f2fe)' :
                                      'linear-gradient(135deg, #43e97b, #38f9d7)'
                        }}>
                          <strong>{m.plan_name}</strong>
                        </div>
                        <div className="membership-details-full">
                          <div className="detail-row">
                            <span>Trạng thái:</span>
                            <span className={`status-badge ${m.status}`}>
                              {getStatusText(m.status)}
                            </span>
                          </div>
                          <div className="detail-row"><span>Bắt đầu:</span> {m.start_date}</div>
                          <div className="detail-row"><span>Kết thúc:</span> {m.end_date}</div>
                          <div className="detail-row"><span>Giá:</span> <b>{m.price?.toLocaleString()}đ</b></div>
                          {m.remaining_sessions !== null && (
                            <div className="detail-row"><span>Buổi còn lại:</span> {m.remaining_sessions}</div>
                          )}
                        </div>
                      </div>
                      <div className="membership-card-actions">
                        {needsPayment && (
                          <>
                            <button className="hp-btn hp-btn-primary sm" onClick={() => handleShowQR(m)}>
                              💳 Thanh toán
                            </button>
                            <button className="hp-btn hp-btn-outline sm" onClick={() => setShowUpgrade(m.id)}>
                              ⬆ Nâng cấp
                            </button>
                            <button className="hp-btn hp-btn-danger sm" onClick={() => handleCancel(m.id)}>
                              ✕ Hủy gói
                            </button>
                          </>
                        )}
                        {m.status === "expired" && (
                          <button className="hp-btn hp-btn-primary sm" onClick={() => handleShowQR(m)}>
                            🔄 Gia hạn
                          </button>
                        )}
                      </div>

                      {/* Upgrade */}
                      {showUpgrade === m.id && (
                        <div className="upgrade-form animate-slide-up">
                          <h4>Chọn gói nâng cấp:</h4>
                          <div className="upgrade-options">
                            {plans.filter(p => p.id !== m.plan_id).map(p => (
                              <button key={p.id} className="plan-option" onClick={() => handleUpgrade(m.id, p.id)}>
                                <strong>{p.name}</strong>
                                <span>{p.price.toLocaleString()}đ</span>
                              </button>
                            ))}
                          </div>
                          <button className="hp-btn hp-btn-danger sm" onClick={() => setShowUpgrade(null)}>Hủy</button>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {showQR && qrData && (
        <div className="qr-payment qr-payment-global" role="dialog" aria-modal="true" aria-label="Thanh toán gói tập">
          <div className="qr-overlay" onClick={handleCancelPayment}></div>
          <div className="qr-modal animate-scale" onClick={(event) => event.stopPropagation()}>
            <button className="qr-close" onClick={handleCancelPayment} aria-label="Đóng">✕</button>
            <div className="qr-modal-header">
              <h3>💳 Thanh toán gói tập</h3>
              <p>Quét QR, sau đó tải ảnh hóa đơn để Admin kiểm tra</p>
            </div>
            <div className="qr-modal-grid">
              <div className="qr-image-wrap">
                <img src={qrData.qr_url} alt="Mã VietQR thanh toán" className="qr-image" />
                <p className="qr-hint">📱 Mở ứng dụng ngân hàng và quét mã</p>
              </div>
              <div>
                <div className="qr-bank-info">
                  <div className="bank-row"><span>Ngân hàng</span><strong>MB Bank</strong></div>
                  <div className="bank-row"><span>Số tài khoản</span><strong className="highlight">{qrData.account_no}</strong></div>
                  <div className="bank-row"><span>Chủ tài khoản</span><strong>{qrData.account_name}</strong></div>
                  <div className="bank-row"><span>Số tiền</span><strong className="amount">{Number(qrData.amount || 0).toLocaleString("vi-VN")}đ</strong></div>
                  <div className="bank-row"><span>Nội dung</span><strong className="content">{qrData.content}</strong></div>
                </div>
                <div className="payment-proof-box">
                  <label className="proof-upload-label">
                    <span>📷 Chọn ảnh hóa đơn</span>
                    <small>Bắt buộc · JPG, PNG, WEBP · tối đa 7MB</small>
                    <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleProofChange} />
                  </label>
                  {proofImage && (
                    <div className="proof-preview">
                      <img src={proofImage} alt="Ảnh hóa đơn đã chọn" />
                      <div><strong>{proofFileName}</strong><span>Đã sẵn sàng gửi</span></div>
                      <button type="button" onClick={() => { setProofImage(""); setProofFileName(""); }}>Đổi ảnh</button>
                    </div>
                  )}
                  <textarea value={paymentNote} onChange={(event) => setPaymentNote(event.target.value)} placeholder="Ghi chú, ví dụ: chuyển khoản lúc 14:30..." rows="2" />
                </div>
              </div>
            </div>
            <div className="qr-actions two-actions">
              <button className="hp-btn hp-btn-primary" onClick={() => handleConfirmPayment(showQR)} disabled={confirming || !proofImage}>
                {confirming ? "⏳ Đang gửi..." : "Thanh toán ngay"}
              </button>
              <button className="hp-btn hp-btn-danger" onClick={handleCancelPayment}>Hủy thanh toán</button>
            </div>
          </div>
        </div>
      )}

      {selectedPlan && (
        <div className="payment-flow-overlay" onClick={() => setSelectedPlan(null)}>
          <div className="payment-flow-modal payment-choice-modal" onClick={(event) => event.stopPropagation()}>
            <div className="payment-flow-icon">💳</div>
            <h2>Xác nhận thanh toán</h2>
            <p>Bạn đang chọn gói <strong>{selectedPlan.name}</strong></p>
            <div className="payment-flow-amount">{Number(selectedPlan.price || 0).toLocaleString("vi-VN")}đ</div>
            <p className="payment-flow-help">Nhấn “Thanh toán ngay” để mở mã QR và gửi hóa đơn cho Admin kiểm tra.</p>
            <div className="payment-flow-actions">
              <button className="hp-btn hp-btn-primary" onClick={handlePayNow}>Thanh toán ngay</button>
              <button className="hp-btn hp-btn-danger" onClick={() => setSelectedPlan(null)}>Hủy thanh toán</button>
            </div>
          </div>
        </div>
      )}

      {paymentResult && (
        <div className="payment-flow-overlay">
          <div className={`payment-flow-modal payment-result-modal ${paymentResult.status}`}>
            <div className="payment-flow-icon">
              {paymentResult.status === "waiting" ? "⏳" : paymentResult.status === "success" ? "✅" : "❌"}
            </div>
            <h2>
              {paymentResult.status === "waiting" ? "Đang chờ Admin xác nhận" : paymentResult.status === "success" ? "Thanh toán thành công" : "Thanh toán thất bại"}
            </h2>
            <p>
              {paymentResult.status === "waiting"
                ? "Hóa đơn đã được gửi. Hệ thống sẽ tự động cập nhật ngay khi Admin xác nhận hoặc từ chối."
                : paymentResult.status === "success"
                  ? `Gói ${paymentResult.planName || "tập"} đã được kích hoạt.`
                  : paymentResult.note || "Admin đã từ chối giao dịch. Vui lòng kiểm tra và gửi lại hóa đơn hợp lệ."}
            </p>
            {paymentResult.status === "waiting" && <div className="payment-waiting-loader"><span></span><span></span><span></span></div>}
            {paymentResult.status !== "waiting" && (
              <button className="hp-btn hp-btn-primary hp-btn-full" onClick={() => { setPaymentResult(null); loadData(); }}>
                Đóng
              </button>
            )}
          </div>
        </div>
      )}
    </main>
  );
}