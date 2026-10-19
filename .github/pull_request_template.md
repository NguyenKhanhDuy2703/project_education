## Agent Pull Request & Verification Report

### 1. Thông tin Tổng quan
- **Agent Role**: `[Agent-PM/ARCH | Agent-AUTH-BE | Agent-AUTH-FE | Agent-CONTRACT | Agent-SHELL | Agent-AUTO | Agent-SQL | Agent-QUIZ | Agent-STUDIO | Agent-QA/DOCS]`
- **Task Scope**: `[Task 0 | 1A | 1B | 2 | 3 | 4 | 5 | 6 | 7 | 8]`
- **Branch / Worktree**:
- **Master Plan Subtasks Completed**: `[e.g., Subtask 0.1, 0.2]`

---

### 2. Danh sách File Thay đổi & Ranh giới Ownership
- [ ] Tôi xác nhận CHỈ thay đổi các file thuộc phạm vi ownership được phân công.
- [ ] Không có drive-by refactoring hoặc sửa đổi code ngoài luồng.
- [ ] Bảo toàn toàn bộ dirty files của các nhánh tính năng khác.

**Files Changed**:
- `path/to/file`

---

### 3. Cổng Kiểm chứng (Verification Gates Passed)
- [ ] `npm test` hoặc test suite liên quan đã pass (đính kèm log bên dưới):
```text
[Paste terminal test execution output here]
```
- [ ] `npm run build` thành công không có lỗi type:
```text
[Paste build output here]
```
- [ ] `git diff --check` không có khoảng trắng thừa hoặc conflict marker.

---

### 4. Tương thích Ngược & Quản lý Rủi ro (Backward Compatibility & Risk)
- [ ] Tương thích ngược với dữ liệu cũ (Legacy seeds / envelopes).
- [ ] Không rò rỉ token hoặc bí mật vào log / git history.
- [ ] Kế hoạch khôi phục (Rollback plan) nếu phát sinh lỗi trên môi trường staging/production.

---

### 5. Handoff tiếp theo
- **Yêu cầu đối tác / Agent kế tiếp**:
- **API / Contract bàn giao**:
