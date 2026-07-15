# Evidence cần nộp

## Evidence có sẵn từ lần kiểm tra local

- `backend-quality.txt`: init/seed, lint, Jest và coverage.
- `backend-production-dependencies.txt`: dependency install của image PostgreSQL.
- `frontend-quality.txt`: frontend lint/build.
- `coverage-summary.json`: số liệu coverage máy đọc được.
- `spqm-verification.txt`: kiểm tra cấu trúc A1–A3.
- `infrastructure-static-validation.txt`: kiểm tra tĩnh YAML/JSON/config.

## Evidence nhóm phải tạo thật

1. `github-actions.png`: pipeline xanh.
2. `pull-request-review.png` và URL PR: reviewer khác tác giả.
3. `sonarqube-gate.png`: Quality Gate Passed và issue count.
4. `k6-result.txt` hoặc ảnh: p95/error/check thresholds.
5. `prometheus-targets.png`: bốn target ứng dụng UP.
6. `grafana-dashboard.png`: dashboard có dữ liệu.
7. `dora-metrics.csv`: dữ liệu PR/deploy thật.

Không tạo, chỉnh sửa hoặc trình bày ảnh/số liệu giả.
