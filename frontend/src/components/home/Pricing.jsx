import { pricingPlans } from "../../data/siteData";

export default function Pricing({ onDemo }) {
  return (
    <section className="pricing" id="pricing">
      <div className="section-head">
        <span className="mini">BẢNG GIÁ FITLIFE</span>
        <h2>Chọn gói phù hợp với mô hình của bạn</h2>
        <p>Dùng thử 14 ngày miễn phí · Không cần thẻ tín dụng · Huỷ bất cứ lúc nào</p>
      </div>
      <div className="pricing-grid">
        {pricingPlans.map((plan) => (
          <div className={`price-card ${plan.popular ? "popular" : ""}`} key={plan.name}>
            {plan.popular && <span className="popular-badge">Phổ biến nhất</span>}
            <h3>{plan.name}</h3><div className="price">{plan.price}<small>/năm</small></div>
            <p>✓ {plan.note}</p><button onClick={onDemo}>{plan.name === "Enterprise" ? "Liên hệ báo giá" : "Dùng thử miễn phí"}</button>
          </div>
        ))}
      </div>
    </section>
  );
}
