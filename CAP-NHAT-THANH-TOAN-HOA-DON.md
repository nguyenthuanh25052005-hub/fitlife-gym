# Cập nhật luồng thanh toán có ảnh hóa đơn

1. Hội viên chọn gói và mở popup QR.
2. Hội viên quét QR, chuyển khoản và bắt buộc tải ảnh hóa đơn JPG/PNG/WEBP (tối đa 7MB).
3. Hệ thống gửi ảnh và ghi chú sang Admin với trạng thái `pending`.
4. Admin vào **Thanh toán**, nhấn **Xem hóa đơn**, kiểm tra ảnh rồi chọn **Xác nhận đã nhận tiền** hoặc **Từ chối hóa đơn**.
5. Chỉ khi Admin xác nhận, payment chuyển sang `paid`, membership chuyển sang `active`, và User nhận thông báo thành công.

Database cũ được tự động thêm hai cột `proof_image` và `proof_filename` khi backend khởi động.
