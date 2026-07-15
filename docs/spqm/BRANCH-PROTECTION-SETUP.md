# Cấu hình Branch Protection và Quality Gate

Trên GitHub repository:

1. Vào **Settings → Branches → Add branch protection rule**.
2. Branch name pattern: nhánh mặc định của nhóm (`main` hoặc `master`).
3. Bật **Require a pull request before merging**.
4. Required approvals: ít nhất `1`.
5. Bật **Dismiss stale pull request approvals when new commits are pushed**.
6. Bật **Require status checks to pass before merging**.
7. Chọn các check của workflow: `backend-quality`, `automated-gate`; thêm `sonar-quality-gate` khi Sonar đã cấu hình.
8. Bật **Require branches to be up to date before merging**.
9. Bật **Do not allow bypassing the above settings** nếu tài khoản/quyền repository cho phép.
10. Không cho phép force push và xóa branch mặc định.

Sau đó tạo một PR thử, để thành viên khác review và chụp ảnh trang PR có approval cùng pipeline xanh làm bằng chứng.

`CODEOWNERS` đang dùng tên mẫu; thay bằng GitHub username thật của nhóm trước khi push.
