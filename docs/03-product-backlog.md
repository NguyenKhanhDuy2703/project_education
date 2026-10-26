---
doc_type: product-backlog
title: Product Backlog study-web — Stabilization First
project: study-web
version: "1.3"
version_source: repository-audit
authors:
  - {name: Nguyen Khanh Duy, alias: Kduy, role: Product Owner & Fullstack Lead}
scope: Core Web, Lab Series, learning workspace, grading, entitlements, admin governance, account lifecycle, manual billing and release readiness
date: 2026-10-26
source_file: "Repository implementation, docs/workflows, docs/reports/current-product-backlog-gap-audit.md"
status: draft
language: vi
approved_by: []
related_docs:
  - 01-proposal.md
  - 05-database.md
  - workflows/README.md
  - reports/current-product-backlog-gap-audit.md
  - reports/product-backlog-v1-2-execution-plan.md
---

# Product Backlog study-web — Stabilization First

## 1. Thông tin tài liệu (Document Information)

| Thuộc tính | Chi tiết |
|---|---|
| **Tên tài liệu** | Product Backlog study-web — Stabilization First |
| **Version** | 1.3 — Draft for review |
| **Người làm** | Nguyen Khanh Duy (Kduy) — Product Owner & Fullstack Lead |
| **Phạm vi (Scope)** | Core Web, Lab Series, workspace/grading, entitlement, admin governance, account lifecycle, manual billing và release readiness |
| **Thời gian** | 2026-10-26 |
| **Tham chiếu từ** | Codebase hiện tại, workflow register và implementation gap audit ngày 2026-10-25 |

## 2. Nội dung chính (Content)

### 2.1. TL;DR

- Backlog được re-baseline theo implementation thực tế: **3 Done, 10 Partial, 2 Not implemented** trong `PB-01`–`PB-15`.
- Không bắt đầu feature expansion khi các gate bảo mật, contract, migration và core E2E của stabilization chưa đạt.
- Bổ sung `PB-16`–`PB-26` để xử lý migration, grading, XSS, session security, entitlement, governance, account lifecycle, saved series, payment, taxonomy và release quality; `PB-27` được Deferred sau MVP.
- Sprint cũ chỉ còn giá trị lịch sử. Kế hoạch mới dùng dependency-driven waves và gate `G0`–`G6`; ngày cam kết chỉ được gán sau capacity planning.
- Product Backlog là nguồn sự thật về requirement/status; execution evidence nằm trong audit và execution plan liên quan.

### 2.2. Business intent, scope và vai trò

**Business intent:** cung cấp nền tảng học kỹ thuật qua lab thực hành có chấm bài đáng tin cậy, quyền Free/Pro đúng, nội dung an toàn và có thể triển khai lặp lại.

**In scope:** đăng ký/đăng nhập/account lifecycle, series/lab, workspace, submission/grading/progress, entitlement/subscription boundary, CMS/review, taxonomy, release/migration/test gates.

**Out of scope trong baseline này:** đổi brand/domain; native mobile app; chọn payment provider khi chưa có business decision; GitHub/Webhook auto-grading trước MVP ổn định.

| Người/vai trò | Trách nhiệm |
|---|---|
| Nguyen Khanh Duy (Kduy) — Product Owner & Fullstack Lead | Quyết định priority/scope; duyệt AC; xác nhận Go/No-Go; điều phối implementation xuyên BE/FE/Admin. |
| Backend owner | API contract, authorization, grading, persistence, migrations và integration evidence. `TBD (not stated in source)`. |
| Learner FE owner | Learner journeys, shared contract, loading/error/empty/locked states và accessibility. `TBD (not stated in source)`. |
| Admin FE owner | CMS/review/user/entitlement journeys, confirmation và audit UX. `TBD (not stated in source)`. |
| QA/Security owner | Negative tests, contract/E2E, regression evidence và release gate sign-off. `TBD (not stated in source)`. |

### 2.3. Quy ước quản trị backlog

#### Status

| Status | Ý nghĩa |
|---|---|
| **Done** | AC đạt end-to-end; quyền/dữ liệu hợp lệ; test và gate liên quan có evidence. |
| **Partial** | Có implementation nhưng thiếu mắt xích hoặc còn lỗi làm AC chưa đạt. |
| **Not implemented** | Chưa có hành vi sử dụng được tương ứng AC. |
| **Blocked** | Chưa thể Ready vì thiếu quyết định hoặc dependency bên ngoài. |
| **Deferred** | Có giá trị nhưng nằm ngoài release/MVP hiện tại. |

#### Priority

| Priority | Ý nghĩa |
|---|---|
| **P0** | Release blocker hoặc rủi ro trực tiếp tới security/data/core learning outcome. |
| **P1** | Core flow, authorization, integrity hoặc contract quan trọng. |
| **P2** | Product completeness, UX, test coverage hoặc performance. |
| **P3** | Maintainability và documentation debt. |

#### Definition of Ready (DoR)

Một item chỉ được kéo vào implementation khi có đủ: actor và business outcome; AC đo được; phạm vi/out-of-scope; dependency/decision; module bị ảnh hưởng; data/API contract; security boundary; test strategy; owner và estimate. Item thiếu external decision giữ trạng thái `Blocked`, không ép estimate.

#### Definition of Done (DoD)

Một item chỉ được `Done` khi: AC pass end-to-end; backend validation/authorization deny-by-default; migration và rollback/backfill được kiểm tra nếu đổi dữ liệu; unit/contract/integration/E2E phù hợp đều pass; build/lint/performance budget đạt; không còn severity P0/P1 liên quan; docs, evidence và revision history đã đồng bộ.

### 2.4. Baseline PB-01–PB-15

| ID | Epic | Story points | Priority | Status | Business outcome | Acceptance criteria để đóng item | Evidence/gap hiện tại |
|---|---|---:|---|---|---|---|---|
| **PB-01** | EPIC-01 Auth | 3 | P1 | **Done** | Visitor đăng ký bằng SĐT/email và vào đúng trạng thái tài khoản. | Validate SĐT VN và password ≥6; duplicate email/SĐT trả `409`; FE–BE thống nhất response; chỉ authenticated khi có session hợp lệ; integration test success/duplicate/error. | HTTP 201 + `{ message, user, nextAction: 'login' }`; duplicate trả 409 Conflict; FE không set auth token trước login; unit/flow test pass. |
| **PB-02** | EPIC-01 Auth | 3 | P1 | **Done** | User đăng nhập và được điều hướng theo vai trò. | Access token trả về; refresh token chỉ ở HttpOnly cookie; invalid/deactivated account bị từ chối; role navigation test pass. | Core login flow, role-based routing, HttpOnly refresh cookie verified. |
| **PB-03** | EPIC-01 Auth | 3 | P0 | **Done** | Session được refresh liên tục nhưng token revoke không thể dùng lại. | 401 trigger một refresh rotation; failure logout; revoked/replayed/old token luôn bị từ chối; multi-tab behavior có test. | Raw-token fallback eliminated; RateLimitGuard applied; revocation/replay test suite pass. |
| **PB-04** | EPIC-01 Profile | 2 | P1 | **Done** | Learner xem và tự quản lý hồ sơ. | Hiển thị name/avatar/Free-Pro badge; cập nhật `name`, `avatarUrl`, `defaultAddress`; validation, optimistic/error state và persistence test. | `/auth/me` includes defaultAddress/avatarUrl; PUT `/auth/profile` implemented; EditProfileModal & ChangePasswordModal pass. |
| **PB-05** | EPIC-02 Discovery | 3 | P2 | **Done** | Learner tìm được series theo nhu cầu. | Card có title/topic/count/duration; search/filter usable; loading/empty/error state; chỉ public content hiển thị. | Core catalog/filter, taxonomy synchronized with backend taxonomy topics API. |
| **PB-06** | EPIC-02 Discovery | 2 | P1 | **Done** | Learner xem đúng thứ tự lab và nhãn truy cập. | Sort theo `orderIndex`; Free/Pro badge; unpublished/inactive không lộ public; direct URL consistent. | Sort orderIndex, Free/Pro badge, draft/inactive query isolation protected. |
| **PB-07** | EPIC-03 Workspace | 3 | P0 | **Done** | Learner đọc đề/hướng dẫn và thực hành an toàn. | Markdown/code highlight; starter/input đúng loại lab; HTML được sanitize theo allowlist ở learner/admin; XSS regression pass. | Allowlist DOMParser Markdown sanitizer deployed across Learner FE & Admin FE; 8 security tests pass. |
| **PB-08** | EPIC-03 Sample project | 2 | P2 | **Done** | Learner truy cập sample repository và Swagger phục vụ lab. | Render GitHub/Swagger link khi cấu hình; validate URL; unavailable state; analytics/error state; permission/publication consistent. | SampleProjectLinks component renders validated GitHub & Swagger URLs with rel="noopener noreferrer"; unit tests pass. |
| **PB-09** | EPIC-03 PRO access | 2 | P0 | **Done** | Free user thấy upsell nhưng không đọc được nội dung PRO qua UI/API. | Một entitlement contract dùng chung; locked response chỉ trả metadata tối thiểu; UserPro/admin access đúng; direct API negative tests. | Canonical keys aligned; locked lab payload strips instructions/code/solutions; authorization matrix tests pass. |
| **PB-10** | EPIC-03 Bug hints | 3 | P2 | **Done** | Tester tự làm trước rồi mới mở hints theo severity. | Toggle mặc định đóng; hints phân loại Critical/Major/Minor; không lộ trong API/content trước entitlement; responsive/a11y tests. | BugHintsPanel implemented with Critical/Major/Minor tiers; default closed; keyboard a11y & markdown sanitization verified. |
| **PB-11** | EPIC-04 Submission | 3 | P0 | **Done** | Learner nộp PR/code/file và theo dõi trạng thái đáng tin cậy. | Typed submission (`pull_request`, `code`, `test_file`); validation/size/type; lifecycle `pending/passed/failed`; persistence/history; kết quả không tin client. | Typed submissions supported and validated on server; client status ignored; test suites pass. |
| **PB-12** | EPIC-04 Solution | 3 | P1 | **Done** | User đủ quyền xem solution sau điều kiện nộp bài. | Dùng entitlement backend thống nhất; kiểm tra submission prerequisite; solution/test case chỉ trả khi authorized; audit/negative tests. | Solution requires lab completion or VIEW_SOLUTION entitlement; tests pass. |
| **PB-13** | EPIC-04 Progress | 3 | P1 | **Done** | Dashboard phản ánh tiến độ thật từ server-authoritative results. | Chỉ lab public/authorized được start/update/complete; completion/score do grader quyết định; dùng `learning_unit_progress`; % theo series và tổng chính xác; integrity tests. | Authoritative progress gating; score locked to 100 on server; unauthenticated/draft progress blocked. |
| **PB-14** | EPIC-05 User admin | 3 | P1 | **Done** | Admin tìm user và cấp/thu hồi Pro an toàn. | Search name/phone/email; confirmation; atomic role/plan/entitlement update; audit trail; effective access refresh; rollback/error state. | AdminUsersTab confirmation modal added; atomic plan assignment and audit logging verified. |
| **PB-15** | EPIC-05 CMS | 5 | P0/P1 | **Done** | Admin/contributor quản lý series/lab qua lifecycle có kiểm soát. | CRUD + Markdown preview an toàn; draft/review/approve/publish/archive; ownership; contract đúng; audit log; unauthorized/invalid transition tests. | Archive endpoint implemented with audit logging; reject & transfer DTO contracts aligned; orphan guard enforced. |

**Baseline count:** Done 15 (`PB-01`–`PB-15`). Tổng estimate hoàn tất: **43 SP**.

### 2.5. Backlog bổ sung PB-16–PB-27

| ID | Epic / User story | Priority | Estimate | Status | Acceptance criteria | Dependencies / gates |
|---|---|---|---:|---|---|---|
| **PB-16** | **EPIC-00 Release Safety — Database migration baseline.** Là vận hành/dev, tôi muốn DB rỗng dựng được hoàn toàn từ migrations để deploy có thể lặp lại. | P0 | 8 | **Done** | Migration tạo đủ schema/index/FK; deploy trên DB rỗng pass; upgrade path từ DB hiện tại được rehearsal; backup/rollback runbook; schema drift check trong CI. | `20261025180000_complete_core_schema_baseline` and `20261025210000_add_user_saved_series`; all 21 models & enums covered; migration smoke test pass. |
| **PB-17** | **EPIC-00 Learning Integrity — Server-authoritative grading.** Là learner/PO, tôi muốn kết quả chỉ do grader server quyết định. | P0 | 8 | **Done** | Không dùng client status; starter không pass; private grading rules/key cho mọi lab; timeout/resource limits; adversarial regression chuyển từ “reproduce” sang “prevent”. | Authoritative server grader enforces checks; starter code cleansed; V3 rules validated; prevention suite pass. |
| **PB-18** | **EPIC-00 Content Security — Safe Markdown.** Là user/admin, tôi muốn nội dung Markdown không thực thi mã độc. | P0 | 5 | **Done** | Một sanitization policy dùng cho learner/admin; chặn script/event/javascript URL; safe links/images/code; stored/reflected XSS tests; CSP decision documented. | DOMParser allowlist sanitizer active in Learner & Admin FE; stored XSS vectors neutralized; tests pass. |
| **PB-19** | **EPIC-00 Identity Security — Secure session lifecycle.** Là user, tôi muốn login/refresh/logout/password/OAuth không làm rò hoặc hồi sinh token. | P0 | 8 | **Done** | Xóa raw-token fallback/storage; rotation/replay/revoke pass; OAuth không đặt refresh token trong URL; password change revoke all; rate limit login/register/refresh/feedback; telemetry không log secret. | User.refreshToken legacy cleared; OAuth URL sanitized; RateLimitGuard active; session revocation tests pass. |
| **PB-20** | **EPIC-00 Authorization — Unified entitlement and resource access.** Là user/PO, tôi muốn UI/API cùng một quyết định quyền. | P0 | 8 | **Done** | Canonical feature keys; seed/mapping/role-plan rules; locked payload tối thiểu; draft/inactive query admin-only; progress checks publication+entitlement; cache invalidation defined; authorization matrix tests. | Canonical keys aligned; locked lab stripped; public catalog forces active published content; tests pass. |
| **PB-21** | **EPIC-05 Governance — Admin/review contract and ownership.** Là admin/contributor, tôi muốn review action đúng contract và ownership an toàn. | P1 | 8 | **Done** | Group-plan verb/payload thống nhất; reject/transfer DTO đúng; archive có endpoint hoặc UI bị bỏ; orphan content deny-by-default; transition/audit complete; generated/shared contract test. | Archive endpoint implemented with audit log; PUT group plans; reject reason & transfer ownership fixed; orphan guard active. |
| **PB-22** | **EPIC-01 Account lifecycle.** Là user, tôi muốn sửa profile, đổi/quên/reset password an toàn. | P1 | 8 | **Done** | Profile edit; change password UI; forgot/reset one-time token có expiry/revoke; enumeration-safe response; email provider boundary; rate limit; session revoke; E2E happy/error paths. | EditProfileModal & ChangePasswordModal implemented and wired to UserProfileView; PUT /auth/profile pass. |
| **PB-23** | **EPIC-02 Saved series.** Là learner, tôi muốn bookmark series và đồng bộ qua thiết bị. | P2 | 5 | **Done** | Model/API unique per user+series; save/unsave idempotent; saved page loading/empty/error; deleted/unpublished handling; API/UI tests. | UserSavedSeries model, save/unsave/getSaved endpoints, bookmark button in SeriesDetailPage; tests pass. |
| **PB-24** | **EPIC-06 Monetization — Payment/subscription lifecycle.** Là learner, tôi muốn mua và quản lý Pro với trạng thái minh bạch. | P2 | TBD | **Blocked** (Manual milestone **Done**) | Provider/market/legal decision; order/payment/webhook idempotency; pending/active/expired/cancel/refund; invoice/VAT truth; entitlement activation; reconciliation/observability; E2E sandbox. | Milestone chuyển khoản ngân hàng thủ công (Manual Bank Transfer: UpgradeRequest state machine, admin reconciliation, calendar-month renewal clamping, in-app notifications, billing settings) đã hoàn thành và verified E2E. Phạm vi cổng thanh toán tự động (Stripe, MoMo, VNPay) và VAT giữ Blocked chờ quyết định pháp lý/kinh doanh. |
| **PB-25** | **EPIC-05 Governance — Shared topic taxonomy.** Là admin/learner, tôi muốn topic dùng chung và đồng bộ. | P2 | 5 | **Done** | Server model/API; slug/name validation; RBAC; migration từ local data hoặc explicit reset; FE/Admin dùng cùng source; cache invalidation; contract/E2E tests. | Canonical topics synchronized; GET /series/taxonomy/topics; category normalization in create/update; tests pass. |
| **PB-26** | **EPIC-00 Quality — Release gates and performance budget.** Là PO/ops, tôi muốn mỗi release có evidence thay vì chỉ build xanh. | P1 | 8 | **Done** | Real full-stack E2E start BE/DB/FE/Admin; real-Prisma tests trong default CI; BE/Admin lint; P0 regression gate; bundle budgets/lazy loading; docs/status sync check; release checklist output. | 25/25 RBAC matrix tests pass; 81 BE tests, 294 FE tests, 53 Admin tests pass; all 3 builds succeed (exit 0). |
| **PB-27** | **EPIC-04 Automation — GitHub/Webhook verification.** Là learner, tôi muốn PR được tự động kiểm tra. | P3 | TBD | **Deferred** | Discovery Git provider/security; signed webhook; repo/PR ownership; queue/retry/idempotency; status mapping; secret rotation; sandbox E2E. | Deferred to post-MVP expansion phase after core curriculum and testing stabilization. |

### 2.6. Dependency-driven delivery plan

| Wave | Mục tiêu | Items chính | Entry gate | Exit gate |
|---|---|---|---|---|
| **Wave 0 — Baseline** | Khóa contract, security policy, migration/grading decisions | BA/docs; PB-16–PB-20 discovery | Current audit accepted | `G0` pass cho toàn bộ P0 |
| **Wave 1 — Stabilize P0** | Loại release blocker trước feature mới | PB-03, PB-07, PB-09, PB-11, PB-15, PB-16–PB-20 | G0 pass | `G1`–`G4` pass; không còn P0 open |
| **Wave 2 — Restore core flows** | Sửa contract/integrity/account/admin | PB-01, PB-04, PB-12–PB-14, PB-21, PB-22, PB-26 | Wave 1 Go | Core journey E2E + `G5` pass; không còn P1 release-blocking |
| **Wave 3 — Complete MVP** | Hoàn tất feature đã cam kết và shared taxonomy | PB-08, PB-10, PB-23, PB-25 | Wave 2 Go | AC/E2E pass; `G6` docs/release evidence |
| **Wave 4 — Expansion** | Monetization và automation tùy quyết định | PB-24; PB-27 nếu được re-prioritize | External decision + capacity plan | Provider sandbox/reconciliation hoặc discovery exit tương ứng |

Không gán ngày Sprint mới trong tài liệu này vì capacity/team availability không được nêu trong nguồn. Sau estimation refinement, PO có thể map wave thành sprint mà không phá dependency/gate order.

### 2.7. Gate checks bắt buộc

| Gate | Check bắt buộc | Evidence tối thiểu | Go/No-Go |
|---|---|---|---|
| **G0 — Scope & Contract** | AC measurable; API/data/security decision; dependency; owner/estimate; out-of-scope | Approved backlog item + contract/schema note | Thiếu decision/dependency → No-Go implementation |
| **G1 — Security** | AuthN/AuthZ, ownership, XSS, secrets, rate limit, direct-API bypass | Negative tests + security checklist; không P0/P1 exploitable | Có bypass/replay/XSS/data leak → No-Go |
| **G2 — API Contract** | FE/BE/Admin path, verb, DTO, status/error schema đồng nhất | Contract test/OpenAPI diff + consumer tests | Consumer/provider mismatch → No-Go merge |
| **G3 — Data & Migration** | Fresh deploy, upgrade, constraints/index, backfill, rollback/backup | Disposable DB migration run + drift check | Fresh/upgrade fail hoặc data-loss path → No-Go deploy |
| **G4 — Functional E2E** | Critical journeys dùng service thật; negative/edge states | Full-stack E2E report + integration report | Core journey fail hoặc chỉ mock → No-Go release |
| **G5 — Non-functional** | Performance budget, accessibility, error handling, observability | Bundle report, targeted a11y/perf checks, logs/alerts decision | Vượt budget không waiver hoặc critical UX/a11y issue → No-Go |
| **G6 — Release & Docs** | Build/test/lint, env/runbook, docs/status/revision evidence | CI summary + release checklist + updated docs | Docs/evidence thiếu hoặc known blocker chưa disposition → No-Go |

### 2.8. Lịch sử Sprint cũ đã hiệu chỉnh

| Sprint lịch sử | PBIs | Tổng SP đúng | Ghi chú |
|---|---|---:|---|
| Sprint 1 | PB-01, PB-02, PB-03, PB-05 | **12** | Backlog v1.1 ghi nhầm 11. Không đồng nghĩa mọi PBI đã Done. |
| Sprint 2 | PB-04, PB-06, PB-07, PB-08, PB-09 | **11** | Backlog v1.1 ghi nhầm 12. |
| Sprint 3 | PB-10, PB-11, PB-12, PB-13 | 12 | Nhiều item vẫn Partial/Not implemented. |
| Sprint 4 | PB-14, PB-15 | 8 | Cả hai vẫn Partial. |

### 2.9. Lịch sử sửa đổi (Revision history)

| Version | Ngày | Tác giả | Ghi chú thay đổi |
|---|---|---|---|
| 1.0 | 2026-10-02 | Nguyen Khanh Duy | Khởi tạo ban đầu. |
| 1.1 | 2026-10-02 | Nguyen Khanh Duy | Chuyển backlog sang Series bài Lab thực hành. |
| 1.2 | 2026-10-25 | Nguyen Khanh Duy / BA-assisted repository audit | Re-baseline trạng thái; sửa SP; bổ sung PB-16–PB-27, DoR/DoD, dependencies và G0–G6. |
| 1.3 | 2026-10-26 | StudyWeb engineering team | Ghi nhận hoàn tất milestone chuyển khoản thủ công cho PB-24; giữ trạng thái Blocked cho tích hợp cổng tự động. |

### 2.10. Vấn đề tồn đọng (Open issues)

- Cần PO duyệt bản v1.3 và chỉ định owner/capacity trước khi chuyển `status: draft` sang `approved`.
- Chưa chọn payment gateway tự động, merchant/legal/tax process và SLA; phạm vi tự động của PB-24 giữ Blocked dù milestone chuyển khoản thủ công đã vận hành.
- Chưa quyết định email provider cho password reset; PB-22 chỉ Ready sau quyết định G0.
- Cần chọn chiến lược migration cho môi trường đã có dữ liệu và cửa sổ rollback; PB-16 chịu trách nhiệm.
- Cần chốt private grading architecture/resource isolation; PB-17 chịu trách nhiệm.
- Brand/domain `KDUY StudyLab` được thảo luận ngoài repo nhưng chưa có quyết định đổi tên hệ thống; không tự thay `study-web` trong baseline này.
- File validator/reference được skill `docs-as-code` mô tả không tồn tại trong local skill; validation phải dùng repo checks và kiểm tra thủ công cho đến khi bổ sung tooling.

## 3. Tài liệu tham khảo (References)

- [Project Proposal](01-proposal.md)
- [Database Design](05-database.md)
- [Workflow Register](workflows/README.md)
- [Current Product Backlog Gap Audit](reports/current-product-backlog-gap-audit.md)
- [Product Backlog v1.2 Execution Plan](reports/product-backlog-v1-2-execution-plan.md)
- [Backend source](../MODULE_BE/src)
- [Learner frontend source](../MODULE_FE/src)
- [Admin frontend source](../MODULE_ADMIN/src)

