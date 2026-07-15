# Baseline và xu hướng chất lượng

## Bốn chỉ số bắt buộc

| Metric | Nguồn | Baseline ban đầu | Kết quả hiện tại | Mục tiêu |
|---|---|---:|---:|---:|
| Coverage statements | Jest | 54.92% | 89.31% | ≥80% |
| Coverage branches | Jest | 39.38% | 80.96% | ≥80% |
| Coverage functions | Jest | 55.37% | 99.58% | ≥80% |
| Coverage lines | Jest | 58.68% | 92.97% | ≥80% |
| Lỗi SonarQube | SonarQube Issues | Chưa có baseline hợp lệ | Nhóm chạy và ghi bằng chứng thật | 0 Blocker/Critical mới |
| Lead time commit → merge | GitHub Pull Request | Chưa đo | Cập nhật từ PR thật | ≤2 ngày |
| CI fail ratio | GitHub Actions | Có các lần fail trong giai đoạn sửa | Cập nhật theo sprint | <20% |

## Kết quả local đã đo trên bản bàn giao

- Test suites: **8/8 pass**.
- Test cases: **142/142 pass**.
- Backend ESLint: **0 lỗi**.
- Frontend lint: **0 lỗi/cảnh báo**.
- Frontend production build: **pass**.
- Coverage gate: **pass ở cả statements, branches, functions và lines**.

Log và JSON coverage được lưu trong `docs/evidence/`. Sonar, PR lead time, CI fail ratio và DORA phải lấy từ hoạt động thật của repository; không điền số liệu giả.
