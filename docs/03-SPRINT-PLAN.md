# SPRINT PLAN AND DEVELOPMENT PROGRESS

## Sprint 0 - Khởi tạo và phân tích
**Mục tiêu:** xác định phạm vi, công nghệ và cấu trúc.

**Công việc:** phân tích bài toán gym; xác định actors/modules; chọn Node.js/Express/SQLite và React/Vite; tạo repository; cấu hình `.gitignore`; xác định quality gates.

**Đầu ra:** repository, cấu trúc dự án, backlog và phân công.

## Sprint 1 - Authentication và Backend Core
**Mục tiêu:** xây nền tảng bảo mật.

**Công việc:** kết nối SQLite; Express app/server; login; JWT; password hash; authenticate middleware; role middleware; auth tests.

**Đầu ra:** Auth API, middleware và test.

## Sprint 2 - Members, Plans, Memberships
**Mục tiêu:** hoàn thành lõi khách hàng và gói tập.

**Công việc:** CRUD Members; CRUD Plans; đăng ký membership; start/end date; remaining sessions; trạng thái active/expired/cancelled; tests; MembersPage; PackagesPage; nối API thật.

**Đầu ra:** ba backend modules và hai frontend pages dùng dữ liệu thật.

**Vấn đề:** test tạo `Register Test User` và `Test Plan ...` trong DB dùng chung. Cải tiến tiếp theo là test DB độc lập.

## Sprint 3 - Trainers, Classes, Bookings
**Mục tiêu:** quản lý HLV và lịch tập.

**Công việc:** CRUD trainers; specialization/status; CRUD classes; trainer-class mapping; room/capacity/time; booking; booking count; tests; nối Trainers API và Classes API.

**Đầu ra:** Trainers, Classes, Bookings modules và giao diện thật.

## Sprint 4 - Check-in và Payments
**Mục tiêu:** hoàn thiện vận hành và tài chính.

**Công việc:** Check-in API; kiểm tra membership; xử lý trường hợp không có gói; Payments API; lịch sử giao dịch; doanh thu; công nợ; nối frontend.

**Vấn đề thực tế:** nhập User ID trong khi membership dùng Member ID dẫn đến thông báo không có gói hiệu lực. Nhóm đã kiểm tra database và xác định đúng quan hệ.

## Sprint 5 - Dashboard và Reports
**Mục tiêu:** thay KPI demo bằng dữ liệu thật.

**Công việc:** dashboard API; tổng hợp members/trainers; finance; check-in hôm nay; membership sắp hết hạn; lớp sắp diễn ra; nối DashboardPage; nối ReportsPage; thống nhất KPI.

**Vấn đề:** Dashboard và Reports từng hiển thị không giống nhau. Giải pháp là dùng chung nguồn dữ liệu backend.

## Sprint 6 - QA và Submission
**Mục tiêu:** đưa dự án về trạng thái nộp.

**Công việc:** chạy tests; coverage; backend lint; frontend lint; sửa React Hooks warnings; production build; kiểm tra repository; docs; phân công 6 người.

**Kết quả cập nhật:** 142/142 tests passed; statements 89.31%, branches 80.96%, functions 99.58%, lines 92.97%; frontend lint 0 warnings/errors; Vite build success.

## Mẫu Daily Scrum
| Ngày | Thành viên | Thời gian | Đã làm | Tiếp theo | Blocker | Kết quả |
|---|---|---:|---|---|---|---|
| dd/mm | Tên | 3h | Module/API cụ thể | Task tiếp theo | Không/Có | Hoàn thành |

Không ghi chung chung “code 4 giờ”. Nên ghi: 1h đọc controller, 2h nối API, 1h sửa mapping, 1h test và fix.
 