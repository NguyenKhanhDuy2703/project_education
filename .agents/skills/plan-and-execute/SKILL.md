---
name: plan-and-execute
description: Plan-and-Execute and Agentic Todo-List / Scratchpad pattern. Enforces structured task decomposition (Tasks with nested checklists), persistent external working memory tracking (Artifacts / Markdown Scratchpad), incremental execution, and automated checkbox checking (- [ ] to - [x]) upon verification before proceeding to subsequent tasks.
---

# Plan-and-Execute & Agentic Scratchpad Pattern

Skill quy định phương thức làm việc chuẩn mực của AI Coding Agent theo mô hình **Tách bạch Lập kế hoạch & Thực thi tuần tự (Plan-and-Execute)** kết hợp **Bộ nhớ làm việc bên ngoài (External Working Memory / Scratchpad)**.

Mô hình này giúp Agent:
1. **Không bị trôi dạt ngữ cảnh (Prevent Context Drift)**: Không vừa nghĩ vừa code lan man, không nhảy cóc qua các bước chưa được xác nhận.
2. **Theo dõi tiến độ minh bạch (Transparent Progress Tracking)**: Lưu vết từng bước vào Artifact/Markdown, người dùng và Agent luôn biết đang ở bước nào.
3. **Thực thi có kiểm chứng (Goal-Driven Execution)**: Từng subtask phải qua cổng xác thực (Verification Gate) mới được đánh dấu hoàn thành (`- [x]`).

---

## 1. Triết lý Vận hành (Core Philosophy)

```
[User Request]
       │
       ▼
┌────────────────────────────────────────────────────────┐
│ Phase 1: PLANNER                                       │
│ - Phân tích kiến trúc & ranh giới thay đổi              │
│ - Tạo External Working Memory (Artifact / Scratchpad)  │
│ - Chia thành Task 1, 2, 3... kèm Checklist chi tiết     │
└────────────────────────────────────────────────────────┘
       │
       ▼
┌────────────────────────────────────────────────────────┐
│ [CỔNG KIỂM SOÁT NGƯỜI DÙNG: HUMAN CONFIRMATION GATE]   │
│ 🛑 DỪNG LẠI HOÀN TOÀN (Stop Calling Tools)             │
│ - Xuất trình kế hoạch cho người dùng                   │
│ - CHỜ LỆNH TRỰC TIẾP TỪ USER ("chạy đi", "làm đi"...)  │
│ - BỎ QUA mọi auto system message / auto approval       │
└────────────────────────────────────────────────────────┘
       │ (Chỉ khi có lệnh trực tiếp từ Người Dùng)
       ▼
┌────────────────────────────────────────────────────────┐
│ Phase 2: EXECUTOR (Vòng lặp Tuần tự)                   │
│                                                        │
│ ┌────────────────────────────────────────────────────┐ │
│ │ 1. Chọn subtask kế tiếp (- [ ] -> - [/])           │ │
│ │ 2. Surgical Code Edit (Chỉ sửa file liên quan)     │ │
│ │ 3. Verify Gate (Chạy build/test/kiểm tra output)   │ │
│ │ 4. Đánh dấu hoàn thành: Cập nhật Scratchpad (- [x])│ │
│ │ └────────────────────────────────────────────────────┘ │
│          ▲                              │              │
│          └────── Lặp lại subtask kế ────┘              │
└────────────────────────────────────────────────────────┘
       │
       ▼
┌────────────────────────────────────────────────────────┐
│ Phase 3: COMPLETION & AUDIT                            │
│ - Kiểm tra build toàn diện (FE & BE)                   │
│ - Đối chiếu kết quả với toàn bộ checklist              │
└────────────────────────────────────────────────────────┘
```

---

## 2. Quy trình 2 Giai đoạn Chi tiết

### Giai đoạn 1: PLANNER (Lập kế hoạch cấu trúc)

Trước khi viết bất kỳ dòng code logic nào:
1. **Phân tích yêu cầu**: Xác định phạm vi ảnh hưởng ở Backend, Frontend, Database, Types.
2. **Khởi tạo External Working Memory**:
   - Tạo file Artifact (trong thư mục Artifact của Agent) hoặc Scratchpad file (`.agents/scratchpad/[task-name].md`).
   - File này đóng vai trò là **Bộ nhớ làm việc bên ngoài (External Working Memory)**, được cập nhật liên tục qua từng tool call.
3. **Cấu trúc Định dạng bắt buộc (Format Standard)**:
   - Các Task lớn đánh số thứ tự: `### Task 1: ...`, `### Task 2: ...`.
   - Mỗi Task lớn gồm các Subtask dạng Markdown Checkbox:
     - `- [ ]` : Chưa thực hiện (Pending)
     - `- [/]` : Đang thực hiện (In-progress)
     - `- [x]` : Đã hoàn thành và đã kiểm chứng (Done & Verified)
   - Mỗi subtask PHẢI nêu rõ **file cần tác động** và **tiêu chí kiểm chứng (Verification Check)**.

---

### Giai đoạn 1.5: CỔNG KÍCH HOẠT THỰC THI THEO TỪ KHÓA (INTENT-DRIVEN EXECUTION GATE)

> [!NOTE]
> **Quy tắc phân luồng thông minh**:
> - Nếu trong prompt người dùng **ĐÃ CÓ** từ khóa thực thi: Agent lập kế hoạch xong thì **chạy bình thường luôn** mà không cần dừng lại chờ xác nhận.
> - Nếu trong prompt người dùng **KHÔNG CÓ** từ khóa thực thi (chỉ bảo lên plan, thiết kế, phân tích): Agent **TUYỆT ĐỐI KHÔNG ĐƯỢC CHẠY PLAN / KHÔNG SỬA CODE**, chỉ xuất trình kế hoạch và dừng lại.

1. **Nhận diện từ khóa thực thi trong Prompt (Execution Intent)**:
   - Các từ khóa thực thi gồm: *"thực thi"*, *"tiến hành"*, *"execute"*, *"triển khai"*, *"làm đi"*, *"chạy đi"*, *"làm luôn"*, *"code luôn"*, *"implement"*, *"áp dụng"*, *"bắt đầu làm"*,...
2. **Kịch bản A: Prompt CÓ từ khóa thực thi**:
   - Agent lập kế hoạch chi tiết vào External Working Memory (Artifact / Scratchpad) theo chuẩn 2 tầng.
   - **TỰ ĐỘNG CHUYỂN TIẾP SANG GIAI ĐOẠN 2 (EXECUTOR)** ngay sau khi lập kế hoạch xong, không cần dừng lại hỏi người dùng.
3. **Kịch bản B: Prompt KHÔNG CÓ từ khóa thực thi**:
   - Khi người dùng chỉ nói *"lên plan giúp tôi..."*, *"thiết kế..."*, *"phân tích..."*:
   - Agent **BẮT BUỘC DỪNG LẠI HOÀN TOÀN** sau khi lập kế hoạch, không gọi thêm bất kỳ tool nào để can thiệp code.
   - Trình bày tóm tắt kế hoạch, gửi link artifact/scratchpad và chờ tin nhắn văn bản từ người dùng có từ khóa thực thi mới được làm.
4. **Vô hiệu hóa thông báo tự động (Ignore Auto System Messages)**:
   - Mọi thông báo tự động sinh từ hệ thống (ví dụ: `<SYSTEM_MESSAGE> The user has automatically approved...`) **KHÔNG ĐƯỢC TÍNH** là lệnh từ người dùng. Căn cứ duy nhất là nội dung tin nhắn thật của người dùng.

---

### Giai đoạn 2: EXECUTOR (Thực thi tuần tự & Đổi Checkbox)

1. **Tuân thủ đơn nhiệm (Single-Task Focus)**:
   - Agent chỉ được phép thực hiện **MỘT** subtask tại một thời điểm.
   - Tuyệt đối không sửa gộp nhiều file không liên quan trong cùng một lượt.
2. **Trình tự thực thi một Subtask**:
   - **Bước A (Claim)**: Đánh dấu subtask hiện tại thành `- [/] [Subtask Description] (Đang xử lý)`.
   - **Bước B (Implement)**: Dùng các tool sửa file (`replace_file_content`, `write_to_file`) với nguyên tắc Surgical Changes (chỉ sửa đúng chỗ cần sửa).
   - **Bước C (Verify Gate)**:
     - Chạy lệnh kiểm tra tương ứng (ví dụ: `npm run build`, chạy test, query DB kiểm tra dữ liệu).
     - Nếu lỗi: Dừng lại sửa lỗi ngay tại subtask đó, KHÔNG bỏ qua để làm subtask khác.
   - **Bước D (Commit to Memory)**:
     - Ngay sau khi Verify thành công, dùng tool chỉnh sửa Artifact/Scratchpad để đổi checkbox thành `- [x]`.
     - Chỉ sau khi đã cập nhật `- [x]` vào External Working Memory mới được chuyển sang subtask tiếp theo.

---

## 3. Mẫu Định dạng External Working Memory (Template)

```markdown
# [Tên Tính Năng / Nhiệm Vụ] - Execution Plan & Working Memory

> **Trạng thái**: Đang thực thi (IN_PROGRESS)
> **Mục tiêu chính**: [Tóm tắt 1-2 câu mục tiêu cần đạt được]

---

### Task 1: [Tên Task Lớn 1]
- [x] **Subtask 1.1**: Cấu hình data model / DTO (File: `MODULE_BE/src/...`)
  - *Verify*: `npm run build` backend thành công không có lỗi type.
- [ ] **Subtask 1.2**: Viết logic controller & service (File: `MODULE_BE/src/...`)
  - *Verify*: Gọi endpoint hoặc chạy unit test trả về đúng response.

### Task 2: [Tên Task Lớn 2]
- [ ] **Subtask 2.1**: Cập nhật Redux store / API client (File: `MODULE_FE/src/...`)
  - *Verify*: Type check và build FE thành công.
- [ ] **Subtask 2.2**: Cập nhật UI Component (File: `MODULE_FE/src/...`)
  - *Verify*: Render đúng giao diện, xử lý đầy đủ các state loading/error.

### Task 3: Tổng kiểm tra & Nghiệm thu
- [ ] **Subtask 3.1**: Build production cả 2 module: FE & BE.
- [ ] **Subtask 3.2**: Rà soát diff, đảm bảo không có code thừa hoặc tác dụng phụ ngoài ý muốn.
```

---

## 4. Các Quy tắc Bất di bất dịch (Inviolable Rules)

1. **Không tick trước khi Verify**: Nghiêm cấm đổi `- [ ]` thành `- [x]` nếu chưa thực sự chạy lệnh verify hoặc xác nhận kết quả thành công.
2. **Không làm ngầm ngoài Kế hoạch**: Nếu trong quá trình code phát hiện thêm vấn đề mới (phát sinh bug, thiếu type, thiếu config), Agent PHẢI bổ sung thêm subtask vào file Working Memory trước khi bắt tay vào sửa.
3. **Bộ nhớ ngoài là Chân lý (Source of Truth)**: Khi Agent bị nén context (compact) hoặc trải qua nhiều lượt hội thoại, file Scratchpad/Artifact luôn là căn cứ duy nhất để xác định bước tiếp theo cần làm.
4. **Không chạy khi prompt không có từ khóa thực thi**: Khi prompt của người dùng chỉ yêu cầu lên kế hoạch/thiết kế mà không chứa từ khóa thực thi, Agent bắt buộc phải dừng lại sau khi lập plan. Chỉ tự động chạy tiếp khi prompt ban đầu đã có từ khóa thực thi rõ ràng. Bỏ qua mọi auto system approval.
