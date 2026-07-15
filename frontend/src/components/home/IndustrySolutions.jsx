import { useState } from "react";
import { industries } from "../../data/siteData";

export default function IndustrySolutions() {
  const [activeId, setActiveId] = useState("gym");
  const [detailId, setDetailId] = useState(null);

  const active = industries.find((item) => item.id === activeId);
  const detail = detailId ? industries.find((item) => item.id === detailId) : null;

  const openDetail = (item) => {
    setDetailId(item.id);

    setTimeout(() => {
      document
        .getElementById("industry-detail")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  return (
    <>
      <section className="solution-section" id="industry-solutions">
        <div className="industry-tabs">
          {industries.map((item) => (
            <button
              key={item.id}
              className={activeId === item.id ? "active" : ""}
              onClick={() => setActiveId(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="solution-content">
          <div className="solution-copy">
            <h2>{active.title}</h2>
            <p className="solution-subtitle">{active.subtitle}</p>

            <ul>
              <li>
                <b>Quản lý hội viên phân tán, thủ công</b>
                <span>
                  FitLife tập trung toàn bộ dữ liệu hội viên — check-in, thẻ,
                  gói, lịch sử tập trên một nền tảng.
                </span>
              </li>
              <li>
                <b>Hội viên bỏ tập, không gia hạn</b>
                <span>
                  Nhắc gia hạn tự động đúng lúc, đúng người, không bỏ sót.
                </span>
              </li>
              <li>
                <b>Báo cáo thủ công, chậm và thiếu chính xác</b>
                <span>
                  Dashboard doanh thu realtime, tỉ lệ hội viên và KPI vận hành.
                </span>
              </li>
            </ul>

            <button className="main-btn" onClick={() => openDetail(active)}>
              {active.button}
            </button>
          </div>

          <div className="solution-flow">
            <div className="flow-channels">
              <span>Website</span>
              <span>Zalo OA</span>
              <span>Mobile App</span>
            </div>

            <div className="flow-arrow">↓</div>
            <div className="flow-title">{active.flowTitle}</div>
            <div className="flow-arrow">↓</div>

            <div className="flow-cards">
              {active.cards.map(([icon, text]) => (
                <div key={text}>
                  <strong>{icon}</strong>
                  <b>{text}</b>
                </div>
              ))}
            </div>

            <div className="flow-arrow">↓</div>

            <div className="flow-results">
              <span>📈 Tối ưu vận hành</span>
              <span>💪 Tăng hội viên</span>
            </div>
          </div>
        </div>
      </section>

      {detail && (
        <section className="industry-detail" id="industry-detail">
          <div className="breadcrumb">
            <a>Trang chủ</a>
            <span>›</span>
            <a>Giải pháp</a>
            <span>›</span>
            <b>{detail.label}</b>
          </div>

          <div className="detail-grid">
            <div className="detail-left">
              <div className="detail-badge">{detail.badge}</div>

              <h1>{detail.detailTitle}</h1>

              <div className="detail-actions">
                <button>Dùng thử miễn phí</button>
                <button className="outline">Đặt lịch tư vấn ngành</button>
              </div>

              <ul className="detail-benefits">
                {detail.benefits.map((item) => (
                  <li key={item}>✓ {item}</li>
                ))}
              </ul>
            </div>

            <div className="detail-flow">
              <div className="detail-flow-title">{detail.flowLabel}</div>

              <div className="detail-channel-row">
                {detail.channels.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>

              <div className="flow-arrow">↓</div>

              <div className="detail-center">{detail.crmName}</div>

              <div className="flow-arrow">⌁</div>

              <div className="detail-card-grid">
                {detail.detailCards.map(([icon, title, text]) => (
                  <div key={title}>
                    <strong>{icon}</strong>
                    <b>{title}</b>
                    <small>{text}</small>
                  </div>
                ))}
              </div>

              <div className="flow-arrow">↓</div>

              <div className="detail-result-grid">
                {detail.results.map(([icon, title]) => (
                  <div key={title}>
                    <strong>{icon}</strong>
                    <b>{title}</b>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}