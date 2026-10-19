---
title: "Runbook 03 — Lab Content Contract"
document_id: "DOC-15-R03"
version: "1.0"
status: "Ready for Assignment"
owner_role: "Agent-CONTRACT"
task_scope: "Task 2"
updated: "2026-10-17"
---

# Runbook 03 — Lab Content Contract

## 1. Thông tin guide

**Mục tiêu:** tạo một Lab Content Contract V1 có discriminator theo `sandboxType`, codec/normalizer tập trung, DTO hợp lệ và persistence round-trip tương thích dữ liệu cũ.

**Đọc bắt buộc:** [analysis](../12-lab-platform-upgrade-analysis.md), [master plan — Task 2](../13-lab-platform-upgrade-agent-execution-plan.md#task-2-lab-content-contract-dto-và-backward-compatibility).

**Dependencies:** 0.2 và 0.3 đã `[x]`. **Branch:** `codex/lab-content-contract-v1`.

### 1.1. File ownership và nhiệm vụ

| Subtask | Nhiệm vụ | File chính |
|---|---|---|
| 2.1 | Discriminated contract V1 | `MODULE_FE/src/types/lab.types.ts`, BE domain types |
| 2.2 | Codec/normalizer một nguồn | `features/lab/domain/labContentCodec.ts`, BE counterpart |
| 2.3 | Create/Update nested DTO | `MODULE_BE/src/modules/labs/dto/**` |
| 2.4 | Persistence mapper | `MODULE_BE/src/modules/labs/labs.service.ts`, mapper mới |
| 2.5 | Legacy seed/migration path | `MODULE_BE/prisma/seed.ts`, fixtures/script khi cần |
| 2.6 | Freeze response shape | API types/docs/snapshots/tests |

Agent này sở hữu shared Lab types, DTO, codec/normalizer và persistence mapper. Không triển khai Workspace UI/Studio UX. Không đổi database schema Lab trong MVP nếu mapper vào field hiện hữu đáp ứng được. Không tự sửa production records khi chưa có backup.

## 2. Hướng dẫn thực thi

### 2.1. Trình tự

1. Thu thập fixtures legacy SQL/Quiz/JS và payload authoring hiện tại.
2. Định nghĩa `AutomationTestConfig`, `SqlLabConfig`, `QuizLabConfig`, `LabContentEnvelopeV1`, `PracticeLab` với exhaustive switch.
3. Tạo codec duy nhất: legacy parse → diagnostics → normalized V1 → serialize; loại `JSON.parse` rải rác ở consumer.
4. Bổ sung nested DTO và validation theo discriminator; unknown field vẫn bị reject.
5. Map prose/starter/tests/solution/config vào persistence hiện tại và test semantic round-trip.
6. Chạy codec trên toàn seed, lập migration report và freeze snapshot có PM/SHELL/STUDIO approve.

### 2.2. Acceptance và verify

- Invalid type-specific config bị từ chối; malformed legacy data trả diagnostics, không sinh sample giả.
- Create → read → update → read semantic-equal cho cả ba sandbox type.
- Existing seed đọc được hoặc có danh sách record cần xử lý rõ ràng; migration idempotent.
- Solution tiếp tục tuân entitlement; response V1 chỉ đổi qua ADR/version bump sau freeze.

```powershell
Set-Location MODULE_FE
npm test -- --run
npm run build

Set-Location ../MODULE_BE
npm test -- --runInBand
npm run build

Set-Location ..
git diff --check
```

### 2.3. Handoff bắt buộc

- Contract V1 và discriminator examples cho 3 type.
- Codec API, diagnostics format và legacy compatibility report.
- DTO/request/response snapshot; persistence field mapping.
- FE/BE test/build results và seed audit.
- Approval refs của PM, Agent-SHELL, Agent-STUDIO; version-change rule.

### 2.4. Prompt mẫu để giao Agent

```text
Bạn là Agent-CONTRACT của study-web. Thực thi duy nhất Task 2 theo
docs/agent-guides/03-lab-content-contract.md và master checklist
docs/13-lab-platform-upgrade-agent-execution-plan.md.

Chỉ bắt đầu khi test runner FE/BE (0.2, 0.3) đã pass. Đọc AGENTS.md, analysis và master
plan; chụp git status --short; giữ file dirty. Claim một subtask [ ] -> [/], verify rồi -> [x].

Bạn sở hữu shared Lab types, DTO, codec/normalizer và persistence mapper. Tạo contract V1
discriminated cho js_worker/sql_worker/quizlet, hỗ trợ dữ liệu legacy và semantic round-trip.
Malformed input phải có diagnostics; không fallback data giả. Không triển khai Workspace/Studio UI,
không đổi schema Lab nếu mapping hiện hữu đủ, không sửa production data khi chưa có backup.

Chạy type/unit/API integration tests, FE/BE build, seed compatibility audit và git diff --check.
Freeze response snapshot chỉ sau khi PM, Agent-SHELL và Agent-STUDIO approve. Handoff phải nêu
contract/codec API, DTO snapshot, persistence mapping, command/result, migration risk và rollback.
```

## 3. Tài liệu tham khảo

- [Runbook hub](README.md)
- [Master plan](../13-lab-platform-upgrade-agent-execution-plan.md)
- [Architecture analysis](../12-lab-platform-upgrade-analysis.md)
