import { features, modules } from "../../data/siteData";

export default function Features({ onDemo }) {
  return (
    <>
      <section className="section" id="features">
        <div className="section-head">
          <span className="mini">48+ TÍNH NĂNG</span>
          <h2>Toàn bộ công cụ cần thiết để vận hành phòng tập</h2>
          <p>FitLife giúp đội ngũ quản lý, lễ tân, huấn luyện viên và chủ phòng tập làm việc trên cùng một hệ thống.</p>
        </div>
        <div className="feature-grid">
          {features.map((item) => <div className="feature-card" key={item}><div className="icon">✓</div><h3>{item}</h3><p>Tối ưu quy trình, giảm thao tác thủ công và tăng trải nghiệm hội viên.</p></div>)}
        </div>
      </section>

      <section className="split-section">
        <div>
          <span className="mini">QUẢN LÝ TẬP TRUNG</span>
          <h2>Kiểm soát mọi hoạt động phòng tập trong một dashboard</h2>
          <p>Theo dõi hội viên mới, hội viên sắp hết hạn, doanh thu, booking lớp học và hiệu quả huấn luyện viên theo thời gian thực.</p>
          <button className="main-btn" onClick={onDemo}>Xem demo hệ thống</button>
        </div>
        <div className="dashboard-preview"><div className="dash-top"></div><div className="dash-grid"><div></div><div></div><div></div><div></div></div><div className="dash-chart"></div></div>
      </section>

      <section className="section dark-block">
        <div className="section-head"><span className="mini">MODULE NỔI BẬT</span><h2>Thiết kế riêng cho vận hành Gym, Fitness, Yoga và bể bơi</h2></div>
        <div className="module-grid">
          {modules.map((item) => <div className="module-card" key={item.title}><h3>{item.title}</h3><p>{item.text}</p><a href="#industry-solutions">Tìm hiểu thêm →</a></div>)}
        </div>
      </section>
    </>
  );
}
 