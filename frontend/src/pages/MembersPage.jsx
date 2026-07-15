import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteMember, getMembers } from "../services/memberService";

export default function MembersPage() {
  const navigate = useNavigate();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const loadMembers = async () => {
      try {
        const result = await getMembers();
        const list =
          result.data?.members || result.data || result.members || [];
        setMembers(Array.isArray(list) ? list : []);
      } catch (error) {
        console.error("Load members error:", error);
        alert("Không thể tải danh sách hội viên từ backend.");
      } finally {
        setLoading(false);
      }
    };

    loadMembers();
  }, []);

  const normalizedMembers = useMemo(() => {
    return members.map((member) => {
      const name = member.full_name || member.name || "Chưa có tên";
      const phone = member.phone || "Chưa có SĐT";
      const packageName =
        member.package_name ||
        member.plan_name ||
        member.packageName ||
        "Chưa có gói";
      const expireDate =
        member.expire_date ||
        member.end_date ||
        member.expireDate ||
        "Đang cập nhật";
      const checkin =
        member.last_checkin ||
        member.checkin ||
        member.checkin_time ||
        "Chưa check-in";
      const status = member.status || "active";

      return {
        ...member,
        displayName: name,
        displayPhone: phone,
        displayPackage: packageName,
        displayExpireDate: expireDate,
        displayCheckin: checkin,
        displayStatus: status,
      };
    });
  }, [members]);

  const filteredMembers = useMemo(() => {
    return normalizedMembers.filter((member) => {
      const matchKeyword =
        member.displayName.toLowerCase().includes(keyword.toLowerCase()) ||
        member.displayPhone.includes(keyword) ||
        member.displayPackage.toLowerCase().includes(keyword.toLowerCase());

      const matchFilter = filter === "all" || member.displayStatus === filter;

      return matchKeyword && matchFilter;
    });
  }, [normalizedMembers, keyword, filter]);

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Bạn có chắc muốn xóa hội viên này?");
    if (!confirmed) return;

    try {
      await deleteMember(id);
      setMembers((current) => current.filter((member) => member.id !== id));
    } catch (error) {
      console.error("Delete member error:", error);
      alert("Không thể xóa hội viên.");
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
          <a className="active">👥 Hội viên</a>
          <a onClick={() => navigate("/dashboard/packages")}>💳 Gói tập</a>
          <a onClick={() => navigate("/dashboard/trainers")}>
            🏋️ Huấn luyện viên
          </a>
          <a onClick={() => navigate("/dashboard/classes")}>📅 Lịch lớp</a>
          <a onClick={() => navigate("/dashboard/checkin")}>✅ Check-in</a>
          <a onClick={() => navigate("/dashboard/payments")}>💰 Thanh toán</a>
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
            <p>MEMBER MANAGEMENT</p>
            <h1>Quản lý hội viên</h1>
          </div>

          <div className="admin-actions">
            <button onClick={() => navigate("/dashboard")}>Dashboard</button>
            <button className="primary" type="button">
              + Thêm hội viên
            </button>
          </div>
        </header>

        <section className="member-toolbar">
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Tìm theo tên, số điện thoại hoặc gói tập..."
          />

          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang tập</option>
            <option value="warning">Cần nhắc</option>
            <option value="inactive">Tạm dừng</option>
          </select>
        </section>

        <section className="member-summary-grid">
          <article>
            <span>Tổng hội viên</span>
            <b>{normalizedMembers.length}</b>
          </article>

          <article>
            <span>Đang tập</span>
            <b>
              {
                normalizedMembers.filter((m) => m.displayStatus === "active")
                  .length
              }
            </b>
          </article>

          <article>
            <span>Cần nhắc gia hạn</span>
            <b>
              {
                normalizedMembers.filter((m) => m.displayStatus === "warning")
                  .length
              }
            </b>
          </article>

          <article>
            <span>Kết quả tìm kiếm</span>
            <b>{filteredMembers.length}</b>
          </article>
        </section>

        <section className="dashboard-panel members-panel">
          <div className="panel-head">
            <div>
              <span>DANH SÁCH HỘI VIÊN</span>
              <h3>Quản lý thông tin và trạng thái gói tập</h3>
            </div>
          </div>

          {loading ? (
            <p className="members-empty">Đang tải danh sách hội viên...</p>
          ) : (
            <table className="members-table">
              <thead>
                <tr>
                  <th>Hội viên</th>
                  <th>Số điện thoại</th>
                  <th>Gói tập</th>
                  <th>Hạn gói</th>
                  <th>Check-in</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {filteredMembers.map((member) => (
                  <tr key={member.id}>
                    <td>
                      <div className="member-profile">
                        <div>{member.displayName.charAt(0)}</div>
                        <span>{member.displayName}</span>
                      </div>
                    </td>
                    <td>{member.displayPhone}</td>
                    <td>{member.displayPackage}</td>
                    <td>{member.displayExpireDate}</td>
                    <td>{member.displayCheckin}</td>
                    <td>
                      <span
                        className={
                          member.displayStatus === "warning"
                            ? "member-status warning"
                            : "member-status active"
                        }
                      >
                        {member.displayStatus === "warning"
                          ? "Cần nhắc"
                          : "Đang tập"}
                      </span>
                    </td>
                    <td>
                      <div className="member-actions">
                        <button type="button">Sửa</button>
                        <button
                          type="button"
                          className="delete"
                          onClick={() => handleDelete(member.id)}
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredMembers.length === 0 && (
                  <tr>
                    <td colSpan="7">
                      <p className="members-empty">
                        Không có hội viên phù hợp.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </section>
      </section>
    </main>
  );
}
