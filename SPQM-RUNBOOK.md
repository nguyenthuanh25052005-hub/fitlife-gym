# FitLife SPQM Runbook

Hướng dẫn đầy đủ nằm ở `HUONG-DAN-KIEM-TRA-VA-NOP-BAI.md`.

## Level 1

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

## Level 2–3

```bash
docker compose config
docker compose up -d --build
docker compose --profile loadtest run --rm k6
```

- UI: http://localhost:5173
- Core API: http://localhost:5000/api/health
- Analytics: http://localhost:8001/health
- Notification: http://localhost:8002/health
- Membership: http://localhost:8003/health
- Prometheus: http://localhost:9090/targets
- Grafana: http://localhost:3001
- SonarQube: http://localhost:9000 khi bật profile `quality`
