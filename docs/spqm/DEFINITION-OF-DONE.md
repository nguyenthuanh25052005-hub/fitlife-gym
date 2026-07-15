# Definition of Done

Một user story chỉ được chuyển sang **Done** khi:

- Acceptance criteria đã được kiểm tra.
- Code nằm trên feature/fix branch, không push trực tiếp `main`.
- Có test phù hợp; bug fix phải có regression test.
- Backend ESLint 0 lỗi; frontend lint 0 lỗi/cảnh báo.
- Tất cả Jest/Supertest pass; statements, branches, functions và lines đều ≥80%.
- Frontend build thành công.
- Không có bug/vulnerability mới vi phạm Sonar Quality Gate.
- PR có mô tả, ticket, cách test và ít nhất 1 approval từ người không phải tác giả.
- API, database và runbook được cập nhật khi thay đổi hành vi.
- Không commit `.env`, token, mật khẩu thật hoặc dữ liệu cá nhân.
- Thay đổi Level 3 có đánh giá ảnh hưởng SLO, load test hoặc monitoring khi liên quan.
