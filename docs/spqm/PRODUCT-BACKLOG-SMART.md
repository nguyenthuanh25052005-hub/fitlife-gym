# Backlog ưu tiên và SMART-Q

Thang ưu tiên: P0 blocker, P1 cao, P2 trung bình, P3 thấp.

| ID | User story / công việc | Ưu tiên | Acceptance criteria đo được |
|---|---|---:|---|
| FL-01 | Đăng nhập JWT và phân quyền admin/trainer/member | P0 | API sai quyền trả 401/403; test pass |
| FL-02 | Quản lý hội viên 360° | P0 | CRUD, tìm kiếm, lịch sử gói/thanh toán/check-in |
| FL-03 | Gói tập và membership workflow | P0 | Tạo, gia hạn, freeze, unfreeze, cancel có audit action |
| FL-04 | Thanh toán và duyệt hóa đơn | P0 | partial/debt/approve/reject; response ổn định; regression test |
| FL-05 | Lớp học, booking, check-in | P1 | Không trùng booking, kiểm tra capacity, status hợp lệ |
| FL-06 | CI Quality Gate | P0 | Lint, test, coverage, build tự động chặn merge |
| FL-07 | PostgreSQL + Docker Compose | P1 | `docker compose up -d` tạo schema và health endpoints |
| FL-08 | 3 FastAPI microservices + Redis | P1 | 3 health endpoint và cache hoạt động |
| FL-09 | Prometheus/Grafana | P1 | 4 scrape targets UP; dashboard hiển thị counters |
| FL-10 | k6 và SLO | P1 | error <1%, p95 <500 ms trong profile đã định |
| FL-11 | Tài liệu SPQM và evidence | P0 | Đủ 6 mục A3, có link/ảnh bằng chứng thật |

## Mục tiêu SMART-Q

Đến thời điểm nộp, pipeline FitLife phải đạt 100% test pass, statements/branches/functions/lines ≥80%, frontend build thành công, không có lỗi Sonar mới mức Blocker/Critical, và k6 đạt error rate <1%, p95 <500 ms trong bài test 30 VU.

## Low-hanging fruit

1. Sửa seed theo đúng thứ tự FK.
2. Chuẩn hóa response payment.
3. Bổ sung integration test cho endpoint đang chạy nhưng chưa được đo.
4. Đưa threshold vào CI trước khi mở rộng microservice.
