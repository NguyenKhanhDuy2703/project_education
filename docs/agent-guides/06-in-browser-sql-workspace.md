---
title: "Runbook 06 — In-browser SQL Workspace"
document_id: "DOC-15-R06"
version: "1.0"
status: "Ready for Assignment"
owner_role: "Agent-SQL"
task_scope: "Task 5"
updated: "2026-10-17"
---

# Runbook 06 — In-browser SQL Workspace

## 1. Thông tin guide

**Mục tiêu:** thực thi SQL thật trong browser bằng adapter + Web Worker, ưu tiên PGlite; cung cấp schema preview, query guard, result diff và SQL workspace độc lập.

**Đọc bắt buộc:** [analysis](../12-lab-platform-upgrade-analysis.md), [master plan — Task 5](../13-lab-platform-upgrade-agent-execution-plan.md#task-5-in-browser-sql-engine-và-sql-practice-workspace), quyết định spike 0.5, contract 2.6 và interface 3.4.

**Dependencies:** 0.5, 2.6 và 3.4 đạt gate. **Branch:** `codex/pglite-sql-workspace`.

### 1.1. File ownership và nhiệm vụ

| Subtask | Nhiệm vụ | File chính |
|---|---|---|
| 5.1 | `SqlEngineAdapter` | `features/lab/sql-engine/types.ts`, `SqlEngineAdapter.ts` |
| 5.2 | PGlite Worker adapter | worker/adapter, package/config tối thiểu |
| 5.3 | Dataset lifecycle/reset | engine service, worker fixtures |
| 5.4 | Query guard/timeout | guard utility, worker controller |
| 5.5 | Result normalization/diff | `sqlResultNormalizer.ts`, `sqlDiff.ts`, tests |
| 5.6 | Schema preview | `SqlSchemaPreview.tsx`, tests |
| 5.7 | Practice workspace | `SqlPracticeWorkspace.tsx`, tests |
| 5.8 | Xóa regex evaluator | Agent-SHELL hoặc paired integration commit |
| 5.9 | Performance/fallback gate | bundle/benchmark report; ADR nếu fallback |

Agent-SQL không sửa `LabWorkspacePage.tsx` hoặc Studio. UI không import PGlite trực tiếp. PGlite là lựa chọn mặc định; chỉ dùng sql.js sau khi benchmark fail và PM duyệt ADR nêu rõ SQLite dialect differences.

## 2. Hướng dẫn thực thi

### 2.1. Trình tự

1. Xác nhận report 0.5 và engine decision; chưa có thì không thêm package.
2. Định nghĩa adapter `initialize/execute/reset/dispose/cancel` và contract-test bằng fake adapter.
3. Implement PGlite qua dynamic import trong Worker, in-memory mặc định; không eager bundle/IndexedDB.
4. Load `schemaSql` + `seedSql` deterministic, reset sạch khi đổi lab.
5. Guard một statement: allow `SELECT`, `WITH`, optional `EXPLAIN`; reject DDL/DML/multi-statement; hard timeout 3 giây.
6. Chuẩn hoá column/NULL/number/date/duplicate/order và tạo semantic diff.
7. Tạo preview/workspace độc lập, chạy JOIN/GROUP BY/CTE/window fixtures và handoff Shell.
8. Phối hợp Shell xóa regex path sau parity; đo lại bundle/init/p95/memory và lập report.

### 2.2. Acceptance và verify

- 20 init/reset cycles không bleed data hoặc tăng memory vô hạn.
- Timeout/heavy query terminate worker và UI có thể chạy lại.
- Security policy chặn DDL/DML, multi-statement và guard bypass fixtures trước khi gửi vào engine.
- Lazy chunk gzip mục tiêu ≤ 4 MB; cold init ≤ 2 giây; query p95 ≤ 500 ms trên desktop benchmark.
- Initial route bundle không chứa eager engine; SQL exercises chạy engine thật, không regex giả lập.

```powershell
Set-Location MODULE_FE
npm test -- --run
npm run build

Set-Location ..
rg -n "regex|RegExp|Sample Test Cases" MODULE_FE/src/pages/lab MODULE_FE/src/features/lab
git diff --check
```

`rg` là audit hỗ trợ; paired removal ở 5.8 do Agent-SHELL sở hữu page và chỉ thực hiện sau parity gate.

### 2.3. Handoff bắt buộc

- Engine decision/ref, package/chunk impact và adapter API.
- Query allow/deny matrix, timeout/recovery và 20-cycle lifecycle result.
- Supported PostgreSQL syntax fixtures; normalization/diff rules.
- Public workspace/schema exports cho Shell; paired change cần thiết cho 5.8.
- Benchmark report, ADR fallback nếu có, test/build result, risk và rollback.

### 2.4. Prompt mẫu để giao Agent

```text
Bạn là Agent-SQL của study-web. Thực thi duy nhất Task 5 theo
docs/agent-guides/06-in-browser-sql-workspace.md và master checklist.

Chỉ bắt đầu khi SQL spike 0.5, Lab contract 2.6 và WorkspaceProps 3.4 đã đạt gate.
Đọc AGENTS.md, analysis, master plan và các handoff; chụp git status --short, giữ file dirty.
Claim một subtask [ ] -> [/], verify rồi -> [x].

Tạo SqlEngineAdapter và chạy PGlite lazy trong Web Worker, in-memory mặc định. Implement
dataset reset, read-only query guard, hard timeout, result normalizer/diff, schema preview và
SqlPracticeWorkspace độc lập. Không sửa LabWorkspacePage.tsx hoặc Studio. Chỉ fallback sql.js
khi PGlite fail budget và PM approve ADR nêu rõ khác biệt dialect; không fallback âm thầm.

Chạy adapter/unit/component tests, JOIN/GROUP BY/CTE/window fixtures, 20 reset cycles, bundle,
init/query/memory benchmark và FE build. Handoff exports cho Agent-SHELL; regex removal phải do
Shell hoặc paired commit sau parity. Báo đầy đủ command/result, budget, risk và rollback.
```

## 3. Tài liệu tham khảo

- [Runbook hub](README.md)
- [Master plan](../13-lab-platform-upgrade-agent-execution-plan.md)
- [Architecture analysis](../12-lab-platform-upgrade-analysis.md)

## 4. Browser Support and Failure Policy

- Supported: current stable Chrome, Edge, Firefox, and Safari releases with WebAssembly and module Web Worker support.
- Storage: learning sandboxes use `memory://`; refreshing or leaving the lab discards database mutations. The editor draft is persisted separately by the application.
- No main-thread database fallback: when Worker or WebAssembly startup fails, show an unsupported-runtime message with Retry and browser-update guidance. Running PostgreSQL WASM on the UI thread is not an acceptable fallback.
- No SQLite fallback: silently changing dialect would make PostgreSQL lessons incorrect.
- Offline behavior: a previously cached application may initialize, but a first visit requires the PGlite worker, WASM, and data assets to be downloadable. Failure is retryable and must not record a learner failure.
- Timeout recovery: terminate the worker, create a replacement, await complete schema/seed initialization, and only then return the workspace to Ready.
- Persistence is deliberately not implemented with IndexedDB or OPFS. This avoids stale lab versions, cross-attempt state bleed, storage cleanup, and Safari OPFS incompatibility.

See [ADR-002](../adr/002-pglite-sql-sandbox.md) for the trust boundary and authoritative grading decision.
