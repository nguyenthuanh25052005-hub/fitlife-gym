# TESTING AND QUALITY ASSURANCE

## 1. Quality gates
1. Automated API tests.
2. Coverage.
3. Backend lint.
4. Frontend lint.
5. Production build.
6. CI.
7. Manual integration test.

## 2. Test suites
- `authDashboard.test.js`
- `coverageBoost.test.js`
- `members.test.js`
- `operations.test.js`
- `plansMemberships.test.js`
- `trainers.test.js`
- `userAdminConsultation.test.js`
- `qualityBranches.test.js`

## 3. Kết quả
```text
Test Suites: 8 passed, 8 total
Tests: 142 passed, 142 total
```

| Metric | Result |
|---|---:|
| Statements | 89.31% |
| Branches | 80.96% |
| Functions | 99.58% |
| Lines | 92.97% |

Global quality gate đặt 80% cho statements, branches, functions và lines. Chi tiết theo file xem `docs/evidence/backend-quality.txt`.

## 4. Lint và build
Backend:
```bash
cd backend
npm test
npm run lint
```

Frontend:
```bash
cd frontend
npm run lint
npm run build
```

Kết quả frontend cuối: 0 warnings, 0 errors; Vite production build thành công.

## 5. Lỗi đã sửa
ReportsPage từng có 3 warning `react-hooks(exhaustive-deps)` do object fallback thay đổi mỗi render. Sau khi sửa, lint chạy sạch.

## 6. Điểm cần cải tiến
- Tách test DB khỏi dev DB.
- Cleanup test records.
- Duy trì branch coverage trên quality gate 80%.
- Thêm frontend tests.
- Thêm E2E.
- Thêm frontend CI.
