# FitLife Gym Management – SPQM Level 1–3

FitLife là hệ thống quản lý phòng gym và lịch tập được triển khai theo khung thực hành **Software Process and Quality Management (SPQM)**. Dự án không chỉ có frontend/backend nghiệp vụ mà còn có kiểm thử, quality gate, quy trình thay đổi, đo lường và quan trắc.

## Trạng thái kiểm chứng gần nhất

Các lệnh dưới đây đã được chạy trực tiếp trên bản đóng gói này:

- Backend ESLint: **PASS**.
- Jest/Supertest: **8/8 test suites, 142/142 test cases PASS**.
- Coverage: **Statements 89.31%, Branches 80.96%, Functions 99.58%, Lines 92.97%**.
- Frontend OXLint: **PASS, 0 lỗi/cảnh báo**.
- Frontend Vite production build: **PASS**.
- Cú pháp ba FastAPI services và kiểm tra tĩnh hạ tầng: **PASS**.

Docker/PostgreSQL runtime, SonarQube, k6, Prometheus và Grafana cần được chạy trên máy có Docker Desktop để tạo bằng chứng thực tế trước khi nộp. Không nên dùng ảnh hoặc số liệu giả.

## Kiến trúc theo ba Level

### Level 1 – Nền tảng

- Node.js + Express REST API.
- SQLite, script khởi tạo và seed dữ liệu.
- Jest + Supertest, ESLint.
- GitHub Actions CI.
- SDLC, Definition of Done, commit convention và baseline metrics.

### Level 2 – Mở rộng

- JWT và phân quyền `admin`, `trainer`, `member`.
- PostgreSQL runtime và script migration/seed.
- FastAPI service phụ.
- Docker Compose, structured logs, SonarQube.
- Pull Request template, CODEOWNERS và review workflow.
- Quality gate coverage đặt **80% cho cả 4 chỉ số**.

### Level 3 – Nâng cao

- Ba FastAPI microservices: Analytics, Notification, Membership.
- Redis cache.
- k6 load test với ngưỡng error rate `<1%`, p95 `<500 ms`.
- Prometheus + Grafana dashboard.
- GitHub quality gate và Sonar scan có thể chặn pipeline.
- DORA, SLO, CMMI mini assessment, PDCA, retrospective và ODA.

## Cấu trúc chính

```text
fitlife-gym/
├── backend/                    # Express core API, SQLite/PostgreSQL, Jest
├── frontend/                   # React + Vite
├── services/
│   ├── analytics-service/      # FastAPI :8001
│   ├── notification-service/   # FastAPI :8002
│   └── membership-service/     # FastAPI :8003
├── infra/
│   ├── postgres/
│   ├── prometheus/
│   ├── grafana/
│   └── sonarqube/
├── tests/k6/                   # Load test
├── docs/spqm/                  # Tài liệu A1–A3 và A3 bắt buộc
├── docs/evidence/              # Log kiểm chứng và nơi bổ sung ảnh thật
├── .github/workflows/          # CI và quality gate
├── docker-compose.yml
└── HUONG-DAN-KIEM-TRA-VA-NOP-BAI.md
```

## Chạy Level 1 trên máy local

```bash
cd backend
npm ci
npm run init-db
npm run seed
npm run lint
npm run test:ci
```

Terminal khác:

```bash
cd frontend
npm ci
npm run lint
npm run build
npm run dev
```

Backend development:

```bash
cd backend
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend health: `http://localhost:5000/api/health`

Tài khoản seed:

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Admin | `admin@fitlife.vn` | `admin123` |
| Trainer | `khang.trainer@fitlife.vn` | `trainer123` |
| Member | `ha.member@fitlife.vn` | `member123` |

## Chạy Level 2–3 bằng Docker

Có thể sao chép `.env.docker.example` thành `.env` để đổi mật khẩu demo, sau đó:

```bash
docker compose config
docker compose up -d --build
docker compose ps
```

Các địa chỉ:

- Frontend: `http://localhost:5173`
- Core API: `http://localhost:5000/api/health`
- Analytics: `http://localhost:8001/health`
- Notification: `http://localhost:8002/health`
- Membership: `http://localhost:8003/health`
- Prometheus: `http://localhost:9090/targets`
- Grafana: `http://localhost:3001`

SonarQube và k6 dùng profile riêng:

```bash
docker compose --profile quality up -d sonarqube
docker compose --profile loadtest run --rm k6
```

## Tài liệu cần đọc trước khi nộp

1. `HUONG-DAN-KIEM-TRA-VA-NOP-BAI.md`.
2. `docs/spqm/A1-A2-A3-COMPLIANCE-MATRIX.md`.
3. `docs/spqm/TEST-PLAN-FULL.md`.
4. `docs/evidence/README.md`.

Dự án sử dụng cho mục đích học tập.
