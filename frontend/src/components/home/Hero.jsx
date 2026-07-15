export default function Hero({ onDemo }) {
  return (
    <>
      <main className="hero" id="top">
        <section className="hero-left">
          <div className="award">🏆 Giải pháp quản lý phòng gym hiện đại cho FitLife</div>
          <h1>FitLife tự hào<br />xây dựng nền tảng<br />quản lý Gym,<br />Fitness, Yoga,<br />Bể bơi tại Việt Nam</h1>
          <p>Nền tảng All-in-One cho quản lý phòng tập, yoga, bể bơi, spa và chuỗi cơ sở thể thao toàn quốc.</p>
          <button className="main-btn" onClick={onDemo}>Đặt lịch demo miễn phí</button>
          <div className="checks"><span>✓ Triển khai trong 1 ngày</span><span>✓ Hỗ trợ 24/7</span></div>
        </section>
        <section className="hero-right">
          <div className="growth">+35% Gia hạn hội viên</div>
          <div className="image-card">
            <div className="fake-image">
              <div className="screen-title">FITLIFE GYM PLATFORM</div>
              <div className="screen-box">CRM · MEMBERS · PAYMENT · CHECK-IN</div>
              <div className="people-row"><span></span><span></span><span></span><span></span><span></span></div>
            </div>
            <div className="label">🏆 Sao Khuê 4 lần</div>
          </div>
        </section>
      </main>
      <section className="trusted">
        <p>Được tin dùng bởi các mô hình phòng tập hiện đại</p>
        <div className="brand-row"><span>CityGym</span><span>Elite Fitness</span><span>Yoga House</span><span>FitLife Gym</span><span>SwimPro</span></div>
      </section>
    </>
  );
}
