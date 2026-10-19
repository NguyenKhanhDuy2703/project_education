---
title: "Runbook 00 — PM and Architecture Foundation"
document_id: "DOC-15-R00"
version: "1.0"
status: "Ready for Assignment"
owner_role: "Agent-PM/ARCH"
task_scope: "Task 0"
updated: "2026-10-17"
---

# Runbook 00 — PM and Architecture Foundation

## 1. Thông tin guide

**Mục tiêu:** thiết lập baseline, test harness và các quyết định kiến trúc để agent feature không triển khai trên giả định chưa được duyệt.

**Đọc bắt buộc:** [analysis](../12-lab-platform-upgrade-analysis.md), [master plan — Task 0](../13-lab-platform-upgrade-agent-execution-plan.md#task-0-baseline-test-harness-và-architecture-gates), `AGENTS.md`.

**Dependencies:** không. **Branch đề xuất:** `codex/lab-upgrade-foundation`.

### 1.1. Phạm vi và nhiệm vụ

| Subtask | Nhiệm vụ | Đầu ra / file chính |
|---|---|---|
| 0.1 | Chốt baseline và owner của file dirty | PR description / ownership table; không sửa application code |
| 0.2 | Thiết lập FE test runner thật | `MODULE_FE/package.json`, test config, `MODULE_FE/src/test/**` |
| 0.3 | Thiết lập BE/integration test runner thật | `MODULE_BE/package.json`, test config, `MODULE_BE/test/**` |
| 0.4 | Chốt Auth session model | `docs/adr/ADR-001-auth-refresh-rotation.md` |
| 0.5 | Benchmark PGlite và sql.js | report spike, browser/bundle/init/query/reset metrics |
| 0.6 | Freeze Definition of Ready | `.github/pull_request_template.md` hoặc master plan |

### 1.2. Ranh giới ownership

Được sửa đúng các file test/config/ADR/report/template của Task 0. Không triển khai Auth, Lab strategy, Workspace hoặc Studio. Không reset/clean working tree. Spike SQL phải độc lập và không tích hợp UI.

## 2. Hướng dẫn thực thi

### 2.1. Trình tự

1. Chụp baseline bằng `git status --short`, commit/ref hiện tại và bảng owner file dirty.
2. Claim từng subtask trong master plan: `[ ]` → `[/]`.
3. Thiết lập runner FE/BE tối thiểu nhưng thật; xác nhận test database không trỏ production.
4. Viết ADR Auth gồm decision, alternatives, security consequences, migration và rollback.
5. Chạy spike SQL trên cùng dataset: 3 bảng, tổng 1.000 rows, JOIN/GROUP BY/CTE/window function. Chọn PGlite khi đạt budget; sql.js chỉ qua quyết định có ghi dialect trade-off.
6. Chốt PR template/Definition of Ready, chạy thử với một PR mẫu.
7. Chỉ chuyển subtask sang `[x]` sau khi bằng chứng verify được ghi lại.

### 2.2. Gate kiểm chứng

```powershell
Set-Location MODULE_FE
npm test -- --run

Set-Location ../MODULE_BE
npm test -- --runInBand

Set-Location ..
git diff --check
```

SQL budget: lazy chunk gzip mục tiêu ≤ 4 MB; cold init ≤ 2 giây; query p95 ≤ 500 ms; memory không tăng không giới hạn sau 20 reset. Nếu command thực tế khác, cập nhật script chuẩn và ghi nguyên command/result trong handoff.

### 2.3. Handoff bắt buộc

- Baseline ref và danh sách file dirty/owner.
- FE/BE test command thật và kết quả.
- Link ADR Auth đã approve.
- Báo cáo benchmark và quyết định `PGlite` hoặc ADR fallback `sql.js`.
- Definition of Ready đã dry-run.
- Các gate mở cho Task 1A, 1B và 2; issue còn mở.

### 2.4. Prompt mẫu để giao Agent

```text
Bạn là Agent-PM/ARCH cho dự án study-web. Hãy thực thi đúng Task 0 trong
docs/13-lab-platform-upgrade-agent-execution-plan.md, theo runbook
docs/agent-guides/00-pm-architecture-foundation.md.

Trước khi làm: đọc AGENTS.md, docs/12-lab-platform-upgrade-analysis.md và master plan;
chụp git status --short; giữ nguyên mọi thay đổi hiện hữu. Chỉ claim một subtask bằng
[ ] -> [/] trong master plan, verify xong mới đổi -> [x]. Không triển khai feature.

Bạn phải bàn giao: baseline ownership, FE/BE test runner chạy thật, ADR Auth session,
benchmark PGlite vs sql.js theo budget, Definition of Ready và bằng chứng command.
PGlite là lựa chọn ưu tiên; chỉ đề xuất sql.js bằng ADR khi PGlite không đạt budget.
Nếu file owner, test DB, security decision hoặc dependency chưa rõ, dừng subtask và báo PM;
không tự đoán, không reset/overwrite working tree, không refactor ngoài scope.

Kết thúc bằng handoff theo mẫu trong runbook, liệt kê file, command/result, gate đã mở,
rủi ro, rollback và hành động tiếp theo.
```

## 3. Tài liệu tham khảo

- [Runbook hub](README.md)
- [Master plan](../13-lab-platform-upgrade-agent-execution-plan.md)
- [Architecture analysis](../12-lab-platform-upgrade-analysis.md)
