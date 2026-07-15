# FINAL SUBMISSION CHECKLIST

## Source
- [ ] Backend đầy đủ.
- [ ] Frontend đầy đủ.
- [ ] Không commit node_modules.
- [ ] Không commit coverage.
- [ ] Không commit dist.
- [ ] Kiểm tra `.env` và secrets.

## Backend
```bash
cd /d/fitlife-gym/fitlife-gym/backend
npm run init-db
npm run seed
npm run lint
npm run test:ci
```
Expected: 142/142 tests passed, lint đạt và cả bốn coverage metrics ≥80%.

## Frontend
```bash
cd /d/fitlife-gym/fitlife-gym/frontend
npm run lint
npm run build
```
Expected: 0 warnings/errors và build success.

## Demo
- [ ] Login.
- [ ] Dashboard thật.
- [ ] Members.
- [ ] Packages.
- [ ] Trainers.
- [ ] Classes.
- [ ] Check-in.
- [ ] Payments.
- [ ] Reports.
- [ ] Test/Coverage.
- [ ] Folder phân công.

## Git
```bash
cd /d/fitlife-gym/fitlife-gym
git status
git add docs
git commit -m "docs: complete final project documentation"
git push origin <ten-branch>
```

## Cảnh báo
Repository từng liệt kê `backend/.env`. Nếu repository public, phải chắc chắn file này không chứa secret thật và được ignore phù hợp.
