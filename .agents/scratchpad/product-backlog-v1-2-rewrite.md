# Product Backlog v1.2 Rewrite - Execution Plan & Working Memory

> **Trạng thái**: COMPLETE
> **Mục tiêu chính**: BA re-baseline Product Backlog theo implementation audit 2026-10-25, ưu tiên sửa tồn đọng trước feature mới, bổ sung execution plan chi tiết và quality gates có thể kiểm chứng.
> **Phạm vi thực thi**: Chỉ thay đổi tài liệu trong `docs/` và scratchpad; không thay đổi logic sản phẩm.

## Giả định BA được khóa cho lần rewrite

- Giữ nguyên tên dự án kỹ thuật `study-web`; việc đổi brand/domain chưa được chấp thuận là scope của backlog rewrite.
- Giữ nguyên ID `PB-01`–`PB-15`; chỉ cập nhật trạng thái, acceptance criteria, evidence và dependency.
- Thêm backlog mới từ `PB-16`; P0/P1 remediation phải hoàn tất gate trước khi bắt đầu feature expansion.
- Payment provider chưa được chọn: chỉ lập discovery/contract/lifecycle item, không tự chọn nhà cung cấp.
- `Done` chỉ được dùng khi có evidence qua test/gate; build xanh hoặc UI tồn tại riêng lẻ không đủ.

## Baseline decisions

- **Status**: `Done`, `Partial`, `Not implemented`, `Blocked`, `Deferred`; trạng thái là kết quả hiện tại, không phải kế hoạch Sprint.
- **Priority**: `P0` release/security/data blocker; `P1` core contract/integrity; `P2` product completeness/UX; `P3` maintainability/docs.
- **Definition of Ready**: business outcome + actor + measurable AC + dependency/decision + affected modules + test strategy + owner/estimate trước khi vào implementation.
- **Definition of Done**: AC pass end-to-end; backend authorization/validation deny-by-default; migration/rollback nếu có data change; unit/contract/integration/E2E phù hợp; build/lint/budget; docs/evidence cập nhật.
- **Gate hierarchy**: `G0 Scope`, `G1 Security`, `G2 Contract`, `G3 Data/Migration`, `G4 Functional E2E`, `G5 Non-functional`, `G6 Release/Docs`. Gate fail là `No-Go`; không bắt đầu feature expansion khi `G1`–`G4` của stabilization chưa pass.

## Gap-to-backlog mapping

| Gap/audit source | Backlog owner |
|---|---|
| Registration response + duplicate `409` | PB-01 |
| Profile edit | PB-04 |
| Sample repository/Swagger links | PB-08 |
| Bug Hints severity/toggle | PB-10 |
| Submission lifecycle/types | PB-11 |
| Database migration reproducibility | PB-16 |
| Server-authoritative grading/private checks | PB-17 |
| Markdown stored XSS | PB-18 |
| Refresh revoke, OAuth URL secret, rate limit | PB-19 |
| Entitlement keys, locked payload, progress integrity, draft catalog leak | PB-20 |
| Admin/review API drift, ownership and audit | PB-21 |
| Change password, forgot password and complete account lifecycle | PB-22 |
| Saved series | PB-23 |
| Payment/subscription lifecycle | PB-24 (`Blocked` until provider/contract decision) |
| Shared server-side topic taxonomy | PB-25 |
| Real E2E, CI gates, bundle budgets and docs synchronization | PB-26 |
| GitHub/Webhook automated verification | PB-27 (`Deferred`, post-MVP) |

### Task 1: Chốt baseline và quy tắc BA

- [x] **Subtask 1.1**: Chốt status model, priority model, Definition of Ready/Done và release gate hierarchy.
  - *Files*: `docs/03-product-backlog.md`, `docs/reports/current-product-backlog-gap-audit.md`.
  - *Verify*: Quy tắc phân biệt `Done/Partial/Not implemented/Blocked` và P0–P3 không mâu thuẫn với audit.
- [x] **Subtask 1.2**: Lập mapping requirement cũ, gap audit và backlog mới.
  - *Files*: `docs/03-product-backlog.md`, `docs/workflows/*.md`, `docs/reports/current-product-backlog-gap-audit.md`.
  - *Verify*: Không mất ID PB-01–PB-15; mọi P0/P1 và feature gap có owner backlog.

### Task 2: Rewrite Product Backlog v1.2

- [x] **Subtask 2.1**: Rewrite metadata, BA summary, actor/epic/status và PB-01–PB-15.
  - *File*: `docs/03-product-backlog.md`.
  - *Verify*: 15 ID gốc còn đủ; status count đúng `3 Done / 10 Partial / 2 Not implemented`; Sprint SP cũ được sửa.
- [x] **Subtask 2.2**: Bổ sung remediation/enabler/feature items, dependency, DoR/DoD và gates.
  - *File*: `docs/03-product-backlog.md`.
  - *Verify*: Mọi P0/P1, chức năng ngoài backlog và debt release quan trọng được truy vết; feature mới bị chặn bởi stabilization gates.

### Task 3: Lập kế hoạch thực thi chi tiết

- [x] **Subtask 3.1**: Viết execution plan theo wave, task, module, dependency, test và exit gate.
  - *File*: `docs/reports/product-backlog-v1-2-execution-plan.md`.
  - *Verify*: Mỗi task chưa làm có implementation steps, evidence command/test và điều kiện Go/No-Go.

### Task 4: Đồng bộ tài liệu liên quan

- [x] **Subtask 4.1**: Sửa lỗi phân loại PB-03 và liên kết tới backlog v1.2 trong audit.
  - *File*: `docs/reports/current-product-backlog-gap-audit.md`.
  - *Verify*: Matrix và tổng count không còn mâu thuẫn.
- [x] **Subtask 4.2**: Cập nhật document register, timeline và cross-document issues.
  - *File*: `docs/README.md`.
  - *Verify*: Register trỏ đúng version/date/status; execution plan và audit được đăng ký.

### Task 5: Validation và handoff

- [x] **Subtask 5.1**: Validate cấu trúc docs, metadata, PB ID, SP, link nội bộ và gate traceability.
  - *Files*: `docs/03-product-backlog.md`, `docs/reports/*.md`, `docs/README.md`.
  - *Verify*: Script/check thủ công PASS; ghi rõ limitation nếu validator của skill không tồn tại.
- [x] **Subtask 5.2**: Rà soát git diff và xác nhận không sửa product code.
  - *Verify*: Diff chỉ gồm tài liệu/scratchpad thuộc scope; không ghi đè thay đổi người dùng.

