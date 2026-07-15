# Verification Report – 2026-07-15

## Đã thực thi trực tiếp trên bản bàn giao

### Backend

- Production dependency install for Docker (`npm ci --omit=dev --omit=optional`): PASS.
- `npm run init-db`: PASS.
- `npm run seed`: PASS.
- `npm run lint`: PASS.
- `npm run test:ci`: PASS.
- Test suites: 8/8.
- Test cases: 142/142.
- Coverage: Statements 89.31%, Branches 80.96%, Functions 99.58%, Lines 92.97%.

### Frontend

- `npm run lint`: PASS, 0 lỗi/cảnh báo.
- `npm run build`: PASS, Vite production build thành công.

### Cấu hình nâng cao

- Python syntax cho ba FastAPI services: PASS.
- JSON/YAML và cấu trúc hạ tầng được kiểm tra tĩnh: PASS.
- SPQM structure verifier: PASS.

## Giới hạn kiểm chứng

Môi trường thực hiện không có Docker CLI/PostgreSQL/Redis runtime, vì vậy chưa thể tuyên bố các mục sau đã chạy thành công tại runtime:

- `docker compose up`.
- PostgreSQL integration trong container.
- SonarQube Quality Gate.
- k6 load test.
- Prometheus targets và Grafana dashboard.

Các cấu hình, healthcheck, CI smoke check và hướng dẫn đã được bổ sung. Nhóm phải chạy trên máy có Docker Desktop/GitHub Actions và lưu bằng chứng thật trong `docs/evidence/`.

## Ghi chú dependency SQLite

`sqlite3` được khai báo là optional dependency để image PostgreSQL Level 2 có thể bỏ qua native SQLite. Local Level 1 vẫn dùng SQLite và bộ test đã chạy với module này. Trong container kiểm tra, lần tải lại prebuilt từ GitHub bị lỗi DNS bên ngoài; trên Windows của dự án, `npm ci` trước đó đã cài thành công. Nếu máy cá nhân không cài được, kiểm tra đang dùng Node.js 22.x và kết nối mạng trước khi chạy test.
