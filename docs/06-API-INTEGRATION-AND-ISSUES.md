# API INTEGRATION AND ISSUES

## Members API
MembersPage đã thay dữ liệu demo bằng dữ liệu backend thật, hỗ trợ tìm kiếm/lọc và hiển thị hội viên.

## Packages API
PackagesPage hiển thị plan thật. Database hiện có seed data và `Test Plan ...` do test sinh ra.

## Trainers API
TrainersPage hiển thị HLV thật. Các record `Trainer Test` cho thấy test đang dùng DB chung.

## Classes API
ClassesPage lấy lớp, trainer, thời gian, phòng, sức chứa và booking count.

## Check-in API
Khi nhập ID 4, hệ thống từng báo “Hội viên không có gói tập còn hiệu lực”. Nguyên nhân: membership dùng `member_id`, không phải `users.id`.

Luồng đúng:
1. Xác định member.
2. Kiểm tra membership active.
3. Kiểm tra hạn.
4. Hợp lệ mới ghi check-in.
5. Không hợp lệ trả lỗi nghiệp vụ.

## Payments API
PaymentsPage đã hiển thị giao dịch thật: ID, hội viên, số tiền, phương thức, ngày và trạng thái.

## Dashboard API
API tổng hợp:
- overview;
- finance;
- operations;
- expiring memberships;
- upcoming classes.

Tại thời điểm kiểm tra, Dashboard hiển thị 17 hội viên, 2 HLV hoạt động, 17.400.000đ doanh thu và 0 check-in hôm nay.

## Reports
Dashboard và Reports từng hiển thị không giống nhau. Nhóm xử lý bằng cách thống nhất nguồn dữ liệu backend.

## Bài học
- Không hard-code KPI khi backend có dữ liệu.
- Không nhầm user_id/member_id/trainer_id.
- Phải kiểm tra response shape.
- Dùng single source of truth cho dashboard/report.
- Tách test data khỏi demo data.
