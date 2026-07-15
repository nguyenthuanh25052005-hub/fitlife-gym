# Cập nhật tự động đồng bộ thanh toán

- Trang Quản lý thanh toán của Admin tự tải dữ liệu mới mỗi 2,5 giây ở chế độ nền.
- Không hiển thị lại trạng thái "Đang tải" và không làm nhấp nháy bảng khi polling.
- Khi tab Admin được mở lại hoặc cửa sổ được focus, dữ liệu được tải ngay lập tức.
- Chuông thông báo Admin kiểm tra thông báo mới mỗi 2,5 giây.
- Khi phát hiện thông báo thanh toán mới, chuông phát sự kiện để trang Thanh toán cập nhật ngay.
- Popup hóa đơn đang mở tự đóng nếu giao dịch đã được duyệt, từ chối hoặc không còn chờ xác nhận.
- Frontend đã build thành công và backend đã kiểm tra cú pháp JavaScript.
