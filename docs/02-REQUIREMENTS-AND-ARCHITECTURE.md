# REQUIREMENTS AND ARCHITECTURE

## 1. Yêu cầu chức năng
| ID | Yêu cầu |
|---|---|
| FR-01 | Admin đăng nhập và nhận JWT |
| FR-02 | Route quản trị kiểm tra token và role |
| FR-03 | Quản lý hội viên |
| FR-04 | Quản lý gói tập |
| FR-05 | Quản lý membership và hạn gói |
| FR-06 | Quản lý huấn luyện viên |
| FR-07 | Quản lý lớp, phòng, sức chứa, lịch |
| FR-08 | Quản lý booking |
| FR-09 | Chỉ check-in khi membership hợp lệ |
| FR-10 | Quản lý thanh toán |
| FR-11 | Dashboard lấy KPI thật |
| FR-12 | Reports dùng dữ liệu tổng hợp thật |

## 2. Yêu cầu phi chức năng
- Backend chia theo module.
- API quản trị có authentication/authorization.
- Có automated tests và coverage.
- Backend/frontend vượt qua lint.
- Frontend build production thành công.
- Không commit node_modules, coverage, dist.
- Tài liệu truy vết được module, sprint và người phụ trách.

## 3. Kiến trúc
```text
User
 -> React UI
 -> Frontend Service
 -> Express Route
 -> Authentication/Role Middleware
 -> Controller
 -> SQLite
 -> JSON Response
 -> React UI
```

## 4. Module mapping
| Module | Backend | Frontend |
|---|---|---|
| Auth | `backend/src/modules/auth/` | Login/Auth flow |
| Members | `backend/src/modules/members/` | `MembersPage.jsx` |
| Plans | `backend/src/modules/plans/` | `PackagesPage.jsx` |
| Memberships | `backend/src/modules/memberships/` | tích hợp Members/Packages |
| Trainers | `backend/src/modules/trainers/` | `TrainersPage.jsx` |
| Classes | `backend/src/modules/classes/` | `ClassesPage.jsx` |
| Bookings | `backend/src/modules/bookings/` | tích hợp Classes |
| Check-ins | `backend/src/modules/checkins/` | `CheckinPage.jsx` |
| Payments | `backend/src/modules/payments/` | `PaymentsPage.jsx` |
| Reports | `backend/src/modules/reports/` | Dashboard/Reports |

## 5. Quy tắc nghiệp vụ
Membership có các trạng thái active, expired và cancelled. Check-in phải xác định đúng member và kiểm tra membership còn hiệu lực. Dashboard và Reports phải dùng cùng nguồn dữ liệu backend để tránh sai lệch KPI.
