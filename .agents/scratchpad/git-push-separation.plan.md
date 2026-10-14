# KẾ HOẠCH ĐẨY MÃ NGUỒN LÊN GIT (GIT PUSH & BRANCH SEPARATION PLAN)

> **Dự án**: StudyWeb Platform  
> **Tuân thủ quy chuẩn**: [`.agents/rules/git-workflow.md`](../rules/git-workflow.md) & [`.agents/rules/plan-and-execute.md`](../rules/plan-and-execute.md)  
> **Trạng thái**: ⏸️ **Chờ Người Dùng Xác Nhận (Human User Confirmation Gate)**  

---

## 🎯 MỤC TIÊU & NGUYÊN TẮC CỐT LÕI

1. **Tuân thủ cách ly Monorepo**: Tuyệt đối không commit lẫn lộn giữa `MODULE_BE` và `MODULE_FE`. Bộ lọc `dorny/paths-filter` của GitHub Actions CI/CD sẽ chỉ kích hoạt đúng worker tương ứng, tối ưu thời gian pipeline.
2. **Quy tắc đặt tên nhánh**: `<loại-nhánh>/<mã-tác-vụ>-<mô-tả-ngắn>` tạo từ nhánh tích hợp gốc `dev`.
3. **Chuẩn hoá Conventional Commits**: `<type>(<scope>): <mô tả ngắn>` (`feat(be)`, `feat(fe)`, `docs`).
4. **Pre-push Quality Gate**: Đảm bảo cả 2 module build thành công (`0 error`) trước khi push lên remote.

---

## 📋 CHI TIẾT TỪNG TASK THỰC THI (TWO-TIER HIERARCHY)

### Task 1: Đồng bộ nhánh gốc `dev` & Pre-check Quality Gates
- [ ] **1.1. Cập nhật nhánh `dev` với `origin/dev`**: `git checkout dev && git pull origin dev`
- [ ] **1.2. Pre-push Check cho Backend**: `cd MODULE_BE && npm run build` (exit code 0)
- [ ] **1.3. Pre-push Check cho Frontend**: `cd MODULE_FE && npm run build` (exit code 0)

### Task 2: Đẩy Nhánh Backend (`MODULE_BE`)
- **Tên nhánh**: `feat/BE-auth-cookie-seed-and-verification`
- **Scope Conventional Commit**: `feat(be)`
- **Commit Message**: `feat(be): add refresh token cookie handling, fix seed password, and add verification suite`
- [ ] **2.1. Tạo nhánh BE**: `git checkout -b feat/BE-auth-cookie-seed-and-verification dev`
- [ ] **2.2. Stage chỉ các file Backend**: `git add MODULE_BE/`
- [ ] **2.3. Tạo commit**: `git commit -m "feat(be): add refresh token cookie handling, fix seed password, and add verification suite"`
- [ ] **2.4. Push lên GitHub**: `git push -u origin feat/BE-auth-cookie-seed-and-verification`

### Task 3: Đẩy Nhánh Frontend (`MODULE_FE`)
- **Tên nhánh**: `feat/FE-admin-dashboard-and-topic-tags`
- **Scope Conventional Commit**: `feat(fe)`
- **Commit Message**: `feat(fe): enhance admin dashboard with pagination, topic tag management, split-view groups, and feedback loop`
- [ ] **3.1. Tạo nhánh FE**: `git checkout -b feat/FE-admin-dashboard-and-topic-tags dev`
- [ ] **3.2. Stage chỉ các file Frontend**: `git add MODULE_FE/`
- [ ] **3.3. Tạo commit**: `git commit -m "feat(fe): enhance admin dashboard with pagination, topic tag management, split-view groups, and feedback loop"`
- [ ] **3.4. Push lên GitHub**: `git push -u origin feat/FE-admin-dashboard-and-topic-tags`

### Task 4: Đẩy Nhánh Tài Liệu Hệ Thống & Quy Chuẩn (`docs`)
- **Tên nhánh**: `docs/system-workflows-and-verification-report`
- **Scope Conventional Commit**: `docs`
- **Commit Message**: `docs: document 12 standalone system workflows, plan-and-execute protocols, and error verification report`
- [ ] **4.1. Tạo nhánh docs**: `git checkout -b docs/system-workflows-and-verification-report dev`
- [ ] **4.2. Stage file tài liệu và agent rules**: `git add docs/ AGENTS.md .agents/`
- [ ] **4.3. Tạo commit**: `git commit -m "docs: document 12 standalone system workflows, plan-and-execute protocols, and error verification report"`
- [ ] **4.4. Push lên GitHub**: `git push -u origin docs/system-workflows-and-verification-report`

### Task 5: Quay Trở Lại Nhánh `dev` & Xác Nhận Trạng Thái
- [ ] **5.1. Quay lại nhánh chính**: `git checkout dev`
- [ ] **5.2. Kiểm tra Git Status**: `git status`
