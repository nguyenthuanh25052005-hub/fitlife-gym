# Risk Register
| Risk | Xác suất | Tác động | Giảm thiểu |
|---|---|---|---|
| SQLite lock khi tải cao | Medium | High | profile PostgreSQL; transaction; load test |
| Ảnh hóa đơn quá lớn | Medium | Medium | giới hạn JSON 12MB và validation frontend |
| Polling tăng request | Medium | Medium | Redis/event-driven ở giai đoạn nâng cao |
| Token còn hiệu lực sau khi xóa user | Low | High | middleware kiểm tra trạng thái tài khoản |
| Sai timezone | Medium | Medium | TZ Asia/Ho_Chi_Minh và ISO timestamps |
| Merge phá luồng thanh toán | Medium | High | PR review + regression suite + quality gate |
