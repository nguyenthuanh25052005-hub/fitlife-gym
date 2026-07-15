import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPayment, getPayments, confirmPayment, rejectPayment } from "../services/paymentService";
import NotificationBell from "../components/common/NotificationBell";
import { formatDateTime } from "../utils/dateTime";

export default function PaymentsPage() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedProof, setSelectedProof] = useState(null);

  const loadPayments = async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      const result = await getPayments();
      const list = result.data?.payments || result.data || result.payments || [];
      setPayments(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("Load payments error:", error);
      if (!silent) alert(error.response?.data?.message || "Không thể tải thanh toán.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();

    // Đồng bộ tự động với các yêu cầu thanh toán do User vừa gửi.
    // Chế độ silent giúp bảng không nhấp nháy trạng thái "Đang tải".
    const refresh = () => loadPayments({ silent: true });
    const intervalId = window.setInterval(refresh, 2500);
    const handleFocus = () => refresh();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    const handlePaymentUpdate = () => refresh();

    window.addEventListener("focus", handleFocus);
    window.addEventListener("fitlife:payment-updated", handlePaymentUpdate);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("fitlife:payment-updated", handlePaymentUpdate);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const name = payment.member_name || payment.full_name || "";
      const method = payment.payment_method || payment.method || "";
      return (
        name.toLowerCase().includes(keyword.toLowerCase()) ||
        method.toLowerCase().includes(keyword.toLowerCase())
      );
    });
  }, [payments, keyword]);

  const totalRevenue = payments.reduce(
    (sum, payment) => sum + Number(payment.amount || 0),
    0
  );

  const pendingPayments = payments.filter(
    (payment) => payment.status !== "paid" && payment.request_status === "pending" && payment.proof_image
  );

  useEffect(() => {
    if (!selectedProof) return;
    const latest = payments.find((payment) => Number(payment.id) === Number(selectedProof.id));
    if (!latest || latest.status === "paid" || latest.request_status !== "pending") {
      setSelectedProof(null);
      return;
    }
    if (latest !== selectedProof) setSelectedProof(latest);
  }, [payments, selectedProof]);

  const openPaymentReview = async (notification) => {
    if (notification.type !== "payment") return;
    const paymentId = Number(notification.related_id);
    let payment = payments.find((item) => Number(item.id) === paymentId);
    if (!payment) {
      try {
        const result = await getPayments();
        const list = result.data?.payments || result.data || result.payments || [];
        setPayments(Array.isArray(list) ? list : []);
        payment = (Array.isArray(list) ? list : []).find((item) => Number(item.id) === paymentId);
      } catch (error) {
        console.error(error);
      }
    }
    if (payment) setSelectedProof(payment);
  };

  const handleConfirm = async (id) => {
    if (!window.confirm('Xác nhận đã nhận được tiền cho giao dịch này?')) return;
    await confirmPayment(id);
    alert('Đã xác nhận thanh toán và kích hoạt gói tập.');
    loadPayments();
  };

  const handleReject = async (id) => {
    const note = window.prompt('Lý do từ chối:', 'Chưa nhận được tiền hoặc nội dung chuyển khoản chưa đúng');
    if (!note) return;
    await rejectPayment(id, note);
    alert('Đã từ chối và gửi thông báo cho hội viên.');
    loadPayments();
  };

  const handleAddPayment = async () => {
    const memberId = window.prompt("Nhập member_id, ví dụ: 1, 2, 3 hoặc 5");
    if (!memberId) return;

    const amount = window.prompt("Nhập số tiền:");
    if (!amount) return;

    try {
      await createPayment({
        member_id: Number(memberId),
        amount: Number(amount),
        payment_method: "cash",
      });

      alert("Thêm thanh toán thành công.");
      loadPayments();
    } catch (error) {
      alert(error.response?.data?.message || "Không thể thêm thanh toán.");
    }
  };

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
          <a onClick={() => navigate("/dashboard/trainers")}>🏋️ Huấn luyện viên</a>
          <a onClick={() => navigate("/dashboard/classes")}>📅 Lịch lớp</a>
          <a onClick={() => navigate("/dashboard/checkin")}>✅ Check-in</a>
          <a className="active">💰 Thanh toán</a>
          <a onClick={() => navigate("/dashboard/reports")}>📈 Báo cáo</a>
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
            <p>PAYMENT MANAGEMENT</p>
            <h1>Quản lý thanh toán</h1>
          </div>

          <div className="admin-actions">
            <NotificationBell role="admin" onNotificationClick={openPaymentReview} />
            <button onClick={() => navigate("/dashboard")}>Dashboard</button>
            <button className="primary" onClick={handleAddPayment}>
              + Thêm thanh toán
            </button>
          </div>
        </header>

        <section className="member-toolbar">
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Tìm theo hội viên hoặc phương thức..."
          />
        </section>

        <section className="member-summary-grid">
          <article>
            <span>Tổng giao dịch</span>
            <b>{payments.length}</b>
          </article>
          <article>
            <span>Tổng doanh thu</span>
            <b>{totalRevenue.toLocaleString("vi-VN")}đ</b>
          </article>
          <article>
            <span>Kết quả tìm kiếm</span>
            <b>{filteredPayments.length}</b>
          </article>
          <article>
            <span>API</span>
            <b>Live</b>
          </article>
        </section>

        <section className="payment-review-panel">
          <div className="payment-review-head">
            <div>
              <span>YÊU CẦU CHỜ XÁC NHẬN</span>
              <h3>Hóa đơn hội viên vừa gửi</h3>
            </div>
            <b>{pendingPayments.length} yêu cầu</b>
          </div>
          {pendingPayments.length === 0 ? (
            <div className="payment-review-empty">Chưa có hóa đơn mới cần xác nhận.</div>
          ) : (
            <div className="payment-review-grid">
              {pendingPayments.map((payment) => (
                <article className="payment-review-card" key={payment.id}>
                  <img src={payment.proof_image} alt="Hóa đơn hội viên gửi" />
                  <div>
                    <strong>{payment.member_name || `Member #${payment.member_id}`}</strong>
                    <span>{payment.plan_name || "Gói tập"}</span>
                    <b>{Number(payment.amount || 0).toLocaleString("vi-VN")}đ</b>
                  </div>
                  <button className="proof-view-btn" onClick={() => setSelectedProof(payment)}>Mở và xác nhận</button>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="dashboard-panel members-panel">
          <div className="panel-head">
            <div>
              <span>DANH SÁCH THANH TOÁN</span>
              <h3>Lịch sử giao dịch phòng tập</h3>
            </div>
          </div>

          {loading ? (
            <p className="members-empty">Đang tải thanh toán...</p>
          ) : (
            <table className="members-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Hội viên</th>
                  <th>Số tiền</th>
                  <th>Phương thức</th>
                  <th>Ngày</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {filteredPayments.map((payment) => {
                  const memberName =
                    payment.member_name ||
                    payment.full_name ||
                    `Member #${payment.member_id}`;

                  return (
                    <tr key={payment.id}>
                      <td>#{payment.id}</td>
                      <td>{memberName}</td>
                      <td>
                        <strong className="payment-amount">
                          {Number(payment.amount || 0).toLocaleString("vi-VN")}đ
                        </strong>
                      </td>
                      <td>{payment.payment_method || payment.method || "cash"}</td>
                      <td>{formatDateTime(payment.payment_date || payment.created_at)}</td>
                      <td>
                        <span className="member-status active">
                          {payment.status === 'paid' ? 'Đã thanh toán' : payment.status === 'unpaid' ? 'Chờ xác nhận' : payment.status}
                        </span>
                      </td>
                      <td>
                        {payment.status === 'paid' ? (
                          <span className="approved-text">✓ Hoàn tất</span>
                        ) : payment.request_status === 'pending' && payment.proof_image ? (
                          <div className="payment-actions">
                            <button className="proof-view-btn" onClick={() => setSelectedProof(payment)}>🧾 Xem hóa đơn</button>
                            <button className="confirm-payment-btn" onClick={() => handleConfirm(payment.id)}>Xác nhận</button>
                            <button className="reject-payment-btn" onClick={() => handleReject(payment.id)}>Từ chối</button>
                          </div>
                        ) : (
                          <span className={`request-status ${payment.request_status || 'waiting'}`}>
                            {payment.request_status === 'rejected' ? 'Đã từ chối' : payment.request_status === 'cancelled' ? 'User đã hủy' : 'Chưa gửi hóa đơn'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {filteredPayments.length === 0 && (
                  <tr>
                    <td colSpan="7">
                      <p className="members-empty">Chưa có thanh toán.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </section>
      </section>

      {selectedProof && (
        <div className="proof-admin-overlay" onClick={() => setSelectedProof(null)}>
          <div className="proof-admin-modal" onClick={(event) => event.stopPropagation()}>
            <button className="proof-admin-close" onClick={() => setSelectedProof(null)}>✕</button>
            <div className="proof-admin-heading">
              <span>HÓA ĐƠN THANH TOÁN</span>
              <h2>{selectedProof.member_name}</h2>
              <p>{selectedProof.plan_name || "Gói tập"} · {Number(selectedProof.amount || 0).toLocaleString("vi-VN")}đ</p>
            </div>
            <div className="proof-admin-image-wrap">
              <img src={selectedProof.proof_image} alt="Hóa đơn thanh toán do hội viên gửi" />
            </div>
            <div className="proof-admin-meta">
              <div><span>File</span><strong>{selectedProof.proof_filename || "Ảnh hóa đơn"}</strong></div>
              <div><span>Gửi lúc</span><strong>{formatDateTime(selectedProof.submitted_at)}</strong></div>
              <div><span>Ghi chú</span><strong>{selectedProof.request_note || "Không có ghi chú"}</strong></div>
            </div>
            <div className="proof-admin-actions">
              <button className="reject-payment-btn" onClick={async () => { await handleReject(selectedProof.id); setSelectedProof(null); }}>Từ chối hóa đơn</button>
              <button className="confirm-payment-btn" onClick={async () => { await handleConfirm(selectedProof.id); setSelectedProof(null); }}>Xác nhận đã nhận tiền</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}