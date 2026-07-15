import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createClass,
  deleteClass,
  getClasses,
  updateClass,
} from "../services/classService";
import { getTrainers } from "../services/trainerService";

const initialFormData = {
  name: "",
  trainer_id: "",
  room: "",
  class_date: "",
  start_time: "",
  end_time: "",
  capacity: 20,
  status: "open",
};

export default function ClassesPage() {
  const navigate = useNavigate();

  const [classes, setClasses] = useState([]);
  const [trainers, setTrainers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [keyword, setKeyword] = useState("");
  const [filter, setFilter] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [formData, setFormData] = useState(initialFormData);

  const getClassId = (item) => item.id || item._id;

  const extractClassList = (result) => {
    const list =
      result?.data?.classes ||
      result?.data?.data?.classes ||
      result?.data?.data ||
      result?.data ||
      result?.classes ||
      [];

    return Array.isArray(list) ? list : [];
  };

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

  const extractSavedClass = (result) => {
    return (
      result?.data?.class ||
      result?.data?.schedule ||
      result?.data?.data?.class ||
      result?.data?.data ||
      result?.data ||
      result?.class ||
      null
    );
  };

  const loadClasses = async () => {
    try {
      setLoading(true);

      const result = await getClasses();
      setClasses(extractClassList(result));
    } catch (error) {
      console.error("Load classes error:", error);

      alert(
        error.response?.data?.message ||
          "Không thể tải danh sách lớp học từ backend.",
      );
    } finally {
      setLoading(false);
    }
  };

  const loadTrainers = async () => {
    try {
      const result = await getTrainers();
      setTrainers(extractTrainerList(result));
    } catch (error) {
      console.error("Load trainers error:", error);
    }
  };

  useEffect(() => {
    loadClasses();
    loadTrainers();
  }, []);

  const normalizedClasses = useMemo(() => {
    return classes.map((item) => {
      const name =
        item.name || item.class_name || item.title || "Chưa có tên lớp";

      const trainerName =
        item.trainer_name ||
        item.trainer?.full_name ||
        item.trainer?.name ||
        item.full_name ||
        "Chưa phân công HLV";

      const trainerId =
        item.trainer_id ||
        item.trainerId ||
        item.trainer?.id ||
        item.trainer?._id ||
        "";

      const room = item.room || item.location || item.class_room || "Phòng tập";

      const classDate =
        item.class_date || item.schedule_date || item.date || "";

      const startTime =
        item.start_time || item.time || item.schedule_time || "";

      const endTime = item.end_time || item.finish_time || "";

      const currentMembers = Number(
        item.current_members ?? item.booked_count ?? item.registered_count ?? 0,
      );

      const maxMembers = Number(item.max_members ?? item.capacity ?? 20);

      const status = item.status || "open";

      return {
        ...item,
        classId: getClassId(item),
        displayName: String(name),
        displayTrainer: String(trainerName),
        displayTrainerId: trainerId,
        displayRoom: String(room),
        displayDate: classDate,
        displayStartTime: startTime,
        displayEndTime: endTime,
        displayCurrentMembers: currentMembers,
        displayMaxMembers: maxMembers,
        displayCapacity: `${currentMembers}/${maxMembers}`,
        displayStatus: status,
      };
    });
  }, [classes]);

  const filteredClasses = useMemo(() => {
    const searchValue = keyword.trim().toLowerCase();

    return normalizedClasses.filter((item) => {
      const matchKeyword =
        !searchValue ||
        item.displayName.toLowerCase().includes(searchValue) ||
        item.displayTrainer.toLowerCase().includes(searchValue) ||
        item.displayRoom.toLowerCase().includes(searchValue);

      const matchFilter = filter === "all" || item.displayStatus === filter;

      return matchKeyword && matchFilter;
    });
  }, [normalizedClasses, keyword, filter]);

  const formatDate = (dateValue) => {
    if (!dateValue) return "Chưa có ngày";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }

    return date.toLocaleDateString("vi-VN");
  };

  const formatTime = (timeValue) => {
    if (!timeValue) return "--:--";

    if (String(timeValue).includes("T")) {
      const date = new Date(timeValue);

      if (!Number.isNaN(date.getTime())) {
        return date.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        });
      }
    }

    return String(timeValue).slice(0, 5);
  };

  const openCreateModal = () => {
    setEditingClass(null);
    setFormData(initialFormData);
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingClass(item);

    setFormData({
      name: item.displayName === "Chưa có tên lớp" ? "" : item.displayName,
      trainer_id: item.displayTrainerId || "",
      room: item.displayRoom === "Phòng tập" ? "" : item.displayRoom,
      class_date: item.displayDate ? String(item.displayDate).slice(0, 10) : "",
      start_time: item.displayStartTime
        ? String(item.displayStartTime).slice(0, 5)
        : "",
      end_time: item.displayEndTime
        ? String(item.displayEndTime).slice(0, 5)
        : "",
      capacity: item.displayMaxMembers || 20,
      status: item.displayStatus || "open",
    });

    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingClass(null);
    setFormData(initialFormData);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      alert("Vui lòng nhập tên lớp.");
      return false;
    }

    if (!formData.trainer_id) {
      alert("Vui lòng chọn huấn luyện viên.");
      return false;
    }

    if (!formData.room.trim()) {
      alert("Vui lòng nhập phòng tập.");
      return false;
    }

    if (!formData.class_date) {
      alert("Vui lòng chọn ngày học.");
      return false;
    }

    if (!formData.start_time) {
      alert("Vui lòng chọn giờ bắt đầu.");
      return false;
    }

    if (!formData.end_time) {
      alert("Vui lòng chọn giờ kết thúc.");
      return false;
    }

    if (formData.end_time <= formData.start_time) {
      alert("Giờ kết thúc phải sau giờ bắt đầu.");
      return false;
    }

    if (Number(formData.capacity) <= 0) {
      alert("Sức chứa phải lớn hơn 0.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    const selectedTrainer = trainers.find(
      (trainer) =>
        String(trainer.id || trainer._id) === String(formData.trainer_id),
    );

    const payload = {
      name: formData.name.trim(),
      class_name: formData.name.trim(),
      trainer_id: formData.trainer_id,
      trainer_name: selectedTrainer?.full_name || selectedTrainer?.name || "",
      room: formData.room.trim(),
      class_date: formData.class_date,
      start_time: formData.start_time,
      end_time: formData.end_time,
      capacity: Number(formData.capacity),
      max_members: Number(formData.capacity),
      status: formData.status,
    };

    try {
      setSaving(true);

      if (editingClass) {
        const id = editingClass.classId;

        if (!id) {
          alert("Không tìm thấy ID lớp học.");
          return;
        }

        const result = await updateClass(id, payload);
        const updatedClass = extractSavedClass(result);

        if (updatedClass && typeof updatedClass === "object") {
          setClasses((current) =>
            current.map((item) =>
              getClassId(item) === id ? { ...item, ...updatedClass } : item,
            ),
          );
        } else {
          await loadClasses();
        }

        alert("Cập nhật lớp học thành công.");
      } else {
        const result = await createClass(payload);
        const createdClass = extractSavedClass(result);

        if (createdClass && typeof createdClass === "object") {
          setClasses((current) => [createdClass, ...current]);
        } else {
          await loadClasses();
        }

        alert("Thêm lớp học thành công.");
      }

      setShowModal(false);
      setEditingClass(null);
      setFormData(initialFormData);
    } catch (error) {
      console.error("Save class error:", error);

      alert(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Không thể lưu lớp học.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    const id = item.classId;

    if (!id) {
      alert("Không tìm thấy ID lớp học.");
      return;
    }

    const accepted = window.confirm(
      `Bạn có chắc muốn xóa lớp "${item.displayName}"?`,
    );

    if (!accepted) return;

    try {
      await deleteClass(id);

      setClasses((current) =>
        current.filter((classItem) => getClassId(classItem) !== id),
      );

      alert("Xóa lớp học thành công.");
    } catch (error) {
      console.error("Delete class error:", error);

      alert(error.response?.data?.message || "Không thể xóa lớp học.");
    }
  };

  const getStatusText = (status) => {
    if (status === "full") return "Đã đầy";
    if (status === "cancelled") return "Đã hủy";
    return "Còn chỗ";
  };

  const getStatusClass = (status) => {
    if (status === "cancelled") {
      return "member-status danger";
    }

    if (status === "full") {
      return "member-status warning";
    }

    return "member-status active";
  };

  return (
    <main className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-logo">
          Fit<span>Life</span>
        </div>

        <nav className="admin-menu">
          <button type="button" onClick={() => navigate("/dashboard")}>
            📊 Dashboard
          </button>

          <button type="button" onClick={() => navigate("/dashboard/members")}>
            👥 Hội viên
          </button>

          <button type="button" onClick={() => navigate("/dashboard/packages")}>
            💳 Gói tập
          </button>

          <button type="button" onClick={() => navigate("/dashboard/trainers")}>
            🏋️ Huấn luyện viên
          </button>

          <button type="button" className="active">
            📅 Lịch lớp
          </button>

          <button type="button" onClick={() => navigate("/dashboard/checkin")}>
            ✅ Check-in
          </button>

          <button type="button" onClick={() => navigate("/dashboard/payments")}>
            💰 Thanh toán
          </button>

          <button type="button" onClick={() => navigate("/dashboard/reports")}>
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
            <p>CLASS SCHEDULE</p>
            <h1>Quản lý lịch lớp</h1>
          </div>

          <div className="admin-actions">
            <button type="button" onClick={() => navigate("/dashboard")}>
              Dashboard
            </button>

            <button className="primary" type="button" onClick={openCreateModal}>
              + Thêm lớp
            </button>
          </div>
        </header>

        <section className="member-summary-grid">
          <article>
            <span>Tổng số lớp</span>
            <b>{normalizedClasses.length}</b>
          </article>

          <article>
            <span>Lớp còn chỗ</span>
            <b>
              {
                normalizedClasses.filter(
                  (item) => item.displayStatus === "open",
                ).length
              }
            </b>
          </article>

          <article>
            <span>Lớp đã đầy</span>
            <b>
              {
                normalizedClasses.filter(
                  (item) => item.displayStatus === "full",
                ).length
              }
            </b>
          </article>

          <article>
            <span>Lớp đã hủy</span>
            <b>
              {
                normalizedClasses.filter(
                  (item) => item.displayStatus === "cancelled",
                ).length
              }
            </b>
          </article>
        </section>

        <section className="member-toolbar">
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Tìm theo tên lớp, huấn luyện viên hoặc phòng..."
          />

          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="open">Còn chỗ</option>
            <option value="full">Đã đầy</option>
            <option value="cancelled">Đã hủy</option>
          </select>
        </section>

        {loading ? (
          <p className="members-empty">Đang tải danh sách lớp học...</p>
        ) : (
          <section className="class-timeline">
            {filteredClasses.map((item) => (
              <article
                className="class-item"
                key={item.classId || item.displayName}
              >
                <div className="class-time">
                  <strong>{formatTime(item.displayStartTime)}</strong>

                  <span>{formatTime(item.displayEndTime)}</span>

                  <small>{formatDate(item.displayDate)}</small>
                </div>

                <div className="class-content">
                  <div className="class-main-info">
                    <h3>{item.displayName}</h3>

                    <p>🏋️ {item.displayTrainer}</p>

                    <span>📍 {item.displayRoom}</span>
                  </div>

                  <div className="class-meta">
                    <span>👥 {item.displayCapacity}</span>

                    <b className={getStatusClass(item.displayStatus)}>
                      {getStatusText(item.displayStatus)}
                    </b>
                  </div>

                  <div className="member-actions">
                    <button type="button" onClick={() => openEditModal(item)}>
                      Sửa
                    </button>

                    <button
                      type="button"
                      className="delete"
                      onClick={() => handleDelete(item)}
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </article>
            ))}

            {filteredClasses.length === 0 && (
              <p className="members-empty">Không có lớp học phù hợp.</p>
            )}
          </section>
        )}
      </section>

      {showModal && (
        <div className="class-modal-overlay" onMouseDown={closeModal}>
          <div
            className="class-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="class-modal-header">
              <div>
                <p>{editingClass ? "UPDATE CLASS" : "NEW CLASS"}</p>

                <h2>
                  {editingClass ? "Cập nhật lịch lớp" : "Thêm lịch lớp mới"}
                </h2>
              </div>

              <button
                type="button"
                className="class-modal-close"
                onClick={closeModal}
                disabled={saving}
              >
                ×
              </button>
            </div>

            <form className="class-form" onSubmit={handleSubmit}>
              <div className="class-form-group full-width">
                <label htmlFor="name">
                  Tên lớp <span>*</span>
                </label>

                <input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="Ví dụ: Yoga buổi sáng"
                  autoFocus
                />
              </div>

              <div className="class-form-group">
                <label htmlFor="trainer_id">
                  Huấn luyện viên <span>*</span>
                </label>

                <select
                  id="trainer_id"
                  name="trainer_id"
                  value={formData.trainer_id}
                  onChange={handleFormChange}
                >
                  <option value="">Chọn huấn luyện viên</option>

                  {trainers.map((trainer) => (
                    <option
                      key={trainer.id || trainer._id}
                      value={trainer.id || trainer._id}
                    >
                      {trainer.full_name || trainer.name || "Huấn luyện viên"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="class-form-group">
                <label htmlFor="room">
                  Phòng tập <span>*</span>
                </label>

                <input
                  id="room"
                  name="room"
                  value={formData.room}
                  onChange={handleFormChange}
                  placeholder="Ví dụ: Phòng Yoga 01"
                />
              </div>

              <div className="class-form-group">
                <label htmlFor="class_date">
                  Ngày học <span>*</span>
                </label>

                <input
                  id="class_date"
                  name="class_date"
                  type="date"
                  value={formData.class_date}
                  onChange={handleFormChange}
                />
              </div>

              <div className="class-form-group">
                <label htmlFor="capacity">
                  Sức chứa <span>*</span>
                </label>

                <input
                  id="capacity"
                  name="capacity"
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={handleFormChange}
                />
              </div>

              <div className="class-form-group">
                <label htmlFor="start_time">
                  Giờ bắt đầu <span>*</span>
                </label>

                <input
                  id="start_time"
                  name="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={handleFormChange}
                />
              </div>

              <div className="class-form-group">
                <label htmlFor="end_time">
                  Giờ kết thúc <span>*</span>
                </label>

                <input
                  id="end_time"
                  name="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={handleFormChange}
                />
              </div>

              <div className="class-form-group full-width">
                <label htmlFor="status">Trạng thái</label>

                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                >
                  <option value="open">Còn chỗ</option>
                  <option value="full">Đã đầy</option>
                  <option value="cancelled">Đã hủy</option>
                </select>
              </div>

              <div className="class-form-actions">
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
                    : editingClass
                      ? "Lưu thay đổi"
                      : "Thêm lớp học"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
