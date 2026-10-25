# Kế hoạch MVP 24 bài SQL, Testing Quiz và Automation Low-code (V3 Contract & Client Engine)

> **Tài liệu tham chiếu**: [requirements-elicitation](d:/Projects/study-web/.agents/skills/requirements-elicitation/SKILL.md), [plan-and-execute](d:/Projects/study-web/.agents/skills/plan-and-execute/SKILL.md), [ui-ux-pro-max](d:/Projects/study-web/.agents/skills/ui-ux-pro-max/SKILL.md)
> **Trạng thái**: IMPLEMENTED & VERIFIED — 24/24 subtasks complete
> **Final audit (2026-10-24)**: V3 database state is present (3 series, 12 sections, 24 labs); automated tests/builds pass. The independent PGlite asset-budget failure and shared-database legacy fixture authoring gate are tracked in `remaining-work-closure.plan.md` and do not reopen this V3 implementation checklist.
> **Kiến trúc hai vai trò (Dual-Agent Protocol)**: Mỗi Task được chia thành 2 vai trò: **Coding Agent** (triển khai mã nguồn/nội dung phẫu thuật) và **Review/QA Agent** (chạy test suite thực tế, kiểm tra contract round-trip, bảo vệ regression, kiểm tra a11y và security gate).
> **Cổng kiểm soát (Gate Test / Boost)**:
> - *Gate 1*: Không phá vỡ V1/V2 backward compatibility (`MODULE_FE`, `MODULE_BE`, `MODULE_ADMIN`).
> - *Gate 2*: 100% tests pass (Vitest FE & Admin, Tsx BE). Không mock qua loa.
> - *Gate 3*: Client runtime an toàn: chặn network (fetch, XHR, WebSocket), timeout 2000ms, cap 100 logs, max 50 steps.
> - *Gate 4*: Dữ liệu 24 bài chuẩn hóa: 8 SQL pass PGlite, 8 Quiz đủ 40 câu đạt chuẩn ISTQB/OWASP 80%, 8 Automation sinh mã Playwright hợp lệ.
> - *Gate 5*: Seed không xóa dữ liệu người dùng (`deleteMany` bị loại bỏ, dùng upsert an toàn theo `slug` và `contentRevision`).

---

## Danh Mục Công Việc Triển Khai (Work Breakdown Structure)

### Task 1: Chuẩn hóa nguồn, Content Model & Contract V3
- [x] Subtask 1.1: Tạo Source Registry chuẩn hóa cho 24 bài (`docs/curriculum/source-registry-v3.md`).
  - File: `docs/curriculum/source-registry-v3.md`
  - Verify: Kiểm tra URL, version, ngày truy cập, giấy phép, learning objective và adaptation note.
- [x] Subtask 1.2: Định nghĩa V3 Contract Types ở FE (`AutomationExerciseV3`, `AutomationBlockDefinition`, `AutomationStep`, `AutomationPublicCheck`).
  - File: `MODULE_FE/src/types/lab.types.ts`
  - Verify: TypeScript compile, type exports, và test types.
- [x] Subtask 1.3: Định nghĩa V3 Contract Types ở Admin (`MODULE_ADMIN/src/types/lab.types.ts`).
  - File: `MODULE_ADMIN/src/types/lab.types.ts`
  - Verify: `npm test` trong `MODULE_ADMIN`.
- [x] Subtask 1.4: Định nghĩa V3 DTOs & Validation ở Backend (`MODULE_BE/src/modules/labs/dto/lab-contract-v3.dto.ts`).
  - File: `MODULE_BE/src/modules/labs/dto/lab-contract-v3.dto.ts`
  - Verify: TypeScript compile và DTO test.
- [x] Subtask 1.5: Cập nhật FE Codec `labContentCodec.ts` hỗ trợ V3 envelope và loại bỏ grading rules khỏi learner view.
  - File: `MODULE_FE/src/features/lab/domain/labContentCodec.ts`
  - Verify: Vitest `lab-codec.test.ts` & `seed-compatibility.test.ts`.
- [x] Subtask 1.6: Tạo bộ test contract round-trip cho V3, V2, V1.
  - File: `MODULE_FE/src/test/automation-v3-contract.test.ts`
  - Verify: Chạy `npm test -- automation-v3-contract` thành công 100%.

### Task 2: Client Fixture Runner & Compiler Engine
- [x] Subtask 2.1: Xây dựng Fixture Registry nội bộ và sandboxed fixture simulation.
  - File: `MODULE_FE/src/features/lab/runtime/v3/fixtureRegistry.ts`
  - Verify: Unit test nạp fixture hợp lệ và từ chối fixture giả mạo/URL ngoài.
- [x] Subtask 2.2: Xây dựng Block DSL definition, validator và deterministic action runner.
  - File: `MODULE_FE/src/features/lab/runtime/v3/blockDsl.ts` & `blockRunner.ts`
  - Verify: Unit test kiểm tra từng block: Locator (`getByRole`, `getByLabel`, `getByText`, `getByTestId`), Action (`goto`, `fill`, `click`, `check`, `selectOption`), Assertion (`toBeVisible`, `toHaveText`, `toHaveValue`, `toHaveCount`, `toHaveURL`).
- [x] Subtask 2.3: Xây dựng Playwright TypeScript compiler cho V3 với unique test titles.
  - File: `MODULE_FE/src/features/lab/runtime/v3/playwrightV3Compiler.ts`
  - Verify: Compiler sinh code Playwright hợp lệ, format chuẩn, có unique title và đúng import.
- [x] Subtask 2.4: Xây dựng Versioned Submission Codec (mã hóa và giải mã `submittedCode` an toàn).
  - File: `MODULE_FE/src/features/lab/runtime/v3/automationV3SubmissionCodec.ts`
  - Verify: Unit test round-trip payload submission, kiểm tra revision và summary.
- [x] Subtask 2.5: Triển khai Backend Plan & Revision Validation trong `labs.service.ts`.
  - File: `MODULE_BE/src/modules/labs/labs.service.ts`
  - Verify: BE test suite pass, từ chối payload sai revision hoặc step ngoài allowlist.
- [x] Subtask 2.6: Kiểm chứng an toàn Runtime (timeout 2s, log cap 100 dòng, network block, teardown không leak state qua 20 lượt chạy).
  - File: `MODULE_FE/src/test/automation-v3-runtime-safety.test.ts`
  - Verify: Vitest kiểm tra timeout, log cap, network error và reset cycle.

### Task 3: UX Low-Code Ba Cấp (Block Builder, Smart Cloze, Guided/Full Code)
- [x] Subtask 3.1: Xây dựng Block Palette với các nhóm (Navigation, Locator, Action, Assertion, Data).
  - File: `MODULE_FE/src/features/lab/components/v3/BlockPalette.tsx`
  - Verify: Component test: click chèn block, keyboard navigation, min 44x44px touch targets.
- [x] Subtask 3.2: Xây dựng Visual Step Plan Editor (danh sách step, reorder, delete, inline validation).
  - File: `MODULE_FE/src/features/lab/components/v3/VisualStepPlanEditor.tsx`
  - Verify: Component test: render steps, hiển thị lỗi validate tại step, reorder.
- [x] Subtask 3.3: Xây dựng Mini-App Preview Sandbox & Action Timeline.
  - File: `MODULE_FE/src/features/lab/components/v3/MiniAppPreview.tsx`
  - Verify: Render preview trực quan, nhãn "Client Scenario Runner", highlight element khi step chạy, hỗ trợ thu gọn/ẩn.
- [x] Subtask 3.4: Tích hợp Workspace V3 đa cấp và đồng bộ mã Playwright Generated Code ("Generated Playwright Code").
  - File: `MODULE_FE/src/features/lab/strategies/AutomationV3Workspace.tsx`
  - Verify: Chuyển đổi mượt mà giữa Visual Steps và Generated `.spec.ts`, responsive 375px/768px/1024px/1440px.
- [x] Subtask 3.5: Đăng ký workspace strategy trong `workspaceRegistry.ts`.
  - File: `MODULE_FE/src/features/lab/strategies/workspaceRegistry.ts`
  - Verify: Workspace routing chọn đúng V3 cho interactionMode V3.

### Task 4: Biên soạn 24 bài học thực tế (SQL, Quiz, Automation V3)
- [x] Subtask 4.1: Biên soạn 8 bài SQL PostgreSQL thực tế (8-20 seed rows, query chuẩn, expected result, hint đa tầng, common pitfalls, challenge mở rộng).
  - File: `docs/curriculum/v3-curriculum-sql-8-labs.md` & seed integration
  - Verify: Xác minh 100% kết quả bằng in-browser PGlite engine.
- [x] Subtask 4.2: Biên soạn 8 bộ Quiz Testing Theory (40 câu tình huống thực tế, 4 distractor hợp lý, hint không lộ đáp án, giải thích chi tiết đúng/sai, pass threshold 80%).
  - File: `docs/curriculum/v3-curriculum-quiz-8-labs.md` & seed integration
  - Verify: Kiểm tra tính độc bản so với ISTQB gốc, tính logic của các distractor và giải thích.
- [x] Subtask 4.3: Biên soạn 8 bài Automation Playwright theo 3 cấp độ (3 Block Builder, 3 Smart Cloze, 2 Guided/Full Code) kèm Fixtures và Gold Sample Playwright Code.
  - File: `docs/curriculum/v3-curriculum-automation-8-labs.md` & fixtures integration
  - Verify: Compiler sinh code gold sample và pass public checks.
- [x] Subtask 4.4: Tích hợp vào Seed Script an toàn (`MODULE_BE/prisma/seed.ts`), loại bỏ `deleteMany` phá hủy dữ liệu, sử dụng upsert theo slug và `contentRevision`. 3 bài đầu mỗi series Free, 5 bài Pro.
  - File: `MODULE_BE/prisma/seed.ts`
  - Verify: Chạy seed không làm mất user submissions cũ.

### Task 5: QA, Kiểm thử hệ thống & Gate Verification
- [x] Subtask 5.1: Xây dựng Preflight Checker cho 24 bài trước publish.
  - File: `MODULE_BE/test/v3-curriculum-preflight.spec.ts`
  - Verify: Chạy preflight test suite kiểm tra toàn bộ 24 bài đạt chuẩn.
- [x] Subtask 5.2: Xây dựng Gold Sample E2E verification test suite (kiểm chứng Playwright code generated).
  - File: `MODULE_FE/src/test/automation-v3-gold-samples.test.ts`
  - Verify: Vitest kiểm tra 8 bài automation sinh mã Playwright hợp lệ.
- [x] Subtask 5.3: Cấu hình Feature Flag `AUTOMATION_V3_ENABLED` và kiểm tra tương thích ngược hồi quy.
  - File: `MODULE_FE/src/config/features.ts` (hoặc env config)
  - Verify: Chạy toàn bộ test suites (`MODULE_FE`, `MODULE_BE`, `MODULE_ADMIN`) không có bất kỳ regression nào.
