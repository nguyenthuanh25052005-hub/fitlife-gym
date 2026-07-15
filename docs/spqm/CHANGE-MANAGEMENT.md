# Git Workflow và quản lý thay đổi

## Nhánh

- `main`: ổn định, chỉ merge qua PR.
- `develop`: tích hợp sprint.
- `feature/<ticket>-<mo-ta>`, `fix/<ticket>-<mo-ta>`, `docs/<ticket>-<mo-ta>`.

## Commit convention

`type(scope): mô tả ngắn`

Các type: `feat`, `fix`, `test`, `refactor`, `docs`, `ci`, `chore`, `perf`.

Ví dụ: `fix(payment): return created payment in response`.

## Pull Request

1. Liên kết backlog/ticket.
2. Điền đầy đủ PR template.
3. CI phải xanh; coverage không được giảm dưới gate.
4. Một thành viên khác review; tác giả xử lý toàn bộ comment.
5. Squash merge vào `develop`; release PR từ `develop` sang `main`.

## PDCA áp dụng cho lỗi coverage/payment

- **Plan:** sửa response payment và tăng coverage từ baseline statements 54.92%/branches 39.38% lên ≥80% cả bốn chỉ số.
- **Do:** sửa payment response, pay-debt, seed/database lifecycle; bổ sung regression và integration test cho các module còn thiếu.
- **Check:** 8/8 suites và 142/142 tests pass; coverage S 89.31%, B 80.96%, F 99.58%, L 92.97%.
- **Act:** đặt threshold 80% trong Jest và GitHub Actions để tự động chặn regression.
