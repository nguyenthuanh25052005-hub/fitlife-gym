import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createTrainer,
  deleteTrainer,
  getTrainers,
  updateTrainer,
} from "../services/trainerService";

const initialForm = {
  full_name: "",
  specialty: "",
  phone: "",
  email: "",
  status: "active",
};

export default function TrainersPage() {
  const navigate = useNavigate();

  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [filter, setFilter] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState(null);
  const [formData, setFormData] = useState(initialForm);

  const getTrainerId = (trainer) => trainer.id || trainer._id;

  const extractTrainerList = (result) => {
    const list =
      result?.data?.trainers ||
      result?.data?.data?.trainers ||
      result?.data?.data ||
      result?.data ||
      result?.trainers ||
      [];

    return Array.isArray(list) ? list : [];
  };

  const extractTrainer = (result) => {
    return (
      result?.data?.trainer ||
      result?.data?.data?.trainer ||
      result?.data?.data ||
      result?.data ||
      result?.trainer ||
      null
    );
  };

  const loadTrainers = async () => {
    try {
      setLoading(true);

      const result = await getTrainers();
      setTrainers(extractTrainerList(result));
    } catch (error) {
      console.error("Load trainers error:", error);

      alert(
        error.response?.data?.message ||
          "Không thể tải danh sách huấn luyện viên từ backend.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrainers();
  }, []);

  const normalizedTrainers = useMemo(() => {
    return trainers.map((trainer) => {
      const name =
        trainer.full_name || trainer.fullName || trainer.name || "Chưa có tên";

      const specialty =
        trainer.specialty ||
        trainer.specialization ||
        trainer.expertise ||
        "Fitness Coach";

      const phone = trainer.phone || "Chưa có SĐT";
      const email = trainer.email || "";
      const classes = trainer.class_count ?? trainer.classes ?? 0;
      const members = trainer.member_count ?? trainer.members ?? 0;

      const rawStatus = trainer.status || "active";
      const status =
        rawStatus === "working" || rawStatus === 1
          ? "active"
          : rawStatus === "paused" || rawStatus === 0
            ? "inactive"
            : rawStatus;

      return {
        ...trainer,
        trainerId: getTrainerId(trainer),
        displayName: String(name),
        displaySpecialty: String(specialty),
        displayPhone: String(phone),
        displayEmail: String(email),
        displayClasses: Number(classes) || 0,
        displayMembers: Number(members) || 0,
        displayStatus: status,
      };
    });
  }, [trainers]);

  const filteredTrainers = useMemo(() => {
    const searchValue = keyword.trim().toLowerCase();

    return normalizedTrainers.filter((trainer) => {
      const matchKeyword =
        !searchValue ||
        trainer.displayName.toLowerCase().includes(searchValue) ||
        trainer.displaySpecialty.toLowerCase().includes(searchValue) ||
        trainer.displayPhone.toLowerCase().includes(searchValue) ||
        trainer.displayEmail.toLowerCase().includes(searchValue);

      const matchFilter = filter === "all" || trainer.displayStatus === filter;

      return matchKeyword && matchFilter;
    });
  }, [normalizedTrainers, keyword, filter]);

  const openCreateModal = () => {
    setEditingTrainer(null);
    setFormData(initialForm);
    setShowModal(true);
  };

  const openEditModal = (trainer) => {
    setEditingTrainer(trainer);

    setFormData({
      full_name:
        trainer.displayName === "Chưa có tên" ? "" : trainer.displayName,
      specialty:
        trainer.displaySpecialty === "Fitness Coach"
          ? ""
          : trainer.displaySpecialty,
      phone: trainer.displayPhone === "Chưa có SĐT" ? "" : trainer.displayPhone,
      email: trainer.displayEmail || "",
      status: trainer.displayStatus || "active",
    });

    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingTrainer(null);
    setFormData(initialForm);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.full_name.trim()) {
      alert("Vui lòng nhập họ tên huấn luyện viên.");
      return false;
    }

    if (!formData.specialty.trim()) {
      alert("Vui lòng nhập chuyên môn.");
      return false;
    }

    if (!formData.phone.trim()) {
      alert("Vui lòng nhập số điện thoại.");
      return false;
    }

    const phoneRegex = /^[0-9+\s.-]{8,15}$/;

    if (!phoneRegex.test(formData.phone.trim())) {
      alert("Số điện thoại không hợp lệ.");
      return false;
    }

    if (
      formData.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())
    ) {
      alert("Email không hợp lệ.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    const payload = {
      full_name: formData.full_name.trim(),
      specialty: formData.specialty.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      status: formData.status,
    };

    try {
      setSaving(true);

      if (editingTrainer) {
        const id = editingTrainer.trainerId;

        if (!id) {
          alert("Không tìm thấy ID của huấn luyện viên.");
          return;
        }

        const result = await updateTrainer(id, payload);
        const updatedTrainer = extractTrainer(result);

        if (updatedTrainer && typeof updatedTrainer === "object") {
          setTrainers((current) =>
            current.map((trainer) =>
              getTrainerId(trainer) === id
                ? { ...trainer, ...updatedTrainer }
                : trainer,
            ),
          );
        } else {
          await loadTrainers();
        }

        alert("Cập nhật huấn luyện viên thành công.");
      } else {
        const result = await createTrainer(payload);
        const createdTrainer = extractTrainer(result);

        if (createdTrainer && typeof createdTrainer === "object") {
          setTrainers((current) => [createdTrainer, ...current]);
        } else {
          await loadTrainers();
        }

        alert("Thêm huấn luyện viên thành công.");
      }

      closeModal();
    } catch (error) {
      console.error("Save trainer error:", error);

      alert(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Không thể lưu thông tin huấn luyện viên.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (trainer) => {
    const id = trainer.trainerId;

    if (!id) {
      alert("Không tìm thấy ID của huấn luyện viên.");
      return;
    }

    const accepted = window.confirm(
      `Bạn có chắc muốn xóa huấn luyện viên "${trainer.displayName}"?`,
    );

    if (!accepted) return;

    try {
      await deleteTrainer(id);

      setTrainers((current) =>
        current.filter((item) => getTrainerId(item) !== id),
      );

      alert("Xóa huấn luyện viên thành công.");
    } catch (error) {
      console.error("Delete trainer error:", error);

      alert(error.response?.data?.message || "Không thể xóa huấn luyện viên.");
    }
  };

  return (
    <main className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-logo">
          Fit<span>Life</span>
        </div>

        <nav className="admin-menu">
          <button onClick={() => navigate("/dashboard")}>📊 Dashboard</button>

          <button onClick={() => navigate("/dashboard/members")}>
            👥 Hội viên
          </button>

          <button onClick={() => navigate("/dashboard/packages")}>
            💳 Gói tập
          </button>

          <button className="active" type="button">
            🏋️ Huấn luyện viên
          </button>

          <button onClick={() => navigate("/dashboard/classes")}>
            📅 Lịch lớp
          </button>

          <button onClick={() => navigate("/dashboard/checkin")}>
            ✅ Check-in
          </button>

          <button onClick={() => navigate("/dashboard/payments")}>
            💰 Thanh toán
          </button>

          <button onClick={() => navigate("/dashboard/reports")}>
            📈 Báo cáo
          </button>
        </nav>

        <button
          className="sidebar-logout"
          type="button"
          onClick={() => {
            localStorage.removeItem("fitlife_token");
            localStorage.removeItem("fitlife_user");
            navigate("/login", { replace: true });
          }}
        >
          Đăng xuất
        </button>
      </aside>

      <section className="admin-main">
        <header className="admin-header">
          <div>
            <p>TRAINER MANAGEMENT</p>
            <h1>Quản lý huấn luyện viên</h1>
          </div>

          <div className="admin-actions">
            <button type="button" onClick={() => navigate("/dashboard")}>
              Dashboard
            </button>

            <button className="primary" type="button" onClick={openCreateModal}>
              + Thêm HLV
            </button>
          </div>
        </header>

        <section className="member-toolbar">
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Tìm theo tên, chuyên môn, email hoặc số điện thoại..."
          />

          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang làm việc</option>
            <option value="inactive">Tạm nghỉ</option>
          </select>
        </section>

        <section className="member-summary-grid">
          <article>
            <span>Tổng HLV</span>
            <b>{normalizedTrainers.length}</b>
          </article>

          <article>
            <span>Đang làm việc</span>
            <b>
              {
                normalizedTrainers.filter(
                  (trainer) => trainer.displayStatus === "active",
                ).length
              }
            </b>
          </article>

          <article>
            <span>Tổng lớp phụ trách</span>
            <b>
              {normalizedTrainers.reduce(
                (sum, trainer) => sum + trainer.displayClasses,
                0,
              )}
            </b>
          </article>

          <article>
            <span>Học viên đang theo</span>
            <b>
              {normalizedTrainers.reduce(
                (sum, trainer) => sum + trainer.displayMembers,
                0,
              )}
            </b>
          </article>
        </section>

        {loading ? (
          <p className="members-empty">Đang tải danh sách huấn luyện viên...</p>
        ) : (
          <section className="trainer-grid">
            {filteredTrainers.map((trainer) => (
              <article
                className="trainer-card"
                key={trainer.trainerId || trainer.displayName}
              >
                <div className="trainer-card-top">
                  <div className="trainer-avatar">
                    {trainer.displayName.charAt(0).toUpperCase()}
                  </div>

                  <span
                    className={
                      trainer.displayStatus === "active"
                        ? "member-status active"
                        : "member-status warning"
                    }
                  >
                    {trainer.displayStatus === "active"
                      ? "Đang làm việc"
                      : "Tạm nghỉ"}
                  </span>
                </div>

                <div className="trainer-info">
                  <h3>{trainer.displayName}</h3>
                  <p>{trainer.displaySpecialty}</p>
                  <span>☎ {trainer.displayPhone}</span>

                  {trainer.displayEmail && (
                    <span>✉ {trainer.displayEmail}</span>
                  )}
                </div>

                <div className="trainer-metrics">
                  <div>
                    <b>{trainer.displayClasses}</b>
                    <span>Lớp phụ trách</span>
                  </div>

                  <div>
                    <b>{trainer.displayMembers}</b>
                    <span>Học viên</span>
                  </div>
                </div>

                <div className="package-actions">
                  <button type="button" onClick={() => openEditModal(trainer)}>
                    Sửa
                  </button>

                  <button
                    type="button"
                    className="delete"
                    onClick={() => handleDelete(trainer)}
                  >
                    Xóa
                  </button>
                </div>
              </article>
            ))}

            {filteredTrainers.length === 0 && (
              <p className="members-empty">Không có huấn luyện viên phù hợp.</p>
            )}
          </section>
        )}
      </section>

      {showModal && (
        <div className="trainer-modal-overlay" onMouseDown={closeModal}>
          <div
            className="trainer-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="trainer-modal-header">
              <div>
                <p>{editingTrainer ? "UPDATE TRAINER" : "NEW TRAINER"}</p>

                <h2>
                  {editingTrainer
                    ? "Cập nhật huấn luyện viên"
                    : "Thêm huấn luyện viên"}
                </h2>
              </div>

              <button
                type="button"
                className="trainer-modal-close"
                onClick={closeModal}
                disabled={saving}
              >
                ×
              </button>
            </div>

            <form className="trainer-form" onSubmit={handleSubmit}>
              <div className="trainer-form-group full-width">
                <label htmlFor="full_name">
                  Họ và tên <span>*</span>
                </label>

                <input
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleFormChange}
                  placeholder="Ví dụ: Nguyễn Văn Minh"
                  autoFocus
                />
              </div>

              <div className="trainer-form-group">
                <label htmlFor="specialty">
                  Chuyên môn <span>*</span>
                </label>

                <input
                  id="specialty"
                  name="specialty"
                  value={formData.specialty}
                  onChange={handleFormChange}
                  placeholder="Ví dụ: Fitness, Yoga, Boxing"
                />
              </div>

              <div className="trainer-form-group">
                <label htmlFor="phone">
                  Số điện thoại <span>*</span>
                </label>

                <input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleFormChange}
                  placeholder="Ví dụ: 0901234567"
                />
              </div>

              <div className="trainer-form-group">
                <label htmlFor="email">Email</label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  placeholder="trainer@fitlife.vn"
                />
              </div>

              <div className="trainer-form-group">
                <label htmlFor="status">Trạng thái</label>

                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                >
                  <option value="active">Đang làm việc</option>
                  <option value="inactive">Tạm nghỉ</option>
                </select>
              </div>

              <div className="trainer-form-actions">
                <button
                  type="button"
                  className="cancel"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Hủy
                </button>

                <button type="submit" className="save" disabled={saving}>
                  {saving
                    ? "Đang lưu..."
                    : editingTrainer
                      ? "Lưu thay đổi"
                      : "Thêm huấn luyện viên"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
