---
title: "Runbook 05 — Automation Workspace & Low-Code V3 Engine"
document_id: "DOC-15-R05"
version: "3.0"
status: "Authoritative"
owner_role: "Agent-AUTO & QA Architecture"
task_scope: "Automation V3 Low-Code & Playwright Runner"
updated: "2026-10-22"
---

# Runbook 05 — Automation Workspace & Low-Code V3 Engine

## 1. Thông tin guide

**Mục tiêu:** Xây dựng và duy trì hệ thống thực thi kiểm thử tự động Automation V3 kết hợp hai môi trường:
1. **Legacy V1/V2**: Monaco Editor + Smart Cloze Parameterized (`AutomationTestWorkspace.tsx`).
2. **Modern V3 Low-Code**: Visual Block Palette + AST Compiler sang Playwright TypeScript + Iframe Micro-App Sandbox Runner (`AutomationV3Workspace.tsx`).

**Tài liệu liên quan bắt buộc:**
- Sequence Workflow: [14-automation-v3-client-sandbox-flow.md](../workflows/14-automation-v3-client-sandbox-flow.md)
- Quyết định kiến trúc: [ADR-003: Client-Side Fixture Runner & Zero-Browser Automation V3](../adr/003-client-automation-v3-sandbox-runner.md)
- Đặc tả Contract: [lab-content-contract-v3.md](../specs/lab-content-contract-v3.md)

---

## 2. File Ownership & Kiến trúc Hệ thống

| Subsystem | Trách nhiệm | File chính |
|---|---|---|
| **V3 Workspace Strategy** | Layout 3 vùng (Desktop) / Tabs (Mobile), điều phối timeline, toolbar, và feedback error diff | `MODULE_FE/src/features/lab/strategies/AutomationV3Workspace.tsx` |
| **Strategy Dispatcher** | Đọc lab type + version, kiểm tra feature flag `AUTOMATION_V3_ENABLED`, định tuyến V2 vs V3 | `MODULE_FE/src/features/lab/strategies/workspaceRegistry.ts` |
| **Feature Configuration** | Quản lý flag cấu hình tập trung và hỗ trợ dynamic test override | `MODULE_FE/src/config/features.ts` |
| **Block Palette & Editor** | Bảng chọn block theo danh mục (`navigation`, `locator`, `action`, `assertion`, `data`), keyboard reorder, step lock | `MODULE_FE/src/features/lab/components/v3/BlockPalette.tsx`, `VisualStepPlanEditor.tsx` |
| **AST Compiler** | Chuyển đổi declarative plan thành Playwright `.spec.ts` chuẩn web-first locators và assertions | `MODULE_FE/src/features/lab/runtime/v3/playwrightCompiler.ts` |
| **Iframe Sandbox Runner** | Host web fixture nội bộ, giao tiếp qua `postMessage`, highlight DOM element với visual ring | `MODULE_FE/src/features/lab/components/v3/MiniAppPreview.tsx` |
| **Submission Codec** | Encode và decode payload Base64 phiên bản hóa cho submission audit | `MODULE_FE/src/features/lab/runtime/v3/automationV3SubmissionCodec.ts` |
| **Backend Validator** | Thẩm định cấu trúc plan, kiểm tra revision, chấm điểm theo private `gradingKey` (0 browser on server) | `MODULE_BE/src/modules/labs/automation-v3-validator.ts` |

---

## 3. Quy tắc Triển khai & An toàn (Safety Invariants)

1. **Client-Side RAM Isolation**:
   - Toàn bộ mini-app fixture chạy trong `<iframe>` sandbox trên RAM/CPU của learner.
   - Cấm hoàn toàn `fetch`, XHR, WebSocket, và dynamic import trong runtime runner.
   - Giới hạn cứng: **2000ms Timeout**, **tối đa 50 steps**, **tối đa 100 log lines**.
2. **Server Zero-Browser Invariant**:
   - Backend `MODULE_BE` **không bao giờ khởi chạy Playwright hay Chromium thật**.
   - Việc chấm điểm tiến hành dựa trên việc so khớp declarative step plan với `gradingKey` ẩn.
3. **Phân quyền & Ẩn Solution**:
   - `gradingKey`, `requiredSteps`, và `solutionPlan` bắt buộc phải bị strip bởi `labContentCodec` trước khi gửi cho learner.
   - Chỉ role `Admin` hoặc `Author` mới nhận được `gradingKey` đầy đủ.
4. **UX Ergonomics**:
   - Mọi nút bấm, tab switch, và block palette item phải đảm bảo target tối thiểu $44\times 44$px trên màn hình cảm ứng.
   - Hỗ trợ keyboard navigation (`Tab`, `Enter`, `Space`) và `prefers-reduced-motion`.

---

## 4. Quy trình Kiểm thử & Xác minh (Verification Runbook)

```powershell
# 1. Kiểm tra unit test và component tests cho Frontend
npm --prefix MODULE_FE test -- --run src/test/automation-v3-workspace.test.tsx src/test/automation-v3-runtime-safety.test.ts src/test/automation-v3-gold-samples.test.ts

# 2. Kiểm tra validator và preflight curriculum Backend
npm --prefix MODULE_BE test -- test/automation-v3-validator.spec.ts test/v3-curriculum-preflight.spec.ts

# 3. Kiểm tra TypeScript build trên cả 3 modules
npm --prefix MODULE_FE run build
npm --prefix MODULE_BE run build
npm --prefix MODULE_ADMIN run build

# 4. Kiểm tra định dạng git diff
git diff --check
```
