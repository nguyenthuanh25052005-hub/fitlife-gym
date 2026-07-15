import { useState } from "react";

export default function DemoPopup({ onClose }) {
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    product: "",
  });

  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (
      !formData.fullName.trim() ||
      !formData.phone.trim() ||
      !formData.email.trim() ||
      !formData.product
    ) {
      setError("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    setSuccess(true);
  };

  return (
    <div className="popup-overlay">
      <div className="popup">
        <button
          type="button"
          className="close"
          onClick={onClose}
        >
          ×
        </button>

        <div className="popup-left">
          <p>FITLIFE GYM PLATFORM</p>

          <h2>
            Nhận tư vấn &amp;
            <br />
            demo miễn phí
          </h2>

          <ul>
            <li>
              ✓ Dùng thử 14 ngày miễn phí — không cần thẻ tín dụng
            </li>

            <li>
              ✓ Onboarding miễn phí — cài hệ thống trong ngày
            </li>

            <li>
              ✓ Quản lý hội viên, check-in, lịch tập và thanh toán
            </li>
          </ul>

          <div className="used">
            <span>Được tin dùng bởi</span>

            <div>
              <b>FitLife Gym</b>
              <b>CityGym</b>
              <b>Elite Fitness</b>
            </div>
          </div>
        </div>

        {success ? (
          <div className="popup-success">
            <div className="success-check">
              ✓
            </div>

            <h3>Đã nhận thông tin!</h3>

            <p>
              Đội ngũ FitLife sẽ liên hệ với bạn trong vòng 30 phút.
            </p>

            <button
              type="button"
              onClick={onClose}
            >
              Đóng
            </button>
          </div>
        ) : (
          <form
            className="popup-form"
            onSubmit={handleSubmit}
          >
            <h3>Để lại thông tin</h3>

            <p>
              Chuyên gia sẽ gọi lại trong 30 phút
            </p>

            <input
              type="text"
              name="fullName"
              placeholder="Họ và tên *"
              value={formData.fullName}
              onChange={handleChange}
            />

            <input
              type="tel"
              name="phone"
              placeholder="Số điện thoại *"
              value={formData.phone}
              onChange={handleChange}
            />

            <input
              type="email"
              name="email"
              placeholder="Email *"
              value={formData.email}
              onChange={handleChange}
            />

            <select
              name="product"
              value={formData.product}
              onChange={handleChange}
            >
              <option value="" disabled>
                Sản phẩm quan tâm *
              </option>

              <option value="gym-management">
                Quản lý phòng gym
              </option>

              <option value="member-management">
                Quản lý hội viên
              </option>

              <option value="full-demo">
                Demo toàn bộ hệ thống
              </option>
            </select>

            {error && (
              <div className="popup-error">
                {error}
              </div>
            )}

            <button type="submit">
              Nhận tư vấn &amp; Demo miễn phí →
            </button>

            <small>
              Thông tin của bạn được bảo mật tuyệt đối
            </small>
          </form>
        )}
      </div>
    </div>
  );
}