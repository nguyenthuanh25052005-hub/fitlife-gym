# FITLIFE GYM - BẢN CẬP NHẬT

## Nội dung đã sửa
- Làm mới giao diện đăng nhập/đăng ký hội viên theo phong cách dashboard hiện đại.
- Hiển thị chuông thông báo toàn cục cho cả Admin và User sau khi đăng nhập.
- User mua gói sẽ ở trạng thái chờ thanh toán, không tự động kích hoạt.
- User có nút xác nhận đã thanh toán và nút hủy thanh toán.
- Yêu cầu thanh toán được gửi tới Admin.
- Admin có nút Xác nhận hoặc Từ chối giao dịch.
- Chỉ khi Admin xác nhận, thanh toán mới chuyển sang paid và gói mới active.
- User nhận thông báo thành công hoặc lý do bị từ chối.
- Bổ sung bảng payment_requests và migration tự động cho database cũ.

## Chạy dự án
### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173
Backend: http://localhost:5000
