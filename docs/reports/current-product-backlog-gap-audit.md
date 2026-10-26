---
doc_type: audit-report
title: Current Product Backlog and Implementation Gap Audit
project: study-web
version: "1.1"
version_source: audit
authors:
  - {name: OpenAI Codex, role: Repository audit agent}
scope: Product Backlog PB-01–PB-15, Backend, Learner/Contributor Frontend, Admin Frontend, database migrations, tests and release readiness
date: 2026-10-25
source_file: docs/03-product-backlog.md and current repository state
status: final
language: vi
approved_by: []
related_docs:
  - ../03-product-backlog.md
  - ../workflows/README.md
  - release-readiness-audit.md
  - product-backlog-v1-2-execution-plan.md
---

# Current Product Backlog and Implementation Gap Audit

## 1. Thông tin tài liệu (Document Information)

| Thuộc tính | Chi tiết |
|---|---|
| **Tên tài liệu** | Current Product Backlog and Implementation Gap Audit |
| **Version** | 1.1 |
| **Người làm** | OpenAI Codex — repository audit agent |
| **Phạm vi (Scope)** | PB-01–PB-15; `MODULE_BE`, `MODULE_FE`, `MODULE_ADMIN`; Prisma migrations; unit/integration/E2E tests; release readiness |
| **Thời gian** | 2026-10-25 |
| **Tham chiếu từ** | `docs/03-product-backlog.md` và implementation hiện tại trong repository |

## 2. Nội dung chính (Content)

### 2.1. TL;DR

- Không có backlog item nào hoàn toàn vắng code, nhưng chỉ **3/15 PB đạt Done** theo tiêu chí end-to-end; **10/15 Partial** và **2/15 Not implemented**.
- Có ít nhất **5 nhóm blocker P0**: migration không tái tạo được database, grading có thể bị vượt qua, stored XSS qua Markdown, refresh token bị phục hồi sau revoke, và quyền PRO không đồng nhất FE–BE.
- Bộ test hiện tại đều xanh nhưng chưa chứng minh production readiness: một suite đang **xác nhận các lỗi P0 vẫn tồn tại**, còn Playwright chỉ chạy learner FE với nhiều API mock và lần audit này bị treo khi khởi động.
- Cả ba module build thành công. Tuy nhiên learner bundle có asset PGlite/WASM khoảng 10.5 MB và admin bundle khoảng 950 KB, đều vượt cảnh báo chunk 500 KB.
- `docs/reports/release-readiness-audit.md` hiện đã lỗi thời: kết luận “clean” mâu thuẫn với implementation và suite tái hiện P0 đang có trong repo.

### 2.2. Phạm vi, phương pháp và quy ước trạng thái

Audit đối chiếu acceptance criteria của `PB-01`–`PB-15` với route/controller/service/guard/schema/migration, UI/store/API client và test tương ứng. Tài liệu workflow mới hơn được dùng để phát hiện requirement ngoài backlog và mâu thuẫn tài liệu; không dùng tên file hoặc UI mock làm bằng chứng rằng chức năng đã hoàn chỉnh.

| Trạng thái | Tiêu chí |
|---|---|
| **Done** | Có luồng end-to-end khả dụng, quyền và dữ liệu hợp lệ, state quan trọng được xử lý và có bằng chứng kiểm thử phù hợp. |
| **Partial** | Có một phần UI/API/data model nhưng thiếu mắt xích hoặc có lỗi nghiêm trọng làm acceptance criteria chưa đạt. |
| **Not implemented** | Không tìm thấy implementation khả dụng cho hành vi được yêu cầu. |
| **Unverified** | Có code nhưng thiếu bằng chứng đủ tin cậy để kết luận runtime. |

### 2.3. Ma trận Product Backlog

| ID | Kết luận | Bằng chứng implementation | Gap chưa hoàn thành / chưa handle | Mức ưu tiên |
|---|---|---|---|---|
| **PB-01** Đăng ký | **Partial** | BE có DTO/service đăng ký; FE có form và mutation (`MODULE_BE/src/modules/auth/auth.service.ts`, `MODULE_FE/src/features/auth/useAuth.ts`) | Duplicate phone trả `400` thay vì `409`. BE chỉ trả `message,user`, nhưng FE đọc `accessToken`, ghi token `undefined` và vẫn đặt `isAuthenticated=true`, sau đó điều hướng về `/`. | P1 |
| **PB-02** Đăng nhập | **Done** | Login phát access token, refresh cookie và role; FE lưu session và điều hướng theo role. | Cần rate limit/lockout ở cấp vận hành; được ghi riêng tại mục problem. | P1 hardening |
| **PB-03** Auto refresh | **Partial** | Có interceptor refresh và cơ chế rotation qua `AuthSessionService`. | Ý nghĩa revoke bị vô hiệu hóa bởi legacy refresh-token fallback; theo tiêu chí Done của audit, đây là gap P0 nên item chưa thể Done. | P0 |
| **PB-04** Dashboard/profile | **Partial** | Dashboard và profile đọc dữ liệu hiện tại. | Không có learner API/UI cập nhật `displayName`, avatar, `defaultAddress`; `/auth/me` không trả `defaultAddress`. Change-password có BE nhưng không có learner UI. | P1 |
| **PB-05** Danh sách series | **Done** | Có cards, filter/search và dữ liệu series trên learner FE. | Error/retry catalog còn hạn chế; taxonomy topic đang local-only, không phải nguồn dữ liệu dùng chung. | P2 |
| **PB-06** Series detail/labs | **Done** | Có series detail, danh sách lab theo thứ tự và badge free/pro. | Public API có thể lộ draft/inactive qua `includeInactive=true`; xem P1-04. | P1 hardening |
| **PB-07** Workspace | **Partial** | Có Markdown theory, snippet/input và các workspace theo loại lab. | Markdown chính dùng `marked` + `dangerouslySetInnerHTML` không sanitize, tạo stored XSS xuyên learner/contributor/admin. | P0 |
| **PB-08** Sample project | **Not implemented** | `repoUrl`/`swaggerUrl` tồn tại trong schema/type. | Không tìm thấy learner UI render link GitHub sample project hoặc Swagger theo acceptance criteria. | P2 |
| **PB-09** Chặn lab Pro | **Partial** | FE có role gate/modal upgrade; BE tính `isLocked`. | FE và BE dùng permission key khác nhau; feature BE chưa seed; đổi role `userPro` không cấp plan/group. API locked vẫn trả instruction/starter/test config nên chưa “chặn xem chi tiết đề bài”. | P0 |
| **PB-10** Bug hints | **Not implemented** | Workspace có generic hints. | Không có toggle Bug Hints và không có phân loại `Critical/Major/Minor` như backlog. | P2 |
| **PB-11** Submit lab | **Partial** | Có `LabSubmission`, lưu `submittedCode`, trả passed/failed. | Không có typed PR/file-upload flow; không có lifecycle `pending`; legacy JS grading tin `payload.status` khi objective không parse được. | P0 |
| **PB-12** Pro solution | **Partial** | BE có check `VIEW_SOLUTION`; UI có permission gate. | FE dùng `SOLUTION_ACCESS`, BE dùng `VIEW_SOLUTION`; `userPro` không tự có entitlement nên flow không ổn định end-to-end. | P1 |
| **PB-13** Dashboard progress | **Partial** | Có progress model, endpoint và dashboard metrics. | Mọi user đăng nhập có thể gọi start/position/complete cho lab bất kỳ, kể cả unpublished/PRO, và gửi score để làm sai dashboard. | P1 |
| **PB-14** Admin user/Pro | **Partial** | Admin có search và dropdown đổi `user`/`userPro`. | Đổi role thực hiện ngay, không confirmation; role không cấp entitlement backend nên “bật Pro” không mở đúng tính năng. | P1 |
| **PB-15** CMS Series/Lab | **Partial** | Admin có CRUD/editor và live Markdown preview. | Preview/content không sanitize; review reject/transfer/archive và group-plan có contract sai hoặc thiếu endpoint; audit trail chưa bao phủ đầy đủ. | P0/P1 |

**Tổng hợp:** Done 3, Partial 10, Not implemented 2, Unverified 0. “Done” chỉ áp dụng cho acceptance criteria chính của PB; các hardening issue liên quan vẫn được giữ trong backlog problem bên dưới.

### 2.4. Chức năng ngoài PB-01–PB-15 còn thiếu hoặc làm dở

| Nhóm | Hiện trạng | Phần còn thiếu |
|---|---|---|
| Forgot password | FE là placeholder chờ cục bộ khoảng 600 ms | Không có token/email/reset endpoint, expiry, revoke hoặc abuse protection. |
| Saved series | Route/page placeholder | Không có model, API, bookmark action, empty/error state hoặc đồng bộ tài khoản. |
| Payment/subscription | Pricing page và CTA `mailto:` | Không có order, payment provider, webhook, activation, renew/cancel/refund/invoice. Nội dung quảng bá VietQR/MoMo/ZaloPay/card, VAT, hủy và kích hoạt 5 phút chưa có implementation chứng minh. |
| Topic taxonomy | Service browser-local ở FE/Admin | Không có persistence server-side, shared source hoặc đồng bộ cross-device/cross-domain. |
| Contributor review/governance | Có queue và một số action | Archive endpoint không tồn tại; reject/transfer sai DTO; ownership với content `authorId=null` chưa an toàn; audit chưa đầy đủ. |
| Production operations | Có build/test scripts | Chưa có migration chain đầy đủ, real E2E stack, rate limiting, security regression cho revoke/XSS/entitlement, hay budget gate cho bundle. |

### 2.5. Problems chưa handle, xếp hạng P0–P3

| Priority | Impact / likelihood | Actor bị ảnh hưởng | Exit criteria của priority |
|---|---|---|---|
| **P0** | Release blocker, compromise security/data hoặc phá core learning outcome; likelihood cao hoặc đã tái hiện tự động | Tất cả user, admin, contributor, vận hành | Không còn đường khai thác/tái hiện; migration/grading/auth/authorization có negative integration test và CI gate. |
| **P1** | Core flow sai contract/quyền/integrity; likelihood trung bình–cao | User đi qua register/profile/progress/Pro; admin/reviewer; security/ops | Luồng end-to-end đúng contract, deny-by-default, có audit/error state và contract/integration test. |
| **P2** | Feature gap, UX/test/performance làm giảm giá trị nhưng chưa trực tiếp compromise dữ liệu | Learner, contributor, admin và QA | Acceptance criteria được bổ sung vào backlog, implementation có empty/error/loading state và regression test/budget. |
| **P3** | Maintainability/documentation debt; likelihood gây lỗi gián tiếp theo thời gian | Developer, QA, product/ops | Một nguồn sự thật, không còn duplicate runtime path/fallback đáng ngờ, lint/docs checks chạy trong CI. |

#### P0 — Block release hoặc gây mất kiểm soát bảo mật/dữ liệu

| ID | Problem và impact | Actor / likelihood | Bằng chứng | Tiêu chí nghiệm thu |
|---|---|---|---|---|
| **P0-01** | **Migration chain không dựng được DB mới.** Schema có 20 models nhưng migration chỉ tạo 4 bảng; migration sau còn `ALTER labs` dù không có migration tạo `labs`/`lab_series`. Fresh deploy có thể fail hoặc thiếu phần lớn schema. | Ops/dev; chắc chắn khi bootstrap từ migrations | `MODULE_BE/prisma/schema.prisma`; `MODULE_BE/prisma/migrations/**` | DB rỗng chạy `prisma migrate deploy` thành công; tất cả model/table/index/FK khớp schema; có CI smoke test. |
| **P0-02** | **Grading bypass.** Legacy JS giữ kết quả `payload.status` khi objective không parse; 3/4 automation legacy pass với starter code, và 8/8 Automation V3 starter plan đã chứa block type mà public checks kiểm tra. | Learner; cao, có test tái hiện | `MODULE_BE/src/modules/labs/labs.service.ts`; `MODULE_BE/test/wave0-p0-reproduction.spec.ts` | Server là nguồn phán quyết duy nhất; starter code không pass; private tests/grading key tồn tại; negative/adversarial tests fail đúng. |
| **P0-03** | **Stored XSS qua Markdown.** Nội dung contributor/CMS được render thành HTML không sanitize trong learner và admin. | Learner, contributor, admin; cao khi publish/review nội dung | `MODULE_FE/src/pages/lab/_components/renderMarkdown.ts`; `MODULE_ADMIN/src/pages/admin/_utils/renderMarkdown.ts`; các call site `dangerouslySetInnerHTML` | Dùng một renderer an toàn chung hoặc sanitizer allowlist; test payload script/event/javascript URL ở cả learner/admin; CSP bổ trợ. |
| **P0-04** | **Refresh token đã revoke có thể được phục hồi.** Session token được hash nhưng raw token vẫn lưu ở `User.refreshToken`; refresh fallback tìm raw token và tạo session mới; change-password revoke sessions nhưng không xóa legacy token. | Mọi tài khoản; cao nếu token từng bị lộ | `MODULE_BE/src/modules/auth/auth-session.service.ts`; `MODULE_BE/src/modules/auth/auth.service.ts` | Xóa legacy fallback/raw token; revoke password/logout invalidates mọi token; replay test bắt buộc fail; migration dọn dữ liệu legacy. |
| **P0-05** | **PRO access contract hỏng và làm lộ đề.** FE dùng `LAB_PRO`/`SOLUTION_ACCESS`; BE dùng `EXECUTE_LAB_ADVANCED`/`VIEW_SOLUTION`; feature đầu tiên không được seed; đổi role không cấp plan. Response locked vẫn chứa instruction/starter/test configuration. | Learner/admin; cao | `MODULE_FE/src/features/auth/permissions.ts`; `MODULE_BE/src/modules/labs/labs.service.ts`; `MODULE_BE/prisma/seed.ts` | Một entitlement contract thống nhất; role/plan transition có transaction; API trả metadata tối thiểu khi locked; integration tests free/pro/admin và direct API. |

#### P1 — Chức năng chính sai contract, integrity hoặc security đáng kể

| ID | Problem | Đề xuất/tiêu chí nghiệm thu |
|---|---|---|
| **P1-01** | Register FE–BE contract sai; duplicate status sai. | Chọn rõ auto-login hoặc verify/login sau đăng ký; shared response type; `409` cho duplicate; integration test điều hướng và persisted auth. |
| **P1-02** | OAuth callback đặt refresh token trong query string, dễ lọt vào history/log/referrer. | Chỉ dùng HttpOnly cookie hoặc one-time authorization code; không có secret trong URL; regression test callback. |
| **P1-03** | Progress endpoints cho phép user đánh dấu arbitrary unpublished/PRO lab complete và tự gửi score. | Enforce published + entitlement + server-side grading trước mọi transition; score lấy từ grader; authorization tests. |
| **P1-04** | Public `GET /series?includeInactive=true` có thể trả draft/inactive. | Bỏ query public hoặc guard admin; public query luôn ép active/published; integration test anonymous. |
| **P1-05** | Admin–BE contract drift: group plans `POST` vs `PUT`; review reject `{feedback}` vs `{reason}`; transfer `{targetUserId}` vs `{newAuthorId}`; UI gọi archive endpoint không tồn tại. | Shared OpenAPI/generated client hoặc contract tests; sửa toàn bộ action và state success/error. |
| **P1-06** | `ResourceOwnerGuard` cho contributor sửa orphaned content khi `authorId=null`. | Null author chỉ admin được xử lý hoặc có explicit claim flow; ownership tests. |
| **P1-07** | Không có rate limit/lockout cho login/register/refresh/feedback. | Rate limit theo IP/account, cooldown/telemetry và test 429; cấu hình proxy-aware. |
| **P1-08** | Profile edit/change-password UI thiếu; role promotion không có confirmation và không tạo entitlement. | Bổ sung form/validation/error state; confirmation + atomic role/plan assignment + audit record. |

#### P2 — Khoảng trống sản phẩm/UX/kiểm thử cần đưa vào sprint

- Implement PB-08 sample GitHub/Swagger links và PB-10 categorized Bug Hints.
- Xây saved-series, forgot-password, taxonomy server-side và lifecycle subscription/payment thật; trước đó phải sửa copy pricing để không tuyên bố capability chưa có.
- Thêm catalog retry/error, empty state nhất quán, audit search server-side và đồng bộ drafts cross-device nếu đây là requirement sản phẩm.
- Chuyển real-Prisma test `backend-e2e-matrix.test.ts` vào glob CI; dựng full-stack Playwright với BE/DB/Admin thay vì chỉ mock learner routes.
- Thiết lập bundle budget/code splitting cho PGlite/worker/admin; tải SQL runtime theo nhu cầu thay vì initial path.

#### P3 — Debt và maintainability

- Hợp nhất Markdown renderer đang trùng lặp; loại bỏ fallback mock `seriesSection` khỏi runtime service.
- Dọn các lint warning về hook dependency, set-state-in-effect và immutability; thêm lint script cho BE/Admin.
- Đồng bộ status giữa backlog, workflow feature map và release-readiness report; ghi rõ nguồn chuẩn và ngày hiệu lực.

**Phân nhóm effort:** quick wins gồm khóa `includeInactive`, sửa HTTP verb/DTO admin, confirmation đổi role, sửa pricing copy và đưa test real-Prisma vào glob CI. Thay đổi kiến trúc gồm baseline migration, grader server-side/private checks, entitlement thống nhất, refresh-token migration, taxonomy shared persistence và payment/subscription lifecycle.

### 2.6. Kết quả kiểm thử và build

| Module/check | Kết quả | Nhận xét |
|---|---|---|
| Backend `npm test` | PASS — 17 suites, 56 tests | Bao gồm `wave0-p0-reproduction.spec.ts`; test pass ở đây chứng minh các lỗi grading P0 vẫn tái hiện, không phải đã được sửa. |
| Learner FE `npm test` | PASS — 55 files, 280 tests | Có log `EACCES` khi thử kết nối `localhost:3000` nhưng process vẫn exit 0; phần lớn test cô lập/mock. |
| Admin `npm test` | PASS — 8 files, 49 tests | Chưa có contract test cho các action review/group-plan đang lệch BE. |
| BE/FE/Admin production build | PASS | FE phát asset PGlite WASM ~10.5 MB, data ~6.25 MB, worker ~1.66 MB, app JS ~1.15 MB; Admin JS ~950 KB; Vite cảnh báo chunk >500 KB. |
| Learner FE lint | PASS với warnings | Có hook dependency, setState-in-effect và immutability warnings. BE/Admin không có lint script tương đương. |
| `npx prisma validate` | PASS | Chỉ xác thực schema; không chứng minh migration chain dựng được DB. Có cảnh báo config Prisma trong `package.json` đã deprecated. |
| Playwright `tests/e2e` | **Unverified** | Lệnh không ra test result và bị dừng sau hơn 2 phút. Config chỉ start learner FE; nhiều spec mock API/localStorage, không phải production E2E. |

### 2.7. Thứ tự triển khai đề xuất

1. **Đóng đường khai thác ngay:** sanitize Markdown; vô hiệu legacy refresh fallback/raw token; bỏ refresh token khỏi OAuth URL; khóa response lab và public inactive-series query.
2. **Khôi phục tính đúng:** sửa grading server-side/private checks; thống nhất entitlement; enforce progress authorization; sửa registration và admin API contracts.
3. **Làm release reproducible:** tạo baseline migration đã kiểm tra trên DB rỗng; thêm migration smoke test và full-stack contract/E2E gates.
4. **Hoàn tất backlog:** profile editing, PB-08, PB-10, confirmation + Pro assignment, pending/typed submission flow.
5. **Mở rộng product có kiểm soát:** forgot password, saved series, taxonomy server-side và payment/subscription; chỉ quảng bá capability đã triển khai/kiểm chứng.
6. **Performance và docs:** lazy-load SQL runtime, split admin bundle, xử lý lint warnings và cập nhật backlog/workflow/release report cùng một nguồn trạng thái.

### 2.8. Open issues và mâu thuẫn tài liệu

- **Đã xử lý ở tài liệu:** Product Backlog v1.2 draft ngày 2026-10-25 đã re-baseline trạng thái và bổ sung PB-16–PB-27 cho saved-series, governance, payment và production operation; vẫn cần PO approval trước khi thành baseline approved.
- Workflow feature map ghi topic governance “Implemented”, trong khi workflow taxonomy xác nhận browser-local và chưa có backend/shared persistence.
- `docs/reports/release-readiness-audit.md` kết luận functional/security clean nhưng repo có suite `wave0-p0-reproduction.spec.ts` chứng minh lỗi P0 vẫn tồn tại.
- Không tìm thấy `references/product-backlog.md`, `references/cross-check.md` hoặc `scripts/validate_docs.py` mà local `docs-as-code` skill nhắc tới; báo cáo dùng checklist trực tiếp trong `SKILL.md` và kiểm tra thủ công.
- Playwright chưa cho kết quả trong môi trường audit; mọi kết luận runtime ngoài unit/integration/build được giữ ở mức evidence tĩnh hoặc ghi Unverified.

### 2.9. Lịch sử sửa đổi (Revision history)

| Version | Ngày | Tác giả | Thay đổi |
|---|---|---|---|
| 1.0 | 2026-10-25 | OpenAI Codex | Audit đầu tiên: PB matrix, P0–P3, test/build evidence và execution order. |
| 1.1 | 2026-10-25 | OpenAI Codex | Sửa PB-03 từ Done thành Partial; đồng bộ count 3/10/2 và liên kết Product Backlog v1.2 execution plan. |

## 3. Tài liệu tham khảo (References)

- **Nguồn backlog:** [Product Backlog](../03-product-backlog.md)
- **Workflow register:** [Workflow Documentation](../workflows/README.md)
- **Tài liệu release trước đó:** [Release Readiness Audit](release-readiness-audit.md)
- **Kế hoạch remediation:** [Product Backlog v1.2 Execution Plan](product-backlog-v1-2-execution-plan.md)
- **Implementation:** `MODULE_BE/`, `MODULE_FE/`, `MODULE_ADMIN/`
- **Test:** `MODULE_BE/test/`, `MODULE_FE/src/test/`, `MODULE_ADMIN/src/test/`, `tests/e2e/`

