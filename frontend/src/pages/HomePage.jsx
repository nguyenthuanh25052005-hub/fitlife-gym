import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="homepage">
      {/* Navbar */}
      <nav className="hp-nav">
        <div className="hp-nav-inner">
          <div className="hp-brand" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            💪 Fit<span>Life</span>
          </div>
          <div className="hp-nav-links">
            <a href="#features">Tính năng</a>
            <a href="#pricing">Bảng giá</a>
            <a href="#contact">Liên hệ</a>
            <div className="hp-nav-buttons">
              <button className="hp-btn hp-btn-outline" onClick={() => navigate("/login")}>
                🔐 Quản trị
              </button>
              <button className="hp-btn hp-btn-primary" onClick={() => navigate("/member/login")}>
                💪 Hội viên
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hp-hero">
        <div className="hp-hero-bg"></div>
        <div className="hp-hero-content">
          <div className="hp-hero-text">
            <div className="hp-badge animate-fade-in">🏆 HỆ THỐNG QUẢN LÝ PHÒNG TẬP</div>
            <h1 className="animate-slide-up">
              Vận hành phòng tập <br />
              <span className="gradient-text">thông minh & chuyên nghiệp</span>
            </h1>
            <p className="animate-slide-up-delay">
              FitLife giúp bạn quản lý hội viên, gói tập, thanh toán và huấn luyện viên 
              trên một nền tảng duy nhất. Dành cho cả chủ phòng tập và hội viên.
            </p>
            <div className="hp-hero-buttons animate-slide-up-delay2">
              <button className="hp-btn hp-btn-primary hp-btn-lg" onClick={() => navigate("/member/register")}>
                👤 Đăng ký hội viên
              </button>
              <button className="hp-btn hp-btn-outline hp-btn-lg" onClick={() => navigate("/login")}>
                🔐 Đăng nhập quản trị
              </button>
            </div>
            <div className="hp-hero-stats animate-fade-in-delay">
              <div><strong>1,248+</strong><span>Hội viên</span></div>
              <div><strong>50+</strong><span>HLV chuyên nghiệp</span></div>
              <div><strong>98.5%</strong><span>Hài lòng</span></div>
            </div>
          </div>
          <div className="hp-hero-visual animate-float">
            <div className="hp-hero-card">
              <div className="hp-card-header">
                <span className="hp-dot"></span>
                <span className="hp-dot"></span>
                <span className="hp-dot"></span>
              </div>
              <div className="hp-card-body">
                <div className="hp-card-row">
                  <div className="hp-avatar-group">
                    <div className="hp-avatar" style={{background: '#3b82f6'}}>M</div>
                    <div className="hp-avatar" style={{background: '#10b981'}}>T</div>
                    <div className="hp-avatar" style={{background: '#f59e0b'}}>L</div>
                  </div>
                  <div className="hp-card-stat">
                    <strong>128</strong>
                    <span>Check-in hôm nay</span>
                  </div>
                </div>
                <div className="hp-card-chart">
                  <div className="hp-bar" style={{height: '40%'}}></div>
                  <div className="hp-bar" style={{height: '65%'}}></div>
                  <div className="hp-bar" style={{height: '45%'}}></div>
                  <div className="hp-bar" style={{height: '80%'}}></div>
                  <div className="hp-bar" style={{height: '60%'}}></div>
                  <div className="hp-bar" style={{height: '90%'}}></div>
                  <div className="hp-bar" style={{height: '75%'}}></div>
                </div>
                <div className="hp-card-footer">
                  <span>📈 Doanh thu tháng: <strong>168.5 triệu</strong></span>
                </div>
              </div>
            </div>
            <div className="hp-floating-card hp-fc-1 animate-float-delay">
              💳 Thanh toán online
            </div>
            <div className="hp-floating-card hp-fc-2 animate-float-delay2">
              📊 Theo dõi sức khỏe
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="hp-section hp-features">
        <div className="hp-section-header">
          <span className="hp-mini-badge">TÍNH NĂNG</span>
          <h2>Mọi thứ bạn cần trong một <span className="gradient-text">hệ thống duy nhất</span></h2>
          <p>FitLife cung cấp đầy đủ công cụ cho cả chủ phòng tập và hội viên</p>
        </div>
        <div className="hp-features-grid">
          {[
            { icon: "👥", title: "Quản lý hội viên", desc: "Theo dõi toàn bộ thông tin hội viên, lịch sử tập luyện và gói tập" },
            { icon: "💳", title: "Gói tập linh hoạt", desc: "Tạo và quản lý các gói tập với nhiều mức giá và thời hạn khác nhau" },
            { icon: "🏋️", title: "Huấn luyện viên", desc: "Quản lý đội ngũ HLV, phân công lịch dạy và theo dõi hiệu suất" },
            { icon: "📅", title: "Lịch tập thông minh", desc: "Đặt lịch, đăng ký lớp học và nhắc nhở tự động" },
            { icon: "📊", title: "Theo dõi sức khỏe", desc: "Đo BMI, theo dõi chỉ số cơ thể và nhận lời khuyên sức khỏe" },
            { icon: "✅", title: "Check-in nhanh", desc: "Check-in bằng QR code, thẻ hoặc tìm kiếm nhanh" },
            { icon: "💰", title: "Báo cáo tài chính", desc: "Doanh thu, công nợ, báo cáo chi tiết theo thời gian" },
            { icon: "📱", title: "Cổng hội viên", desc: "Hội viên tự quản lý hồ sơ, gói tập và thanh toán online" },
          ].map((f, i) => (
            <div className="hp-feature-card animate-on-scroll" key={i} style={{animationDelay: `${i * 0.1}s`}}>
              <div className="hp-feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="hp-section hp-pricing">
        <div className="hp-section-header">
          <span className="hp-mini-badge">BẢNG GIÁ</span>
          <h2>Gói tập <span className="gradient-text">đa dạng</span> cho mọi nhu cầu</h2>
        </div>
        <div className="hp-pricing-grid">
          {[
            { name: "Basic", price: "500,000", period: "/tháng", type: "basic", color: "#3b82f6", features: ["Tập phòng gym", "Không giới hạn giờ", "1 tháng sử dụng", "Check-in tự động"] },
            { name: "Premium", price: "1,200,000", period: "/3 tháng", type: "premium", color: "#8b5cf6", popular: true, features: ["Tất cả Basic", "90 ngày sử dụng", "Ưu tiên đặt lớp", "HLV tư vấn 1 buổi"] },
            { name: "PT Cá nhân", price: "2,500,000", period: "/10 buổi", type: "pt", color: "#f59e0b", features: ["10 buổi PT 1-1", "Giáo án cá nhân hóa", "4 tháng sử dụng", "Theo dõi tiến độ"] },
          ].map((p, i) => (
            <div className={`hp-pricing-card animate-on-scroll ${p.popular ? 'popular' : ''}`} key={i} style={{animationDelay: `${i * 0.15}s`}}>
              {p.popular && <div className="hp-popular-badge">Phổ biến nhất</div>}
              <div className="hp-pricing-header" style={{borderColor: p.color}}>
                <h3>{p.name}</h3>
                <div className="hp-pricing-amount">
                  <span className="hp-price">{p.price}</span>
                  <span className="hp-period">{p.period}</span>
                </div>
              </div>
              <div className="hp-pricing-features">
                {p.features.map((f, fi) => <div key={fi} className="hp-pf-item">✅ {f}</div>)}
              </div>
              <button className="hp-btn hp-btn-primary hp-btn-full" onClick={() => navigate("/member/register")}>
                Đăng ký ngay
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Two Actor Section */}
      <section className="hp-section hp-actors">
        <div className="hp-section-header">
          <span className="hp-mini-badge">HAI CỔNG</span>
          <h2>Một hệ thống - <span className="gradient-text">Hai trải nghiệm</span></h2>
        </div>
        <div className="hp-actors-grid">
          <div className="hp-actor-card admin-actor animate-on-scroll">
            <div className="hp-actor-icon">🔐</div>
            <h3>Cổng Quản trị</h3>
            <p>Dành cho chủ phòng tập và quản lý. Quản lý toàn bộ hệ thống, hội viên, gói tập, nhân sự và báo cáo tài chính.</p>
            <div className="hp-actor-features">
              <span>✅ Quản lý hội viên</span>
              <span>✅ Quản lý gói tập</span>
              <span>✅ Quản lý HLV & lớp học</span>
              <span>✅ Báo cáo doanh thu</span>
              <span>✅ Thông báo đơn hàng</span>
            </div>
            <button className="hp-btn hp-btn-primary" onClick={() => navigate("/login")}>
              🔐 Đăng nhập quản trị
            </button>
          </div>
          <div className="hp-actor-card member-actor animate-on-scroll" style={{animationDelay: '0.2s'}}>
            <div className="hp-actor-icon">💪</div>
            <h3>Cổng Hội viên</h3>
            <p>Dành cho hội viên phòng tập. Quản lý hồ sơ cá nhân, đặt lịch tập, mua gói, thanh toán và theo dõi sức khỏe.</p>
            <div className="hp-actor-features">
              <span>✅ Hồ sơ cá nhân</span>
              <span>✅ Đặt lịch tập</span>
              <span>✅ Mua & thanh toán gói</span>
              <span>✅ Huấn luyện viên riêng</span>
              <span>✅ Theo dõi sức khỏe BMI</span>
            </div>
            <div className="hp-actor-buttons">
              <button className="hp-btn hp-btn-primary" onClick={() => navigate("/member/login")}>
                💪 Đăng nhập
              </button>
              <button className="hp-btn hp-btn-outline" onClick={() => navigate("/member/register")}>
                📝 Đăng ký
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="contact" className="hp-cta">
        <div className="hp-cta-content">
          <h2>Sẵn sàng nâng tầm <span className="gradient-text">phòng tập của bạn?</span></h2>
          <p>Đăng ký ngay để trải nghiệm hệ thống quản lý phòng tập hiện đại nhất</p>
          <div className="hp-cta-buttons">
            <button className="hp-btn hp-btn-primary hp-btn-lg" onClick={() => navigate("/member/register")}>
              👤 Đăng ký hội viên
            </button>
            <button className="hp-btn hp-btn-ghost hp-btn-lg" onClick={() => navigate("/login")}>
              🔐 Đăng nhập quản trị →
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="hp-footer">
        <div className="hp-footer-inner">
          <div className="hp-footer-brand">
            <strong>💪 FitLife Gym</strong>
            <p>Hệ thống quản lý phòng tập thông minh - FitLife Gym Management System</p>
          </div>
          <div className="hp-footer-links">
            <h4>Liên hệ</h4>
            <span>📧 contact@fitlife.vn</span>
            <span>📞 1900 xxxx</span>
            <span>📍 Hà Nội, Việt Nam</span>
          </div>
          <div className="hp-footer-links">
            <h4>Truy cập nhanh</h4>
            <a onClick={() => navigate("/login")}>🔐 Quản trị</a>
            <a onClick={() => navigate("/member/login")}>💪 Hội viên</a>
            <a onClick={() => navigate("/member/register")}>📝 Đăng ký</a>
          </div>
        </div>
        <div className="hp-footer-bottom">
          © 2026 FitLife Gym Management System. All rights reserved.
        </div>
      </footer>
    </div>
  );
}