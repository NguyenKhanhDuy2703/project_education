---
title: "Runbook 01 — Backend Auth"
document_id: "DOC-15-R01"
version: "1.0"
status: "Ready for Assignment"
owner_role: "Agent-AUTH-BE"
task_scope: "Task 1A"
updated: "2026-10-17"
---

# Runbook 01 — Backend Auth

## 1. Thông tin guide

**Mục tiêu:** làm refresh rotation atomic/idempotent, lưu session bằng token hash, dùng HttpOnly cookie cho browser và revoke đúng policy.

**Đọc bắt buộc:** [analysis](../12-lab-platform-upgrade-analysis.md), [master plan — Task 1A](../13-lab-platform-upgrade-agent-execution-plan.md#task-1a-auth-backend--rotation-correctness-và-revocation), ADR Auth từ Task 0.4.

**Dependencies:** 0.3 và 0.4 đã `[x]`. **Branch:** `codex/auth-refresh-rotation-backend`.

### 1.1. File ownership và nhiệm vụ

| Subtask | Nhiệm vụ | File được sở hữu |
|---|---|---|
| 1A.1 | Characterization race/replay | `MODULE_BE/test/auth-refresh.integration.test.ts` |
| 1A.2 | AuthSession persistence/migration | `MODULE_BE/prisma/schema.prisma`, migration mới, Auth module |
| 1A.3 | Atomic/idempotent rotation | `MODULE_BE/src/modules/auth/auth.service.ts`, session repository/service |
| 1A.4 | Cookie-only browser contract | Auth controller/DTO/cookie config/tests |
| 1A.5 | Logout/revoke coverage | Auth service/controller/tests |
| 1A.6 | Build và security audit | Chỉ Auth-related diff và migration |

Chỉ sửa `users.service.ts` nếu AuthSession thật sự cần và ghi lý do. Không sửa FE, Lab, Workspace, Studio hoặc contract Lab. Không lưu/log raw refresh token; không thay policy ngoài ADR.

## 2. Hướng dẫn thực thi

### 2.1. Trình tự

1. Xác nhận ADR đã approve và test DB không phải production.
2. Viết characterization tests trước; ghi bằng chứng race/failure của baseline.
3. Thêm AuthSession và migration có đường apply/rollback; chỉ lưu hash.
4. Implement rotation trong transaction/atomic operation theo current/previous window của ADR.
5. Đổi browser contract sang HttpOnly cookie; response body không chứa refresh token.
6. Hoàn thiện revoke/logout matrix, build, integration suite và raw-token audit.

### 2.2. Acceptance và verify

- Valid/invalid/expired, 2 và 20 concurrent refresh, logout rồi replay đều deterministic.
- Token cuối cùng còn dùng được; previous token chỉ hợp lệ trong grace window.
- `Set-Cookie` flags và clear-cookie options nhất quán; body không trả refresh token.
- Current/previous token của session bị revoke; multi-device theo đúng ADR.

```powershell
Set-Location MODULE_BE
npx prisma validate
npx prisma generate
npm test -- --runInBand
npm run build

Set-Location ..
rg -n "refresh.?token" MODULE_BE/src MODULE_BE/test
git diff --check
```

Không dùng kết quả `rg` như pass/fail tự động: review từng match để chắc chắn không có raw token trong log hoặc persistence.

### 2.3. Handoff bắt buộc

- Migration name, apply/rollback result và compatibility note.
- Bảng concurrency/replay/revoke với expected/actual.
- Cookie request/response contract để Agent-AUTH-FE consume.
- Test/build result, raw-token audit, security risk và rollback.
- Xác nhận Task 1A exit gate hoặc blocker cụ thể.

### 2.4. Prompt mẫu để giao Agent

```text
Bạn là Agent-AUTH-BE của study-web. Thực thi duy nhất Task 1A theo
docs/agent-guides/01-auth-backend.md và checklist tại
docs/13-lab-platform-upgrade-agent-execution-plan.md.

Chỉ bắt đầu khi Task 0.3 và ADR Task 0.4 đã được duyệt. Đọc AGENTS.md, analysis,
master plan và ADR. Chụp git status --short, bảo toàn file dirty. Claim từng subtask
[ ] -> [/], viết characterization test trước, verify xong mới -> [x].

Phạm vi là MODULE_BE Auth, AuthSession migration và integration tests. Không sửa FE/Lab,
không lưu hoặc log raw refresh token, không thay session/revoke policy ngoài ADR. Rotation
phải atomic/idempotent; browser refresh dùng HttpOnly cookie và response body không trả token.

Chạy Prisma validate/generate, Auth integration suite, BE build, concurrency/replay/revoke
matrix và git diff --check. Nếu test DB, ADR hoặc migration rollback chưa an toàn, dừng và báo PM.
Handoff phải nêu migration, API cookie contract cho Agent-AUTH-FE, command/result, risk và rollback.
```

## 3. Tài liệu tham khảo

- [Runbook hub](README.md)
- [Master plan](../13-lab-platform-upgrade-agent-execution-plan.md)
- [Architecture analysis](../12-lab-platform-upgrade-analysis.md)
