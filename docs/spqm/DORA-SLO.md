# DORA Metrics và SLO

## DORA

| Metric | Cách thu thập | Mục tiêu sprint |
|---|---|---|
| Deployment frequency | Số release/tag mỗi tuần | ≥1 release/tuần |
| Lead time for changes | Commit đầu PR → deploy thành công | ≤2 ngày |
| Change failure rate | Deploy gây rollback/hotfix / tổng deploy | <15% |
| Mean time to restore | Incident mở → service ổn định | <60 phút |

Không điền số liệu giả. File `docs/evidence/dora-metrics.csv` phải được cập nhật từ GitHub PR, Actions và incident log thật.

## SLO kỹ thuật

- Availability API: ≥99.5% theo cửa sổ 30 ngày.
- HTTP 5xx: <1% request.
- p95 latency: <500 ms cho health/plans/payments/dashboard trong profile k6.
- CI quality gate success: ≥80% runs trong sprint.
- Cache membership: cache hit ratio mục tiêu ≥40% sau warm-up.

## Error budget

Availability 99.5% cho phép tối đa khoảng 3 giờ 36 phút gián đoạn trong 30 ngày. Khi dùng >75% error budget, dừng feature không khẩn cấp và ưu tiên reliability.
