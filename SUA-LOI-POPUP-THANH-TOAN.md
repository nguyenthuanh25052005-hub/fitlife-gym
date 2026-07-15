# Sửa lỗi popup thanh toán và duyệt hóa đơn

- Popup QR được đưa ra ngoài thẻ gói tập và dùng `position: fixed` phủ toàn bộ màn hình.
- Popup có hai nút rõ ràng: Thanh toán ngay và Hủy thanh toán.
- User phải chọn ảnh hóa đơn trước khi gửi.
- Admin có khu vực "Yêu cầu chờ xác nhận" ở đầu trang Thanh toán.
- Mỗi yêu cầu có nút "Mở và xác nhận"; popup xem hóa đơn có nút Xác nhận và Từ chối.
- Bảng thanh toán giữ cột thao tác với chiều rộng tối thiểu để nút không bị khuất.
- Bấm thông báo thanh toán của Admin sẽ mở đúng giao dịch liên quan.

Kiểm tra: frontend `npm run build` đã thành công.
