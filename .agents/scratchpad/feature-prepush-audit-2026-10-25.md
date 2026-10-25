# Feature Pre-push Audit - Execution Plan & Working Memory

> **Trạng thái**: HOÀN TẤT (COMPLETE) — verified 2026-10-25
> **Mục tiêu chính**: Rà toàn bộ thay đổi trên `feat/ui-ux-localization-dashboard`, loại file rác an toàn, kiểm tra lỗi, sửa lỗi thuộc phạm vi feature, rồi commit và push lên `origin` theo convention của monorepo.

---

### Task 1: Inventory và phân loại thay đổi
- [x] **Subtask 1.1**: Kiểm tra status, diff/stat, ignore rules và dấu hiệu generated/temp/line-ending (Files: toàn repo)
  - *Verify*: Có danh sách thay đổi được phân loại và không xóa nhầm dữ liệu người dùng.
  - *Evidence*: Build/cache/env/report runtime đều đã bị ignore; các file xóa có plan pruning/demo cleanup; `.archify` được các plan tài liệu tham chiếu trực tiếp; `git diff --check` pass.
- [x] **Subtask 1.2**: Xác định scripts kiểm tra cho `MODULE_BE`, `MODULE_FE`, `MODULE_ADMIN` (Files: package manifests/config)
  - *Verify*: Ghi nhận được các lệnh lint/typecheck/test/build hợp lệ.
  - *Evidence*: BE có `test`/`build`; FE có `lint`/`test`/`build`; Admin có `test`/`build`; E2E có Playwright `test`.

### Task 2: Tiền xử lý và dọn sạch
- [x] **Subtask 2.1**: Loại bỏ hoặc ignore artifact rác đã xác minh; chuẩn hóa các thay đổi không chủ ý (Files: chỉ các artifact đã chứng minh là rác)
  - *Verify*: `git status --short` chỉ còn source, test, migration, docs và metadata cần thiết.
  - *Evidence*: Đã xóa dist, tsbuildinfo, Playwright/test result và mypy cache. Một `__pycache__` dưới skill có ACL deny-delete nhưng đã được ignore và không vào commit; giữ nguyên `node_modules`/`.env` cục bộ.
- [x] **Subtask 2.2**: Rà diff để tìm secret, debug code, TODO bất thường, binary/generated output (Files: staged candidate set)
  - *Verify*: Không có secret hoặc artifact build/runtime được đưa vào commit.
  - *Evidence*: Không có changed file >1 MiB, private key hoặc credential thật. Token/password matches là fixture giả; TODO là nội dung bài học/test; console output chỉ nằm trong CLI/seed/benchmark tooling. `git diff --check` pass.

### Task 3: Problem checks và sửa lỗi
- [x] **Subtask 3.1**: Chạy lint/typecheck/test/build phù hợp cho Backend (Files: `MODULE_BE/**`)
  - *Verify*: Các gate Backend hoàn tất hoặc lỗi được sửa/ghi nhận rõ.
  - *Evidence*: `npm test` pass 56/56; `npm run build` pass.
- [x] **Subtask 3.2**: Chạy lint/typecheck/test/build phù hợp cho Frontend (Files: `MODULE_FE/**`)
  - *Verify*: Các gate Frontend hoàn tất hoặc lỗi được sửa/ghi nhận rõ.
  - *Evidence*: `oxlint` exit 0 với warnings; Vitest pass 280/280; production build pass. Correctness warnings trong file feature được tách sang 3.2a.
- [x] **Subtask 3.2a**: Sửa lint warnings phát sinh trong feature mới (Files: `useContainerBreakpoint.ts`, `AutomationV3Workspace.tsx`, `LabWorkspacePage.tsx`, `CurriculumDrawerSheet.tsx` nếu cần)
  - *Verify*: Không còn warning mức correctness trong các file feature đã thay đổi; focused tests và FE build vẫn pass.
  - *Evidence*: Loại truy cập ref khi render, mutation accumulator, unstable dynamic component identity và dependency instability; focused oxlint sạch, 24/24 focused tests pass, `tsc -b` và Vite build pass.
- [x] **Subtask 3.3**: Chạy lint/typecheck/test/build phù hợp cho Admin (Files: `MODULE_ADMIN/**`)
  - *Verify*: Các gate Admin hoàn tất hoặc lỗi được sửa/ghi nhận rõ.
  - *Evidence*: Vitest pass 49/49; production build pass. Chỉ còn cảnh báo kích thước bundle hiện hữu.
- [x] **Subtask 3.4**: Chạy các kiểm tra tích hợp/e2e khả dụng và kiểm tra migration/schema (Files: `tests/**`, Prisma files)
  - *Verify*: Gate tích hợp quan trọng hoàn tất hoặc hạn chế môi trường được ghi nhận.
  - *Evidence*: Prisma validate pass; Playwright footer + SQL benchmark pass 3/3. Benchmark functionality pass nhưng verdict ngân sách `FAIL`: cold init ~2.65s và runtime asset lớn nhất ~10.01 MiB; đây là release gate đã được tài liệu hóa, không phải blocker để push feature branch.

### Task 4: Git audit, commit và push
- [x] **Subtask 4.1**: Rà final diff, trạng thái xóa/thêm, kích thước file và commit scope (Files: toàn repo)
  - *Verify*: Diff cuối không chứa file rác, secret hoặc thay đổi ngoài phạm vi.
  - *Evidence*: 354 changed/untracked files (~29.5 MiB), không file đơn >1 MiB, không conflict marker/unmerged path, `git diff --check` pass. Phần lớn số lượng file là skill Archify vendored và tài liệu HTML được plan tham chiếu.
- [x] **Subtask 4.2**: Stage và tạo Conventional Commit phù hợp (Files: bộ thay đổi đã audit)
  - *Verify*: Commit được tạo thành công, working tree đúng kỳ vọng.
  - *Evidence*: Đã tạo 4 commit theo scope: `feat(be)`, `feat(fe)`, `feat(admin)`, `docs`; từng staged diff đều qua `git diff --cached --check`. Whitespace trong artifact/docs được chuẩn hóa trước commit.
- [x] **Subtask 4.3**: Push branch lên `origin` và xác minh remote tracking
  - *Verify*: `origin/feat/ui-ux-localization-dashboard` trỏ tới commit vừa tạo.
  - *Evidence*: Push đầu tiên thành công từ `9f18107` tới `9205530`; audit record được commit/push riêng sau khi đóng checklist và SHA remote được đối chiếu ở final verification.
