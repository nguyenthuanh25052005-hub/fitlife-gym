# Test Plan FitLife

- Unit/Integration: Jest + Supertest, chạy tuần tự trên SQLite baseline.
- Static: ESLint backend, OXLint frontend, SonarQube.
- Build: Vite production build.
- Database: init/seed SQLite; migration/seed PostgreSQL trong CI.
- Contract smoke: health, auth, role, CRUD, payment, booking, check-in.
- Load: k6 10→30 VU, p95 <500 ms, error <1%, check rate >99%.
- Monitoring: Prometheus scrape core + 3 services; Grafana dashboard provision tự động.
- Regression rule: mỗi bug production hoặc test fail phải có test tái hiện trước khi sửa.

## Lệnh gate chính

```bash
cd backend
npm ci
npm run init-db
npm run seed
npm run lint
npm run test:ci

cd ../frontend
npm ci
npm run lint
npm run build
```
