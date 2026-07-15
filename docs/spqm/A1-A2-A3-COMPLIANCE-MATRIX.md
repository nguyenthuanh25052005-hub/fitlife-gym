# Ma trận đáp ứng A1–A3 – FitLife

## A1. Ba Level

| Yêu cầu | Bằng chứng trong dự án | Trạng thái |
|---|---|---|
| L1 Node.js + Express REST API | `backend/src/app.js`, các module `/api/*` | Đã triển khai |
| L1 SQLite | `backend/src/database/sqliteDb.js`, `init.js`, `seed.js` | Đã chạy local |
| L1 Jest, ESLint, CI | `backend/tests`, `eslint.config.js`, `backend-ci.yml` | 142/142 test pass; lint pass |
| L1 coverage ≥70% | Jest gate đặt 80% cho cả bốn metric | Đạt: S 89.31, B 80.96, F 99.58, L 92.97 |
| L1 SDLC, DoD, commit convention, baseline | `docs/spqm` | Đã tài liệu hóa |
| L2 JWT và phân quyền | `authMiddleware.js`, `roleMiddleware.js` | Đã triển khai và test |
| L2 workflow nghiệp vụ | Hội viên → gói → thanh toán → lớp/booking → check-in | Đã triển khai và test |
| L2 PostgreSQL | Adapter, schema, migration/seed scripts | Đã cấu hình; cần bằng chứng Docker/CI runtime |
| L2 FastAPI | Analytics, Notification, Membership | Đã triển khai; syntax pass |
| L2 Docker Compose | `docker-compose.yml` | Cấu hình đầy đủ; cần chạy trên Docker Desktop |
| L2 SonarQube | Compose profile, properties, setup gate | Cấu hình; cần ảnh Quality Gate thật |
| L2 coverage ≥80% | 80% cho statements/branches/functions/lines | Đạt local |
| L2 review và quản lý thay đổi | PR template, CODEOWNERS, workflow | Công cụ có; nhóm phải tạo PR/review thật |
| L3 ≥3 microservices | Analytics 8001, Notification 8002, Membership 8003 | Đã triển khai |
| L3 Redis | Cache analytics/membership/notification | Đã triển khai |
| L3 k6 | `tests/k6/payment-flow.js` | Cấu hình SLO; cần chạy runtime |
| L3 Prometheus + Grafana | `infra/prometheus`, Grafana provisioning/dashboard | Đã cấu hình; cần ảnh runtime |
| L3 Quality Gate chặn pipeline | Jest threshold + Actions + Sonar wait | Đã cấu hình; branch protection cần bật trên GitHub |
| L3 DORA, SLO, retrospective | Bộ tài liệu SPQM | Đã có mẫu/phương pháp; cập nhật số liệu thật |

## A2. Tech stack

- Backend Level 1: Express + SQLite.
- Level 2: Express + PostgreSQL + FastAPI + Docker Compose + SonarQube.
- Level 3: core API + ba FastAPI services + Redis + k6 + Prometheus + Grafana.

## A3. Sáu hạng mục SPQM bắt buộc

1. Quy trình: `SDLC-AND-ROLES.md`.
2. Kế hoạch/ưu tiên: `PRODUCT-BACKLOG-SMART.md`.
3. Quản lý thay đổi: `CHANGE-MANAGEMENT.md`, PR template, branch protection guide.
4. Đo lường: `QUALITY-METRICS-BASELINE.md`, evidence coverage/CI/Sonar/DORA.
5. Đánh giá quy trình: `CMMI-PDCA-RETROSPECTIVE.md`.
6. Cải tiến/tổng kết: PDCA, retrospective và ODA.

> Những mục “cần bằng chứng runtime/thật” không được coi là hoàn thành chỉ vì có file cấu hình. Nhóm phải chạy và lưu ảnh/log trước khi nộp.
