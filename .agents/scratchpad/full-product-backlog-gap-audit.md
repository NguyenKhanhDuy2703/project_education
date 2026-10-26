# Full Website & Product Backlog Gap Audit - Execution Plan & Working Memory

> **Trạng thái**: COMPLETE
> **Mục tiêu chính**: Đối chiếu toàn bộ Product Backlog hiện tại với implementation thực tế của Backend, Learner Frontend và Admin Frontend; xác định chức năng chưa làm/làm dở và các vấn đề chưa được xử lý, kèm bằng chứng và mức độ ưu tiên.
> **Phạm vi mặc định**: `docs/03-product-backlog.md`, tài liệu liên quan trong `docs/`, `MODULE_BE/`, `MODULE_FE/`, `MODULE_ADMIN/`, và test E2E/integration/unit trong repo.
> **Không thuộc phạm vi**: Sửa code, thay đổi backlog, migration dữ liệu hoặc triển khai production. Các hành động này chỉ được đề xuất sau audit.

## Tiêu chí phân loại

- **Done**: Có luồng end-to-end dùng được, kiểm soát quyền/dữ liệu hợp lệ, xử lý loading/error/empty state cần thiết và có bằng chứng kiểm thử phù hợp.
- **Partial**: Có một phần UI/API/data model nhưng thiếu mắt xích hoặc thiếu xử lý quan trọng.
- **Not implemented**: Không tìm thấy implementation khả dụng tương ứng với backlog/acceptance criteria.
- **Unverified**: Có code nhưng không đủ bằng chứng runtime/test để kết luận hoạt động.
- **Problem**: Lỗi, rủi ro, inconsistency hoặc debt chưa được handle; phân loại theo Functional, Security/Permission, Data/Lifecycle, Error/Edge case, Performance, UX/Accessibility, Test/Release.

### Task 1: Chuẩn hóa nguồn yêu cầu và ma trận truy vết

- [x] **Subtask 1.1**: Đọc toàn bộ Product Backlog và metadata/revision/open issues (Files: `docs/03-product-backlog.md`, `docs/README.md`).
  - *Verify*: Mọi ID backlog, priority, sprint, actor và acceptance criteria được ghi vào ma trận; không mất ID gốc.
- [x] **Subtask 1.2**: Đọc các tài liệu scope có liên quan để nhận diện requirement mới hơn hoặc mâu thuẫn (Files: `docs/workflows/*.md`, `docs/specs/*.md`, `docs/07-*.md` đến `docs/14-*.md`, `README*.md`).
  - *Verify*: Liệt kê nguồn chuẩn cho từng nhóm chức năng và mọi mâu thuẫn giữa backlog với tài liệu mới hơn.

### Task 2: Audit implementation theo ba module

- [x] **Subtask 2.1**: Audit Backend từ route/controller qua service, guard, Prisma schema/migration và validation (Files: `MODULE_BE/src/**`, `MODULE_BE/prisma/**`).
  - *Verify*: Mỗi capability backend có evidence cụ thể; kiểm tra auth/authz, ownership, validation, lifecycle và error mapping.
- [x] **Subtask 2.2**: Audit Learner/Contributor Frontend theo route, page, component, store, API client và UI state (Files: `MODULE_FE/src/**`).
  - *Verify*: Mỗi user-facing backlog item được lần theo UI → API → response/error/loading/empty state.
- [x] **Subtask 2.3**: Audit Admin Frontend theo route, permission gate, CRUD/review/governance flow và API integration (Files: `MODULE_ADMIN/src/**`).
  - *Verify*: Mỗi admin backlog item được lần theo UI → permission → API → persistence/audit trail.

### Task 3: Audit kiểm thử và phát hiện problem chưa handle

- [x] **Subtask 3.1**: Đối chiếu test hiện có với acceptance criteria và luồng critical (Files: `MODULE_BE/test/**`, `MODULE_FE/src/test/**`, `MODULE_ADMIN/src/test/**`, `tests/e2e/**`).
  - *Verify*: Có coverage matrix và danh sách AC/edge case chưa có test hoặc test chỉ mock.
- [x] **Subtask 3.2**: Quét TODO/FIXME/mock/stub/dead route/feature flag và kiểm tra consistency FE-BE contract.
  - *Verify*: Mỗi phát hiện có file/line hoặc lệnh kiểm chứng, loại trừ false positive rõ ràng.
- [x] **Subtask 3.3**: Chạy static checks/build/test phù hợp cho từng module sau khi đã đọc script trong `package.json`.
  - *Verify*: Ghi chính xác lệnh, kết quả pass/fail, lỗi môi trường và lỗi sản phẩm; không đánh đồng build pass với chức năng hoàn chỉnh.

### Task 4: Tổng hợp báo cáo gap audit

- [x] **Subtask 4.1**: Lập ma trận backlog `ID → trạng thái → evidence → gap → severity → đề xuất`.
  - *Verify*: 100% backlog ID có kết luận hoặc đánh dấu `Unverified` kèm lý do.
- [x] **Subtask 4.2**: Xếp hạng problem theo P0/P1/P2/P3 và nhóm quick wins so với thay đổi kiến trúc.
  - *Verify*: Mỗi priority có impact, likelihood, affected actor và tiêu chí nghiệm thu rõ ràng.
- [x] **Subtask 4.3**: Viết báo cáo audit trong `docs/reports/` và cập nhật scratchpad.
  - *Verify*: Báo cáo có executive summary, feature gaps, unresolved problems, evidence, limitations và recommended next steps; link nội bộ hợp lệ.

### Task 5: Kiểm tra chéo cuối cùng

- [x] **Subtask 5.1**: Rà soát toàn bộ kết luận để tránh suy diễn từ tên file, UI mock hoặc test mock.
  - *Verify*: Mọi kết luận Done/Partial/Not implemented có ít nhất một bằng chứng trực tiếp và không mâu thuẫn với kết quả build/test.
- [x] **Subtask 5.2**: Kiểm tra git diff để bảo đảm audit không sửa logic sản phẩm.
  - *Verify*: Chỉ có scratchpad và báo cáo audit được thêm/sửa.

## Ghi chú skill/fallback

- `docs-as-code` yêu cầu đọc `references/product-backlog.md` và `references/cross-check.md`, nhưng bản skill trong repo hiện chỉ chứa `SKILL.md`; hai reference trên không tồn tại. Audit sẽ dùng checklist được mô tả trực tiếp trong `SKILL.md` và ghi rõ limitation này.
