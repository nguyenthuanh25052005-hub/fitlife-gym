export default function FinalCTA({ onDemo }) {
  return (
    <section className="final-cta">
      <h2>Sẵn sàng vận hành phòng tập chuyên nghiệp hơn?</h2>
      <p>Đặt lịch demo để xem FitLife có thể hỗ trợ mô hình phòng tập của bạn như thế nào.</p>
      <button onClick={onDemo}>Nhận tư vấn & Demo miễn phí</button>
    </section>
  );
}
