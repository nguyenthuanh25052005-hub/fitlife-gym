import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createCheckin, getCheckins } from "../services/checkinService";

export default function CheckinPage() {
  const navigate = useNavigate();

  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [memberId, setMemberId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checkinMessage, setCheckinMessage] = useState(null);

  const loadCheckins = async ({ showError = true } = {}) => {
    try {
      setLoading(true);

      const result = await getCheckins();

      const list =
        result?.data?.checkins ||
        result?.data?.data?.checkins ||
        result?.data ||
        result?.checkins ||
        [];

      setCheckins(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("Load check-ins error:", error);

      setCheckins([]);

      if (showError) {
        setCheckinMessage({
          type: "error",
          title: "Không thể tải lịch sử check-in",
          message:
            error.response?.data?.message ||
            "Không thể kết nối đến backend. Vui lòng kiểm tra lại máy chủ.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCheckins();
  }, []);

  const normalizedCheckins = useMemo(() => {
    return checkins.map((item) => {
      const name =
        item.member_name ||
        item.full_name ||
        item.name ||
        item.member?.full_name ||
        item.member?.name ||
        "Hội viên";

      const phone =
        item.phone || item.member_phone || item.member?.phone || "Chưa có SĐT";

      const time =
        item.checkin_time ||
        item.checked_in_at ||
        item.created_at ||
        item.time ||
        "Đang cập nhật";

      const method = item.method || item.checkin_method || "manual";

      return {
        ...item,
        displayName: name,
        displayPhone: phone,
        displayTime: time,
        displayMethod: method,
      };
    });
  }, [checkins]);

  const filteredCheckins = useMemo(() => {
    const search = keyword.toLowerCase().trim();

    if (!search) {
      return normalizedCheckins;
    }

    return normalizedCheckins.filter((item) => {
      return (
        item.displayName.toLowerCase().includes(search) ||
        item.displayPhone.toLowerCase().includes(search) ||
        String(item.member_id || "").includes(search) ||
        String(item.id || "").includes(search)
      );
    });
  }, [normalizedCheckins, keyword]);

  const handleCheckin = async (event) => {
    event.preventDefault();

    const normalizedMemberId = memberId.trim();

    if (!normalizedMemberId) {
      setCheckinMessage({
        type: "error",
        title: "Thiếu thông tin",
        message: "Vui lòng nhập ID hội viên.",
      });

      return;
    }

    const numericMemberId = Number(normalizedMemberId);

    if (!Number.isInteger(numericMemberId) || numericMemberId <= 0) {
      setCheckinMessage({
        type: "error",
        title: "ID không hợp lệ",
        message: "ID hội viên phải là số nguyên lớn hơn 0.",
      });

      return;
    }

    try {
      setSubmitting(true);
      setCheckinMessage(null);

      /*
       * Lỗi trước đây là thiếu dòng này,
       * nên biến response không tồn tại.
       */
      const response = await createCheckin({
        member_id: numericMemberId,
      });

      /*
       * Hỗ trợ các dạng response:
       *
       * 1. Axios response:
       *    response.data.data
       *
       * 2. Service đã trả response.data:
       *    response.data
       *
       * 3. Service trả trực tiếp data:
       *    response
       */
      const responseRoot = response?.data || response || {};

      const responseData = responseRoot?.data || responseRoot || {};

      const checkinData =
        responseData?.checkin || responseData?.data?.checkin || null;

      const memberData = responseData?.member || checkinData?.member || null;

      const membershipData =
        responseData?.membership || checkinData?.membership || null;

      const successfulMemberId =
        memberData?.id ||
        memberData?.member_id ||
        checkinData?.member_id ||
        numericMemberId;

      const successMessage =
        responseRoot?.message ||
        response?.message ||
        `Hội viên ID ${successfulMemberId} đã check-in thành công.`;

      setCheckinMessage({
        type: "success",
        title: "Check-in thành công",
        message: successMessage,
        member: memberData,
        membership: membershipData,
        checkin: checkinData,
        fallbackMemberId: successfulMemberId,
      });

      setMemberId("");

      await loadCheckins({
        showError: false,
      });
    } catch (error) {
      console.error("Create check-in error:", error);

      setCheckinMessage({
        type: "error",
        title: "Check-in thất bại",
        message:
          error.response?.data?.message ||
          error.message ||
          "Không thể check-in. Vui lòng thử lại.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("fitlife_token");
    localStorage.removeItem("fitlife_user");

    navigate("/login", {
      replace: true,
    });
  };

  const formatDateTime = (value) => {
    if (!value) {
      return new Date().toLocaleString("vi-VN");
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString("vi-VN");
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

          <a onClick={() => navigate("/dashboard/trainers")}>
            🏋️ Huấn luyện viên
          </a>

          <a onClick={() => navigate("/dashboard/classes")}>📅 Lịch lớp</a>

          <a className="active">✅ Check-in</a>

          <a onClick={() => navigate("/dashboard/payments")}>💰 Thanh toán</a>

          <a onClick={() => navigate("/dashboard/reports")}>📈 Báo cáo</a>
        </nav>

        <button type="button" className="sidebar-logout" onClick={handleLogout}>
          Đăng xuất
        </button>
      </aside>

      <section className="admin-main">
        <header className="admin-header">
          <div>
            <p>CHECK-IN MANAGEMENT</p>
            <h1>Quản lý check-in</h1>
          </div>

          <div className="admin-actions">
            <button type="button" onClick={() => navigate("/dashboard")}>
              Dashboard
            </button>
          </div>
        </header>

        <section className="checkin-create-panel">
          <div>
            <span>CHECK-IN NHANH</span>

            <h3>Ghi nhận hội viên vào phòng tập</h3>

            <p>Nhập ID hội viên để tạo lượt check-in trực tiếp trên backend.</p>
          </div>

          <form className="checkin-form" onSubmit={handleCheckin}>
            <input
              type="number"
              min="1"
              step="1"
              value={memberId}
              onChange={(event) => {
                setMemberId(event.target.value);

                if (checkinMessage?.type === "error") {
                  setCheckinMessage(null);
                }
              }}
              placeholder="Nhập ID hội viên..."
              disabled={submitting}
            />

            <button className="primary" type="submit" disabled={submitting}>
              {submitting ? "Đang check-in..." : "✓ Check-in ngay"}
            </button>
          </form>
        </section>

        {checkinMessage && (
          <section
            className={`checkin-feedback ${
              checkinMessage.type === "success"
                ? "checkin-feedback-success"
                : "checkin-feedback-error"
            }`}
          >
            <div className="checkin-feedback-icon">
              {checkinMessage.type === "success" ? "✓" : "!"}
            </div>

            <div className="checkin-feedback-content">
              <h3>{checkinMessage.title}</h3>

              <p>{checkinMessage.message}</p>

              {checkinMessage.type === "success" && (
                <div className="checkin-feedback-details">
                  <div>
                    <span>ID hội viên vừa check-in</span>

                    <strong>{checkinMessage.fallbackMemberId}</strong>
                  </div>

                  <div>
                    <span>Tên hội viên</span>

                    <strong>
                      {checkinMessage.member?.full_name ||
                        checkinMessage.member?.name ||
                        "Chưa có dữ liệu tên"}
                    </strong>
                  </div>

                  <div>
                    <span>Gói tập</span>

                    <strong>
                      {checkinMessage.membership?.plan_name ||
                        checkinMessage.membership?.name ||
                        checkinMessage.membership?.plan?.name ||
                        "Đang hoạt động"}
                    </strong>
                  </div>

                  <div>
                    <span>Thời gian check-in</span>

                    <strong>
                      {formatDateTime(
                        checkinMessage.checkin?.checkin_time ||
                          checkinMessage.checkin?.checked_in_at ||
                          checkinMessage.checkin?.created_at,
                      )}
                    </strong>
                  </div>

                  {checkinMessage.membership?.remaining_sessions !==
                    undefined && (
                    <div>
                      <span>Số buổi còn lại</span>

                      <strong>
                        {checkinMessage.membership.remaining_sessions}
                      </strong>
                    </div>
                  )}

                  {checkinMessage.membership?.status && (
                    <div>
                      <span>Trạng thái gói tập</span>

                      <strong>{checkinMessage.membership.status}</strong>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              className="checkin-feedback-close"
              onClick={() => setCheckinMessage(null)}
              aria-label="Đóng thông báo"
            >
              ×
            </button>
          </section>
        )}

        <section className="member-summary-grid">
          <article>
            <span>Tổng lượt check-in</span>
            <b>{normalizedCheckins.length}</b>
          </article>

          <article>
            <span>Kết quả hiển thị</span>
            <b>{filteredCheckins.length}</b>
          </article>

          <article>
            <span>Trạng thái hệ thống</span>
            <b>Online</b>
          </article>

          <article>
            <span>API</span>
            <b>Live</b>
          </article>
        </section>

        <section className="member-toolbar checkin-toolbar">
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Tìm theo tên, số điện thoại hoặc ID hội viên..."
          />

          <button
            type="button"
            onClick={() =>
              loadCheckins({
                showError: true,
              })
            }
            disabled={loading}
          >
            {loading ? "Đang tải..." : "↻ Làm mới"}
          </button>
        </section>

        <section className="dashboard-panel members-panel">
          <div className="panel-head">
            <div>
              <span>LỊCH SỬ CHECK-IN</span>

              <h3>Các lượt vào phòng tập gần đây</h3>
            </div>
          </div>

          {loading ? (
            <p className="members-empty">Đang tải lịch sử check-in...</p>
          ) : (
            <div className="members-table-wrap">
              <table className="members-table">
                <thead>
                  <tr>
                    <th>ID lượt check-in</th>
                    <th>ID hội viên</th>
                    <th>Hội viên</th>
                    <th>Số điện thoại</th>
                    <th>Thời gian</th>
                    <th>Phương thức</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredCheckins.map((item) => (
                    <tr key={item.id}>
                      <td>#{item.id}</td>

                      <td>{item.member_id || item.member?.id || "—"}</td>

                      <td>
                        <div className="member-profile">
                          <div>{item.displayName.charAt(0).toUpperCase()}</div>

                          <span>{item.displayName}</span>
                        </div>
                      </td>

                      <td>{item.displayPhone}</td>

                      <td>{formatDateTime(item.displayTime)}</td>

                      <td>{item.displayMethod}</td>

                      <td>
                        <span className="member-status active">Thành công</span>
                      </td>
                    </tr>
                  ))}

                  {filteredCheckins.length === 0 && (
                    <tr>
                      <td colSpan="7">
                        <p className="members-empty">
                          Chưa có dữ liệu check-in.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
