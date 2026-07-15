# Hướng dẫn kiểm tra FitLife và chuẩn bị nộp bài

## 1. Điều kiện máy

- Node.js 22.x.
- npm đi kèm Node.js.
- Docker Desktop để chạy Level 2–3.
- Git để tạo branch, commit và Pull Request.
- Python 3.12 chỉ cần khi kiểm tra service ngoài Docker.

Nên giải nén dự án vào đường dẫn ngắn, ví dụ `D:\fitlife-gym`, tránh sửa trực tiếp trong file ZIP.

## 2. Quality gate Level 1

Mở Git Bash tại thư mục dự án:

```bash
cd backend
npm ci
npm run init-db
npm run seed
npm run lint
npm run test:ci
```

Kết quả đạt phải có:

```text
Test Suites: 8 passed, 8 total
Tests:       142 passed, 142 total
```

Coverage phải không thấp hơn 80% ở cả bốn chỉ số. Kết quả đã đo trên bản này:

```text
Statements: 89.31%
Branches:   80.96%
Functions:  99.58%
Lines:      92.97%
```

Các dòng `console.log` có status `400`, `401`, `403`, `404` trong Jest có thể là tình huống lỗi được test chủ động; chỉ kết luận fail khi cuối log có `FAIL`, test fail hoặc coverage threshold fail.

### Frontend

```bash
cd ../frontend
npm ci
npm run lint
npm run build
```

Đạt khi lint không báo lỗi và Vite kết thúc bằng `built in ...`.

### Kiểm tra cấu trúc SPQM

Từ thư mục gốc:

```bash
node scripts/verify-spqm.js
python scripts/validate-infrastructure.py
```

Hai lệnh phải kết thúc với toàn bộ mục `PASS`.

## 3. Chạy ứng dụng Level 1

Terminal 1:

```bash
cd backend
npm run dev
```

Terminal 2:

```bash
cd frontend
npm run dev
```

Mở `http://localhost:5173`. API health ở `http://localhost:5000/api/health`.

## 4. Kiểm tra Level 2–3 bằng Docker

Mở Docker Desktop trước, sau đó tại thư mục gốc:

```bash
docker compose config
docker compose up -d --build
docker compose ps
```

Tất cả service chính phải ở trạng thái `running`/`healthy`:

- PostgreSQL, Redis.
- Backend.
- Analytics, Notification, Membership.
- Frontend.
- Prometheus, Grafana.

Kiểm tra health:

```text
http://localhost:5000/api/health
http://localhost:8001/health
http://localhost:8002/health
http://localhost:8003/health
```

### Load test k6

```bash
docker compose --profile loadtest run --rm k6
```

Đạt khi:

```text
http_req_failed rate < 1%
http_req_duration p(95) < 500 ms
checks rate > 99%
```

Lưu terminal output vào `docs/evidence/k6-result.txt`.

### Prometheus và Grafana

- Mở `http://localhost:9090/targets`, chụp ảnh bốn target ứng dụng ở trạng thái `UP`.
- Mở `http://localhost:3001`, đăng nhập bằng thông tin trong `.env` hoặc mặc định demo `admin/admin`, kiểm tra dashboard FitLife.

### SonarQube

```bash
docker compose --profile quality up -d sonarqube
```

Mở `http://localhost:9000`, đợi SonarQube sẵn sàng. Chạy scanner bằng GitHub Action đã cấu hình hoặc scanner local. Quality Gate phải Passed. Script mẫu tạo gate nằm ở `infra/sonarqube/setup-quality-gate.sh`.

## 5. Bằng chứng quy trình bắt buộc

Code không thể tự tạo các bằng chứng mang tính con người. Nhóm phải thực hiện thật:

1. Tạo branch `feature/...` hoặc `fix/...`.
2. Commit theo convention, ví dụ `fix(payment): return consistent payment response`.
3. Push branch và mở Pull Request.
4. Thành viên khác review và approve.
5. Chỉ merge khi GitHub Actions xanh.
6. Chụp ảnh/ghi URL PR, Actions, Sonar, k6, Prometheus và Grafana vào `docs/evidence/`.
7. Cập nhật `dora-metrics.csv` bằng dữ liệu thật.

Xem `docs/spqm/BRANCH-PROTECTION-SETUP.md` để cấu hình không cho push thẳng vào `main`.

## 6. Checklist nộp bài

- [ ] `npm run lint` backend PASS.
- [ ] `npm run test:ci` 142/142 PASS, coverage ≥80% cả bốn chỉ số.
- [ ] Frontend lint/build PASS.
- [ ] GitHub Actions xanh.
- [ ] Có PR thật và ít nhất một approval.
- [ ] PostgreSQL và ba FastAPI services health OK.
- [ ] Sonar Quality Gate Passed.
- [ ] k6 đạt SLO.
- [ ] Prometheus targets UP và Grafana có dữ liệu.
- [ ] Đủ sáu nhóm tài liệu A3.
- [ ] Không nộp `node_modules`, `.env`, database local hoặc mật khẩu thật.

## 7. Dừng hệ thống Docker

```bash
docker compose --profile quality --profile loadtest down
```

Muốn xóa toàn bộ dữ liệu Docker để chạy lại từ đầu:

```bash
docker compose --profile quality --profile loadtest down -v
```
