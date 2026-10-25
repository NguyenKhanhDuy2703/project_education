# Kế Hoạch Triển Khai MVP 24 Bài Lab: SQL, Testing Theory Quiz & Automation Low-Code (Playwright)

> **Mã kế hoạch**: `PLAN-MVP-24-LABS-TRIAD`
> **Trạng thái**: IMPLEMENTED & VERIFIED — 20/20 subtasks complete
> **Final audit (2026-10-24)**: Supabase read-only inventory confirms all 3 V3 series, 12 sections, and 24 labs. Release-level PGlite asset performance remains conditional and is tracked separately.
> **Tài liệu tham chiếu**:
> - [PostgreSQL SQL Tutorial & Window Functions](https://www.postgresql.org/docs/current/tutorial-sql.html)
> - [ISTQB CTFL v4.0.1](https://www.istqb.org/certifications/certified-tester-foundation-level-ctfl-v4-0/) & [OWASP WSTG](https://wstg.owasp.org/latest/2-Introduction/)
> - [Playwright Locators, Assertions, Best Practices & Parameterized Tests](https://playwright.dev/docs/locators)
> - Tuân thủ: `requirements-elicitation`, `plan-and-execute`, `ui-ux-pro-max`
> **Cơ chế vận hành**: Dual-Agent per Task (Agent 1: Coding Implementation, Agent 2: Review / Verification Gate), đảm bảo clean coding và zero conflicts.

---

## 1. Cơ Chế Điều Phối Đa Agent & Test/Boost Gates

| Task | Agent 1 (Coding Role) | Agent 2 (Review & Boost Role) | Gate Test / Boost Criteria |
| :--- | :--- | :--- | :--- |
| **Task 1: Content Model & Source Registry** | Xây Source Registry, V3 DTO/Contracts, BE/FE Codecs, Round-trip tests | Review contract compatibility, verify zero leakage of `gradingKey`, test V1/V2 backward compat | `npm test` in BE (18+ tests) & FE (229+ tests) pass; zero regression on V1/V2 parse |
| **Task 2: Client Fixture Runner & Compiler** | Xây Fixture Registry, iframe sandbox protocol, DSL validator, TS compiler, submission codec | Review security bounds (no network/fetch, RAM/time budget, reset purity), simulate 20 runs | 20-run reset test pass, 2s timeout kill pass, Playwright TS compiler generates unique test titles |
| **Task 3: UX Low-Code 3 Tiers** | Xây Palette, Block drag/click, preview timeline, step highlight, responsive tabs | Review WCAG 2.1 AA (44x44px target, keyboard navigation, reduced motion, contrast) | Responsive viewports (375, 768, 1024, 1440px) pass, screen-reader attributes verified |
| **Task 4: Content Authoring 24 Labs** | Soạn 8 SQL datasets + PGlite expecteds, 40 quiz questions, 8 Playwright fixtures + gold code | Review pedagogy, check distractor plausibility, verify 80% passing threshold, SQL PGlite run | 100% SQL solutions match expecteds in PGlite; 40 quiz items verified; 8 Playwright scripts pass |
| **Task 5: QA & Release Gate** | Preflight test runner, CI Playwright validator, feature flags, seed scripts | Audit end-to-end user journeys, check migration safety, zero data purge | CI green, 0 database migration required, 3 free preview / 5 Pro tiering enforced |

---

## 2. Kế Hoạch Chi Tiết 5 Tasks

### Task 1: Chuẩn hóa nguồn và content model
- [x] Subtask 1.1: Tạo Source Registry chuẩn hóa URL, phiên bản, ngày truy cập, giấy phép, learning objective và adaptation note.
  - File: `docs/curriculum/source-registry-and-adaptation-matrix.md`
  - Verify: File đầy đủ 5 nguồn kỹ thuật chính, tuân thủ nguyên tắc không sao chép nguyên văn.
- [x] Subtask 1.2: Tạo template chuẩn cho SQL (PostgreSQL), Quiz (Scenario-based), và Automation V3 (Block/Cloze/Guided/Full).
  - File: `docs/curriculum/templates-and-gold-samples-v3.md`
  - Verify: Schema diagram, seed rows (8-20), common pitfalls, 4 distractors, tiered hints, V3 declarative contracts.
- [x] Subtask 1.3: Thêm V3 Contract vào Frontend types (`AutomationExerciseV3`, `AutomationBlockDefinition`, `AutomationStep`, `AutomationGradingKeyV3`).
  - File: `MODULE_FE/src/types/lab.types.ts`
  - File: `MODULE_ADMIN/src/types/lab.types.ts`
  - Verify: TypeScript compiles without errors, V1/V2/V3 discriminated union is exhaustive.
- [x] Subtask 1.4: Thêm V3 DTOs và Backend Codec với cơ chế bảo mật (strip `gradingKey`, `solutionPlan`, `hiddenChecks` khỏi public envelope).
  - File: `MODULE_BE/src/modules/labs/dto/lab-contract-v1.dto.ts`
  - File: `MODULE_BE/src/modules/labs/domain/labContentCodec.ts`
  - File: `MODULE_BE/src/modules/labs/labs.service.ts`
  - Verify: Unit test xác nhận `gradingKey` và `solutionPlan` bị xóa hoàn toàn đối với learner, giữ nguyên với admin/author.
- [x] Subtask 1.5: Cập nhật Frontend Codec (`normalizeLabDetail`, `serializeEnvelope`) để parse và serialize V3 mượt mà.
  - File: `MODULE_FE/src/features/lab/domain/labContentCodec.ts`
  - Verify: Unit test round-trip V3 config và regression test V1/V2 trong `MODULE_FE/src/test/lab-codec.test.ts`.

---

### Task 2: Client fixture runner và compiler
- [x] Subtask 2.1: Xây Fixture Registry và sandbox protocol với lifecycle reset sạch sẽ.
  - File: `MODULE_FE/src/features/lab/runtime/v3/fixtureRegistry.ts`
  - Verify: Fixture registry cô lập, cấm network fetch/XHR/WebSocket, reset về `initialState` tức thì qua 20 chu kỳ.
- [x] Subtask 2.2: Xây Block DSL Validator và deterministic action runner.
  - File: `MODULE_FE/src/features/lab/runtime/v3/blockDsl.ts`
  - File: `MODULE_FE/src/features/lab/runtime/v3/blockRunner.ts`
  - Verify: Giới hạn 50 steps, timeout 2 giây, không cho arbitrary JS execution trong block mode. Hỗ trợ đầy đủ ARIA accessible roles (textbox, button, combobox, table, heading, etc.).
- [x] Subtask 2.3: Mở rộng Compiler sinh Playwright TypeScript hợp lệ với Unique Test Titles.
  - File: `MODULE_FE/src/features/lab/runtime/v3/playwrightV3Compiler.ts`
  - Verify: Compiler sinh mã chuẩn Playwright `@playwright/test`, import đúng, unique test titles.
- [x] Subtask 2.4: Thêm versioned submission codec và backend declarative plan validation.
  - File: `MODULE_FE/src/features/lab/runtime/v3/automationV3SubmissionCodec.ts`
  - File: `MODULE_BE/src/modules/labs/automation-v3-validator.ts`
  - File: `MODULE_BE/src/modules/labs/labs.service.ts`
  - Verify: Backend validate declarative plan khớp với `gradingKey` và `gradingRules` mà không cần chạy browser/RAM tốn kém. Chuẩn hóa `generatedPlaywrightCode` và `durationMs`.

---

### Task 3: UX low-code ba cấp
- [x] Subtask 3.1: Xây Block Palette (Navigation, Locator, Action, Assertion, Data) với click/keyboard insertion.
  - File: `MODULE_FE/src/features/lab/components/v3/BlockPalette.tsx`
  - Verify: Click/keyboard phím tắt chèn block vào đúng con trỏ, target >= 44x44px.
- [x] Subtask 3.2: Tích hợp Mini-App Preview, step highlight đồng bộ và timeline kết quả.
  - File: `MODULE_FE/src/features/lab/components/v3/MiniAppPreview.tsx`
  - File: `MODULE_FE/src/features/lab/components/v3/VisualStepPlanEditor.tsx`
  - Verify: Render nhãn "Client Scenario Runner", hiển thị trạng thái từng step và kết quả public checks.
- [x] Subtask 3.3: Chuyển đổi mượt mà 3 cấp độ: Block Builder → Smart Cloze → Guided/Full Code.
  - File: `MODULE_FE/src/features/lab/strategies/AutomationV3Workspace.tsx`
  - File: `MODULE_FE/src/features/lab/strategies/workspaceRegistry.ts`
  - Verify: Metadata `interactionMode` render workspace tương ứng, tab visual steps song song generated `.spec.ts`.
- [x] Subtask 3.4: Tối ưu Responsive (375px mobile tabbed, desktop 3 panes) & WCAG 2.1 AA accessibility.
  - File: `MODULE_FE/src/features/lab/strategies/AutomationV3Workspace.tsx`
  - Verify: Mobile tabs (Palette/Steps/Preview) ở viewport < 768px, focus indicator rõ ràng, hỗ trợ `prefers-reduced-motion`.

---

### Task 4: Biên soạn 24 bài cốt lõi
- [x] Subtask 4.1: Soạn 8 bài SQL nghiệp vụ PostgreSQL và kiểm chứng với PGlite.
  - Bài 1: Điều tra đơn hàng thất bại (SELECT, WHERE, ORDER BY)
  - Bài 2: Phân khúc khách hàng (AND, OR, IN, BETWEEN, ILIKE)
  - Bài 3: Phát hiện tài khoản trùng lặp (COUNT, GROUP BY, HAVING)
  - Bài 4: Đối soát doanh thu thương mại điện tử (INNER JOIN, SUM)
  - Bài 5: Tìm khách hàng và sản phẩm bị bỏ quên (LEFT JOIN, IS NULL, COALESCE)
  - Bài 6: Cảnh báo tồn kho và hàng bán vượt mức (Aggregates, CASE)
  - Bài 7: Theo dõi SLA ticket hỗ trợ (Date/Time, Interval, CTE)
  - Bài 8: Xếp hạng sản phẩm theo danh mục (ROW_NUMBER, RANK, PARTITION BY)
  - File: `MODULE_BE/prisma/v3-curriculum-data.ts`, `docs/curriculum/v3-curriculum-sql-8-labs.md`
  - Verify: Toàn bộ 8 câu truy vấn kiểm tra trả về đúng rows/columns trên in-memory PGlite (`MODULE_FE/src/test/sql-v3-pglite-curriculum.test.ts`).
- [x] Subtask 4.2: Soạn 8 Testing Theory Quizzes (40 câu hỏi scenario-based, 80% pass).
  - Quiz 1: Bảy nguyên lý kiểm thử trong release deadline
  - Quiz 2: Review requirement & static testing
  - Quiz 3: Test level & test type (Web-API-DB)
  - Quiz 4: Defect lifecycle, severity & priority
  - Quiz 5: Equivalence Partitioning
  - Quiz 6: Boundary Value Analysis
  - Quiz 7: Decision Table (Voucher, Membership, Payment)
  - Quiz 8: State Transition, Lockout, RBAC & API status
  - File: `MODULE_BE/prisma/v3-curriculum-data.ts`, `docs/curriculum/v3-curriculum-quiz-8-labs.md`
  - Verify: Mỗi câu 4 phương án nhiễu hợp lý, không lộ giải thích trước submit, 4/5 câu đạt chuẩn (`MODULE_BE/test/v3-curriculum-preflight.spec.ts`).
- [x] Subtask 4.3: Soạn 8 bài Automation Playwright (3 Block Builder, 3 Smart Cloze, 2 Guided/Full Code).
  - Bài 1: Block Builder — Cấu trúc Arrange-Act-Assert & goto
  - Bài 2: Block Builder — Locator bền vững (`getByRole`, `getByLabel`, `getByText`)
  - Bài 3: Block Builder — Tương tác form (`fill`, `click`, `check`, `selectOption`)
  - Bài 4: Smart Cloze — Web-first assertions (`toBeVisible`, `toHaveText`, `toHaveValue`, `toHaveURL`)
  - Bài 5: Smart Cloze — Đăng nhập Positive / Negative
  - Bài 6: Smart Cloze — Parameterized testing cho input boundaries
  - Bài 7: Guided Code — RBAC matrix (User, Subscriber, Admin)
  - Bài 8: Full Code — Capstone Checkout E2E flow
  - File: `MODULE_BE/prisma/v3-curriculum-data.ts`, `docs/curriculum/v3-curriculum-automation-8-labs.md`
  - Verify: Playwright code sinh ra hợp lệ, fixtures tự lưu trữ, unique test titles (`MODULE_FE/src/test/automation-v3-gold-samples.test.ts`).
- [x] Subtask 4.4: Phân chia 3 bài Free Preview và 5 bài Pro cho từng chuỗi, thiết lập idempotent upsert bằng slug.
  - File: `MODULE_BE/prisma/seed.ts`
  - Verify: Seed chạy nhiều lần không tạo bản ghi rác, không xóa tiến độ học viên cũ (`MODULE_BE/test/v3-curriculum-preflight.spec.ts`).

---

### Task 5: QA và phát hành
- [x] Subtask 5.1: Xây CI Preflight test suite cho cả 24 bài lab.
  - File: `MODULE_BE/test/v3-curriculum-preflight.spec.ts`
  - Verify: 100% lab compiles, seed schema hợp lệ, PGlite diff = 0.
- [x] Subtask 5.2: CI runner kiểm thử Playwright TypeScript sinh ra với fixture host.
  - File: `MODULE_FE/src/test/automation-v3-gold-samples.test.ts`
  - Verify: Mã sinh ra compile và run được trong Client Scenario Runner và Playwright syntax compiler.
- [x] Subtask 5.3: Feature flag `AUTOMATION_V3_ENABLED` và kiểm chứng fallback V1/V2.
  - File: `MODULE_BE/src/modules/labs/labs.service.ts`, `MODULE_FE/src/features/lab/strategies/workspaceRegistry.ts`
  - Verify: Người dùng V2/V1 vẫn thao tác bình thường không bị ảnh hưởng.

---

## 3. Nhật Ký Tiến Độ Triển Khai (Progress Tracker)

- `2026-10-22`: Khởi tạo kế hoạch tổng thể `PLAN-MVP-24-LABS-TRIAD`.
- `2026-10-22`: **Hoàn thành Task 1: Content Model & Source Registry**:
  - Source Registry: `docs/curriculum/source-registry-and-adaptation-matrix.md`
  - Standard Templates & Gold Samples V3: `docs/curriculum/templates-and-gold-samples-v3.md`
  - FE & Admin Types: `MODULE_FE/src/types/lab.types.ts`, `MODULE_ADMIN/src/types/lab.types.ts`
  - BE DTOs & Codec Security: `MODULE_BE/src/modules/labs/dto/lab-contract-v1.dto.ts`, `MODULE_BE/src/modules/labs/domain/labContentCodec.ts`, `MODULE_BE/src/modules/labs/labs.service.ts`
  - Unit tests: BE 26/26 tests, FE 240/240 tests, Admin 46/46 tests passing. Round-trip V3, V2, V1 100% fidelity.
- `2026-10-22`: **Hoàn thành Task 2 & Task 3 + Review Gate Audit (Review Agent)**:
  - Sửa lỗi bảo mật validator: `automation-v3-validator.ts` bổ sung trích xuất và thực thi `gradingKey.requiredSteps` và `gradingKey.forbiddenPatterns`.
  - Sửa lỗi mapping sandboxType: `labs.service.ts` xử lý `automation_v3` submissions.
  - Chuẩn hóa trường payload: Hỗ trợ linh hoạt `generatedPlaywrightCode` <-> `generatedCode` và `durationMs` <-> `timeMs`.
  - Sửa engine Playwright Runner: `blockRunner.ts` hỗ trợ mapping semantic roles sang ARIA và accessible name parsing.
  - Nâng cấp UX: Tích hợp mobile/tablet segmented tabs (Palette/Steps/Preview) cho `AutomationV3Workspace.tsx`.
- `2026-10-22`: **Hoàn thành Task 4 & Task 5 + Independent Verification Gate Audit**:
  - 8 SQL scenarios: datasets, queries, schema diagrams, and PGlite verification (`MODULE_FE/src/test/sql-v3-pglite-curriculum.test.ts` 8/8 passing).
  - 8 Quiz scenarios: 40 questions with 4 plausible distractors, explanations, tiered hints, and 80% passing threshold (`MODULE_BE/test/v3-curriculum-preflight.spec.ts`).
  - 8 Automation Playwright scenarios: Block Builder, Smart Cloze, Guided/Full Code with in-browser Client Scenario Runner (`MODULE_FE/src/test/automation-v3-gold-samples.test.ts` 4/4 passing).
  - Seed idempotency & Tiering: 3 Free Preview and 5 Pro labs per series in `MODULE_BE/prisma/v3-curriculum-data.ts` and `MODULE_BE/prisma/seed.ts`.
  - Test suites: BE 35/35 tests pass, FE 258/258 tests pass, Admin 46/46 tests pass. Total **339 tests passing**. Zero whitespace errors.
