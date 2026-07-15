# Tự đánh giá CMMI, Retrospective, PDCA và ODA

## CMMI mini assessment

Mức hiện tại đề xuất: **Level 2 – Managed**, đang xây nền để tiến đến Level 3.

Bằng chứng: backlog ưu tiên, DoD, branch/PR workflow, CI gate, test plan, baseline metrics, risk register và cấu hình monitoring. Gap còn lại để chứng minh Level 3 ổn định: tối thiểu hai sprint có xu hướng đo lường, Pull Request review thật, DORA lấy từ repository và bằng chứng vận hành Docker/monitoring.

## Sprint Retrospective

- **Went well:** nghiệp vụ FitLife rộng; 142 integration/unit tests pass; payment workflow và seed ổn định; coverage vượt 80% ở cả bốn chỉ số.
- **Did not go well:** bản đầu có test payment fail, coverage thấp và SQLite close handle sai; cấu hình nâng cao chưa có bằng chứng runtime.
- **Root cause:** DoD cũ chưa bắt regression test và full quality gate trước merge; thay đổi được gom quá lớn.
- **Action:** gate 80%, regression test, reset database theo FK, Docker healthcheck, evidence owner và PR nhỏ hơn.
- **Owner/deadline:** QA/SPQM owner cập nhật evidence vào cuối mỗi sprint; DevOps owner xác nhận Docker/Sonar/k6 trước buổi bảo vệ.

## PDCA

- Plan: 0 test fail, coverage ≥80% cả bốn chỉ số.
- Do: sửa controller/database, thêm test và infrastructure.
- Check: dùng log Jest, CI, Sonar và k6 so với baseline.
- Act: quality gate tự động, branch protection và action item cho sprint tiếp theo.

## ODA

- **Observe:** test fail và coverage thấp làm Level 1 không đạt.
- **Diagnose:** response API không đồng nhất, endpoint thiếu test, seed không idempotent, quality gate chưa chặn thay đổi.
- **Act:** chuẩn hóa controller/seed, bổ sung test, CI gate, monitoring và tài liệu hóa quy trình.
