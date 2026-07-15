# PHÂN CÔNG CODE NHÓM

## 1. Tổng quan
Dự án được chia theo module code để mỗi thành viên phụ trách một phần cụ thể và có thể mở trực tiếp folder/file tương ứng khi báo cáo.

## 2. Bảng phân công chính
| Thành viên | Vai trò | Backend code phụ trách | Frontend code phụ trách | Module | File/folder mở khi thầy hỏi |
|---|---|---|---|---|---|
| **Thu Ánh** | Team Leader, Reports & Dashboard Integration Developer | `backend/src/modules/reports/` | `DashboardPage.jsx`, `ReportsPage.jsx` | Dashboard, Reports, tích hợp KPI | `reportController.js`, Dashboard, Reports |
| **Member 2** | Authentication & Member Management Developer | `modules/auth/`, `modules/members/`, `middleware/` | Login, Members, member service | JWT, RBAC, Members | auth, members, MembersPage |
| **Member 3** | Plans & Membership Management Developer | `modules/plans/`, `modules/memberships/` | Packages và services | Plans, Memberships | plans, memberships, PackagesPage |
| **Member 4** | Trainer, Class & Booking Developer | `modules/trainers/`, `modules/classes/`, `modules/bookings/` | Trainers, Classes | HLV, lớp, booking | trainer/class/booking folders |
| **Member 5** | Check-in & Payment Developer | `modules/checkins/`, `modules/payments/` | Checkin, Payments | Check-in, thanh toán | checkin/payment folders |
| **Member 6** | QA, Testing, CI/CD & Documentation Engineer | Kiểm thử toàn backend | Kiểm tra lint/build | Test, coverage, CI, docs | `backend/tests/`, workflows, docs |

## 3. Mô tả từng thành viên

### Thu Ánh
Thu Ánh là trưởng nhóm, phụ trách Dashboard, Reports và tích hợp dữ liệu toàn hệ thống. Backend tập trung vào report API tổng hợp members, trainers, memberships, payments, check-ins, bookings và classes. Frontend tập trung vào DashboardPage và ReportsPage. Đồng thời theo dõi Sprint, review tích hợp và thống nhất KPI.

```text
backend/src/modules/reports/
backend/src/modules/reports/reportController.js
backend/src/modules/reports/reportRoutes.js
frontend/src/pages/DashboardPage.jsx
frontend/src/pages/ReportsPage.jsx
```

### Member 2
Phụ trách Authentication và Member Management: login, JWT, middleware, phân quyền, CRUD hội viên, tìm kiếm, lọc và tích hợp Members API.

```text
backend/src/modules/auth/
backend/src/modules/members/
backend/src/middleware/
frontend/src/pages/LoginPage.jsx
frontend/src/pages/MembersPage.jsx
frontend/src/services/memberService.js
```

### Member 3
Phụ trách Plans và Memberships: CRUD plan, đăng ký gói, ngày bắt đầu/kết thúc, remaining sessions và trạng thái.

```text
backend/src/modules/plans/
backend/src/modules/memberships/
frontend/src/pages/PackagesPage.jsx
frontend/src/services/
```

### Member 4
Phụ trách Trainers, Classes và Bookings: HLV, chuyên môn, trạng thái, lớp, lịch, phòng, sức chứa và booking.

```text
backend/src/modules/trainers/
backend/src/modules/classes/
backend/src/modules/bookings/
frontend/src/pages/TrainersPage.jsx
frontend/src/pages/ClassesPage.jsx
```

### Member 5
Phụ trách Check-in và Payments: kiểm tra membership trước check-in, lịch sử check-in, giao dịch, doanh thu và công nợ.

```text
backend/src/modules/checkins/
backend/src/modules/payments/
frontend/src/pages/CheckinPage.jsx
frontend/src/pages/PaymentsPage.jsx
```

### Member 6
Phụ trách QA, Testing, CI/CD và Documentation: Jest, Supertest, coverage, lint, build, workflow và tài liệu submission.

```text
backend/tests/
.github/workflows/backend-ci.yml
backend/eslint.config.js
frontend/.oxlintrc.json
docs/
```

## 4. Mapping module
| Module | Chính | Hỗ trợ | Backend | Frontend |
|---|---|---|---|---|
| Dashboard & Reports | Thu Ánh | Member 5 | reports | Dashboard/Reports |
| Auth & RBAC | Member 2 | Thu Ánh | auth/middleware | Login |
| Members | Member 2 | Member 3 | members | Members |
| Plans/Memberships | Member 3 | Member 5 | plans/memberships | Packages |
| Trainers/Classes/Bookings | Member 4 | Thu Ánh | 3 modules | Trainers/Classes |
| Check-ins/Payments | Member 5 | Member 3 | 2 modules | Checkin/Payments |
| Testing/CI/Docs | Member 6 | Cả nhóm | tests/workflows | lint/build |

## 5. Câu trả lời khi bảo vệ
Nhóm em chia code theo module. Thu Ánh là trưởng nhóm, phụ trách Dashboard, Reports và tích hợp dữ liệu. Member 2 phụ trách Authentication và Members. Member 3 phụ trách Plans và Memberships. Member 4 phụ trách Trainers, Classes và Bookings. Member 5 phụ trách Check-in và Payments. Member 6 phụ trách Testing, Coverage, CI/CD và Documentation. Mỗi bạn có folder và file cụ thể để mở trực tiếp khi thầy hỏi.
