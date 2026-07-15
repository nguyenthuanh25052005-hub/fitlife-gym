import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createPackage,
  deletePackage,
  getPackages,
  updatePackage,
} from "../services/packageService";

const EMPTY_FORM = {
  name: "",
  price: "",
  duration_days: "",
  session_limit: "",
  status: "active",
  description: "",
};

export default function PackagesPage() {
  const navigate = useNavigate();

  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [filter, setFilter] = useState("all");

  const [showForm, setShowForm] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pageMessage, setPageMessage] = useState(null);

  const loadPackages = async () => {
    try {
      setLoading(true);

      const result = await getPackages();

      const list = result?.data?.plans || result?.data || result?.plans || [];

      setPackages(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("Load packages error:", error);

      setPageMessage({
        type: "error",
        message:
          error.response?.data?.message ||
          "Không thể tải danh sách gói tập từ backend.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPackages();
  }, []);

  const normalizedPackages = useMemo(() => {
    return packages.map((item) => {
      const name = item.name || item.plan_name || "Chưa có tên";

      const durationValue = item.duration_days ?? item.duration ?? null;

      const duration = durationValue
        ? `${durationValue} ngày`
        : item.type || "Đang cập nhật";

      const price =
        item.price !== null && item.price !== undefined
          ? `${Number(item.price).toLocaleString("vi-VN")}đ`
          : item.price_display || "Đang cập nhật";

      const members = item.member_count ?? item.members ?? 0;

      const status = item.status || "active";

      return {
        ...item,
        displayName: name,
        displayDuration: duration,
        displayPrice: price,
        displayMembers: members,
        displayStatus: status,
      };
    });
  }, [packages]);

  const filteredPackages = useMemo(() => {
    const search = keyword.toLowerCase().trim();

    return normalizedPackages.filter((item) => {
      const matchKeyword =
        item.displayName.toLowerCase().includes(search) ||
        item.displayDuration.toLowerCase().includes(search) ||
        item.displayPrice.toLowerCase().includes(search);

      const matchFilter = filter === "all" || item.displayStatus === filter;

      return matchKeyword && matchFilter;
    });
  }, [normalizedPackages, keyword, filter]);

  const openCreateForm = () => {
    setEditingPackage(null);
    setFormData(EMPTY_FORM);
    setFormError("");
    setShowForm(true);
  };

  const openEditForm = (item) => {
    setEditingPackage(item);

    setFormData({
      name: item.name || item.plan_name || "",
      price:
        item.price !== null && item.price !== undefined
          ? String(item.price)
          : "",
      duration_days:
        item.duration_days !== null && item.duration_days !== undefined
          ? String(item.duration_days)
          : item.duration !== null && item.duration !== undefined
            ? String(item.duration)
            : "",
      session_limit:
        item.session_limit !== null && item.session_limit !== undefined
          ? String(item.session_limit)
          : item.total_sessions !== null && item.total_sessions !== undefined
            ? String(item.total_sessions)
            : "",
      status: item.status || "active",
      description: item.description || "",
    });

    setFormError("");
    setShowForm(true);
  };

  const closeForm = () => {
    if (submitting) {
      return;
    }

    setShowForm(false);
    setEditingPackage(null);
    setFormData(EMPTY_FORM);
    setFormError("");
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    setFormError("");
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      return "Vui lòng nhập tên gói tập.";
    }

    const price = Number(formData.price);

    if (!Number.isFinite(price) || price < 0) {
      return "Giá gói tập không hợp lệ.";
    }

    const duration = Number(formData.duration_days);

    if (!Number.isInteger(duration) || duration <= 0) {
      return "Thời hạn phải là số nguyên lớn hơn 0.";
    }

    if (formData.session_limit) {
      const sessionLimit = Number(formData.session_limit);

      if (!Number.isInteger(sessionLimit) || sessionLimit <= 0) {
        return "Số buổi phải là số nguyên lớn hơn 0.";
      }
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    const payload = {
      name: formData.name.trim(),
      price: Number(formData.price),
      duration_days: Number(formData.duration_days),
      session_limit: formData.session_limit
        ? Number(formData.session_limit)
        : null,
      status: formData.status,
      description: formData.description.trim(),
    };

    try {
      setSubmitting(true);
      setFormError("");

      if (editingPackage) {
        await updatePackage(editingPackage.id, payload);

        setPageMessage({
          type: "success",
          message: "Cập nhật gói tập thành công.",
        });
      } else {
        await createPackage(payload);

        setPageMessage({
          type: "success",
          message: "Thêm gói tập thành công.",
        });
      }

      closeForm();
      await loadPackages();
    } catch (error) {
      console.error("Save package error:", error);

      setFormError(error.response?.data?.message || "Không thể lưu gói tập.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Bạn có chắc muốn xóa gói tập này?");

    if (!confirmed) {
      return;
    }

    try {
      await deletePackage(id);

      setPackages((current) => current.filter((item) => item.id !== id));

      setPageMessage({
        type: "success",
        message: "Xóa gói tập thành công.",
      });
    } catch (error) {
      console.error("Delete package error:", error);

      setPageMessage({
        type: "error",
        message: error.response?.data?.message || "Không thể xóa gói tập.",
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("fitlife_token");

    localStorage.removeItem("fitlife_user");

    navigate("/login", {
      replace: true,
    });
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

          <a className="active">💳 Gói tập</a>

          <a onClick={() => navigate("/dashboard/trainers")}>
            🏋️ Huấn luyện viên
          </a>

          <a onClick={() => navigate("/dashboard/classes")}>📅 Lịch lớp</a>

          <a onClick={() => navigate("/dashboard/checkin")}>✅ Check-in</a>

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
            <p>MEMBERSHIP PLANS</p>
            <h1>Quản lý gói tập</h1>
          </div>

          <div className="admin-actions">
            <button type="button" onClick={() => navigate("/dashboard")}>
              Dashboard
            </button>

            <button className="primary" type="button" onClick={openCreateForm}>
              + Thêm gói tập
            </button>
          </div>
        </header>

        {pageMessage && (
          <div
            className={`package-page-message ${
              pageMessage.type === "success" ? "success" : "error"
            }`}
          >
            <span>{pageMessage.type === "success" ? "✓" : "!"}</span>

            <p>{pageMessage.message}</p>

            <button type="button" onClick={() => setPageMessage(null)}>
              ×
            </button>
          </div>
        )}

        <section className="member-toolbar">
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Tìm theo tên gói, thời hạn hoặc giá..."
          />

          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>

            <option value="active">Đang bán</option>

            <option value="inactive">Tạm dừng</option>
          </select>
        </section>

        {loading ? (
          <p className="members-empty">Đang tải danh sách gói tập...</p>
        ) : (
          <>
            <section className="package-card-grid">
              {filteredPackages.map((item) => (
                <article className="package-card" key={item.id}>
                  <div className="package-card-head">
                    <div>
                      <span>GÓI TẬP</span>

                      <h3>{item.displayName}</h3>
                    </div>

                    <b>
                      {item.displayStatus === "active"
                        ? "Đang bán"
                        : "Tạm dừng"}
                    </b>
                  </div>

                  <div className="package-price">
                    {item.displayPrice}

                    <small> / {item.displayDuration}</small>
                  </div>

                  <p>
                    Đang có <strong>{item.displayMembers}</strong> hội viên sử
                    dụng gói này.
                  </p>

                  <div className="package-actions">
                    <button type="button" onClick={() => openEditForm(item)}>
                      Sửa gói
                    </button>

                    <button
                      type="button"
                      className="delete"
                      onClick={() => handleDelete(item.id)}
                    >
                      Xóa
                    </button>
                  </div>
                </article>
              ))}
            </section>

            <section className="dashboard-panel members-panel package-table-panel">
              <div className="panel-head">
                <div>
                  <span>DANH SÁCH GÓI TẬP</span>

                  <h3>Theo dõi giá, thời hạn và số lượng hội viên</h3>
                </div>
              </div>

              <div className="members-table-wrap">
                <table className="members-table">
                  <thead>
                    <tr>
                      <th>Tên gói</th>
                      <th>Thời hạn</th>
                      <th>Giá</th>
                      <th>Hội viên</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredPackages.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div className="member-profile">
                            <div>
                              {item.displayName.charAt(0).toUpperCase()}
                            </div>

                            <span>{item.displayName}</span>
                          </div>
                        </td>

                        <td>{item.displayDuration}</td>

                        <td>{item.displayPrice}</td>

                        <td>{item.displayMembers}</td>

                        <td>
                          <span
                            className={
                              item.displayStatus === "active"
                                ? "member-status active"
                                : "member-status warning"
                            }
                          >
                            {item.displayStatus === "active"
                              ? "Đang bán"
                              : "Tạm dừng"}
                          </span>
                        </td>

                        <td>
                          <div className="member-actions">
                            <button
                              type="button"
                              onClick={() => openEditForm(item)}
                            >
                              Sửa
                            </button>

                            <button
                              type="button"
                              className="delete"
                              onClick={() => handleDelete(item.id)}
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {filteredPackages.length === 0 && (
                      <tr>
                        <td colSpan="6">
                          <p className="members-empty">
                            Không có gói tập phù hợp.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </section>

      {showForm && (
        <div
          className="package-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeForm();
            }
          }}
        >
          <section className="package-modal">
            <button
              type="button"
              className="package-modal-close"
              onClick={closeForm}
              disabled={submitting}
            >
              ×
            </button>

            <div className="package-modal-head">
              <span>
                {editingPackage ? "CHỈNH SỬA GÓI TẬP" : "THÊM GÓI TẬP"}
              </span>

              <h2>
                {editingPackage ? "Cập nhật thông tin gói" : "Tạo gói tập mới"}
              </h2>

              <p>Điền đầy đủ thông tin để lưu gói tập vào hệ thống.</p>
            </div>

            <form className="package-modal-form" onSubmit={handleSubmit}>
              <label>
                Tên gói tập
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="Ví dụ: Premium 3 tháng"
                  disabled={submitting}
                />
              </label>

              <div className="package-form-grid">
                <label>
                  Giá gói
                  <input
                    name="price"
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.price}
                    onChange={handleFormChange}
                    placeholder="1200000"
                    disabled={submitting}
                  />
                </label>

                <label>
                  Thời hạn (ngày)
                  <input
                    name="duration_days"
                    type="number"
                    min="1"
                    step="1"
                    value={formData.duration_days}
                    onChange={handleFormChange}
                    placeholder="90"
                    disabled={submitting}
                  />
                </label>
              </div>

              <div className="package-form-grid">
                <label>
                  Giới hạn số buổi
                  <input
                    name="session_limit"
                    type="number"
                    min="1"
                    step="1"
                    value={formData.session_limit}
                    onChange={handleFormChange}
                    placeholder="Để trống nếu không giới hạn"
                    disabled={submitting}
                  />
                </label>

                <label>
                  Trạng thái
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleFormChange}
                    disabled={submitting}
                  >
                    <option value="active">Đang bán</option>

                    <option value="inactive">Tạm dừng</option>
                  </select>
                </label>
              </div>

              <label>
                Mô tả
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  rows="4"
                  placeholder="Mô tả quyền lợi và nội dung gói tập..."
                  disabled={submitting}
                />
              </label>

              {formError && (
                <div className="package-form-error">{formError}</div>
              )}

              <div className="package-modal-actions">
                <button type="button" onClick={closeForm} disabled={submitting}>
                  Hủy
                </button>

                <button className="primary" type="submit" disabled={submitting}>
                  {submitting
                    ? "Đang lưu..."
                    : editingPackage
                      ? "Lưu thay đổi"
                      : "Thêm gói tập"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
