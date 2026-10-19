---
title: "Runbook 02 — Frontend Auth"
document_id: "DOC-15-R02"
version: "1.0"
status: "Ready for Assignment"
owner_role: "Agent-AUTH-FE"
task_scope: "Task 1B"
updated: "2026-10-17"
---

# Runbook 02 — Frontend Auth

## 1. Thông tin guide

**Mục tiêu:** hợp nhất refresh thành single-flight coordinator, phối hợp cross-tab, refresh chủ động theo expiry và chỉ logout khi backend xác nhận session invalid.

**Đọc bắt buộc:** [analysis](../12-lab-platform-upgrade-analysis.md), [master plan — Task 1B](../13-lab-platform-upgrade-agent-execution-plan.md#task-1b-auth-frontend--single-flight-cross-tab-và-proactive-refresh), cookie contract bàn giao từ 1A.4.

**Dependencies:** 0.2 và 1A.4 đã `[x]`. **Branch:** `codex/auth-refresh-coordinator-frontend`.

### 1.1. File ownership và nhiệm vụ

| Subtask | Nhiệm vụ | File chính |
|---|---|---|
| 1B.1 | Tách single-flight coordinator | `MODULE_FE/src/services/api.client.ts`, `features/auth/services/refreshCoordinator.ts` |
| 1B.2 | Loại refresh token khỏi JS | `auth.slice.ts`, `auth.api.ts`, `GoogleCallbackPage.tsx`, types/tests |
| 1B.3 | Cross-tab coordination | coordinator và cross-tab adapter |
| 1B.4 | Proactive refresh | `features/auth/hooks/useAuth.ts`, token utility |
| 1B.5 | Session-expired UX | notification/router guard/auth UI liên quan |
| 1B.6 | FE Auth audit | Auth FE diff, tests và package config |

Không sửa backend contract, Lab/Workspace/Studio. Không thêm refresh token vào local/session storage, URL, query string hoặc response state. Network error/5xx/offline không được tự động coi là credential rejection.

## 2. Hướng dẫn thực thi

### 2.1. Trình tự

1. Khoá contract request/cookie/error codes từ 1A.4; nếu thiếu thì yêu cầu handoff, không đoán.
2. Viết test 5 request 401 đồng thời, rồi tách shared refresh Promise và one-retry rule.
3. Xóa mọi đường đọc/ghi refresh token trong JS và OAuth callback URL.
4. Thêm Web Locks khi có, fallback BroadcastChannel/local coordination có test hai context.
5. Schedule trước expiry 60 giây, tái tính khi `visibilitychange`, reuse coordinator.
6. Phân biệt invalid session với lỗi mạng; hoàn tất UX, build và audit.

### 2.2. Acceptance và verify

- 5 concurrent 401 cùng tab tạo đúng 1 refresh call; cả 5 retry với access token mới.
- Hai browser context không refresh song song hoặc logout sai.
- Fake timers chứng minh không duplicate timer/refresh loop khi background/resume.
- Source không còn refresh token trong storage/query-param; `withCredentials` đúng contract.

```powershell
Set-Location MODULE_FE
npm test -- --run
npm run build

Set-Location ..
rg -n "refresh_token|refreshToken" MODULE_FE/src
git diff --check
```

Review thủ công các match còn lại: tên type/API hợp lệ không đồng nghĩa được phép persistence trong JS.

### 2.3. Handoff bắt buộc

- Contract BE đã consume và error mapping.
- Kết quả same-tab burst, two-tab, expiry/background/resume, offline/5xx.
- Danh sách storage/URL paths đã loại bỏ.
- Test/build/manual multi-tab script, risk và rollback.
- Xác nhận exit gate Task 1B hoặc blocker.

### 2.4. Prompt mẫu để giao Agent

```text
Bạn là Agent-AUTH-FE của study-web. Thực thi duy nhất Task 1B theo
docs/agent-guides/02-auth-frontend.md và master checklist
docs/13-lab-platform-upgrade-agent-execution-plan.md.

Chỉ bắt đầu khi FE test runner Task 0.2 và cookie/error contract Task 1A.4 đã sẵn sàng.
Đọc AGENTS.md, analysis, master plan và handoff API. Chụp git status --short; giữ file dirty.
Claim một subtask [ ] -> [/], verify bằng test thật rồi mới -> [x].

Tạo RefreshCoordinator single-flight, cross-tab coordination và proactive refresh; loại refresh
token khỏi storage/URL/JS state. Chỉ logout khi backend xác nhận session invalid; network/5xx/offline
phải giữ session state và có feedback. Không sửa backend contract hoặc bất kỳ file Lab/Studio nào.

Chạy FE tests/build, test same-tab burst, two-context, fake-timer background/resume và source audit.
Nếu API contract không đủ rõ, dừng và yêu cầu Agent-AUTH-BE/PM xác nhận; không tự đoán.
Handoff theo runbook với contract, command/result, manual multi-tab script, risk và rollback.
```

## 3. Tài liệu tham khảo

- [Runbook hub](README.md)
- [Master plan](../13-lab-platform-upgrade-agent-execution-plan.md)
- [Architecture analysis](../12-lab-platform-upgrade-analysis.md)
