# Cập nhật đồng bộ thanh toán User - Admin

- User chọn gói sẽ thấy popup giữa màn hình gồm **Thanh toán ngay** và **Hủy thanh toán**.
- Sau khi quét QR và gửi hóa đơn, User thấy popup **Đang chờ Admin xác nhận**.
- Popup User tự kiểm tra trạng thái giao dịch mỗi 2,5 giây.
- Admin bấm thông báo thanh toán sẽ mở trực tiếp popup hóa đơn đúng giao dịch.
- Admin chọn **Xác nhận đã nhận tiền** hoặc **Từ chối hóa đơn**.
- User tự động nhận kết quả **Thanh toán thành công** hoặc **Thanh toán thất bại** mà không cần tải lại trang.
- Backend trả về `payment_status` và `request_status` trong API gói tập để đồng bộ dữ liệu hai phía.
