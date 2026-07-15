# PROJECT OVERVIEW

## 1. Giới thiệu
FitLife Gym Management System là hệ thống quản lý phòng tập được xây dựng trong học phần Software Project Quality Management (SPQM). Dự án áp dụng đồng thời phát triển chức năng và quản lý chất lượng phần mềm.

## 2. Mục tiêu
- Số hóa quản lý hội viên.
- Quản lý gói tập và membership.
- Quản lý huấn luyện viên, lớp và booking.
- Kiểm tra điều kiện trước khi check-in.
- Quản lý thanh toán, doanh thu và công nợ.
- Cung cấp Dashboard và Reports từ dữ liệu backend thật.
- Áp dụng automated testing, coverage, lint, build và CI.

## 3. Phạm vi chức năng
| Module | Chức năng |
|---|---|
| Authentication | Login, JWT, xác thực, phân quyền |
| Members | Quản lý hội viên |
| Plans | Quản lý gói tập |
| Memberships | Đăng ký và theo dõi gói |
| Trainers | Quản lý HLV |
| Classes | Quản lý lớp và lịch |
| Bookings | Đăng ký lớp |
| Check-ins | Ghi nhận lượt vào tập |
| Payments | Giao dịch, doanh thu, công nợ |
| Dashboard | KPI vận hành |
| Reports | Báo cáo tổng hợp |

## 4. Công nghệ
Backend: Node.js, Express.js, SQLite (Level 1), PostgreSQL (Level 2), JWT, bcryptjs, Jest, Supertest, ESLint.

Frontend: React, Vite, React Router, JavaScript, CSS, Oxlint.

Quality/DevOps: Git, GitHub Actions, Jest Coverage, ESLint, Oxlint, Docker Compose, SonarQube, k6, Prometheus và Grafana.

## 5. Kết quả hiện tại
- 8/8 test suites passed.
- 142/142 tests passed.
- Statements: 89.31%.
- Branches: 80.96%.
- Functions: 99.58%.
- Lines: 92.97%.
- Backend lint đạt.
- Frontend lint: 0 warnings, 0 errors.
- Frontend production build thành công.

## 6. Cấu trúc chính
```text
fitlife-gym/
├── .github/workflows/backend-ci.yml
├── backend/
│   ├── src/database/
│   ├── src/middleware/
│   ├── src/modules/
│   └── tests/
├── frontend/src/
│   ├── pages/
│   └── services/
└── docs/
```
 