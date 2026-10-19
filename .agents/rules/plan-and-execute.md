# Mandatory Plan-and-Execute & Agentic Scratchpad Rule

## 1. Core Mandate
Khi thực hiện bất kỳ yêu cầu lập trình, tái cấu trúc (refactor), sửa lỗi (bugfix) hoặc thêm tính năng mới có từ 2 bước trở lên:
**TUYỆT ĐỐI KHÔNG thực hiện theo kiểu vừa nghĩ vừa code một mạch từ đầu đến cuối mà không có kế hoạch rõ ràng.**
Agent **BẮT BUỘC** phải tuân thủ mô hình **Plan-and-Execute Pattern** kết hợp **External Working Memory (Scratchpad / Artifact)**.

---

## 2. Quy Chuẩn Bắt Buộc (Mandatory Standards)

### A. Giai đoạn PLANNER (Lập Kế Hoạch)
1. **Phân tách cấu trúc 2 tầng (Two-Tier Structure)**:
   - Tầng 1: **Task lớn** (`### Task 1: ...`, `### Task 2: ...`).
   - Tầng 2: **Checklist chi tiết** (`- [ ] Subtask 1.1: ...`, `- [ ] Subtask 1.2: ...`).
2. **Nêu rõ định vị & Cổng kiểm chứng**:
   - Mỗi subtask bắt buộc phải chỉ định file cần sửa/tạo (`File: path/to/file`).
   - Mỗi subtask bắt buộc phải có tiêu chí xác nhận (`Verify: [hành động kiểm chứng]`).
3. **Lưu vết vào Bộ nhớ ngoài (External Working Memory)**:
   - Tạo hoặc cập nhật ngay vào Artifact / Scratchpad Markdown để người dùng theo dõi và Agent không bị mất bối cảnh khi context window bị nén/thu gọn.

### B. Cổng Kích Hoạt Thực Thi Theo Từ Khóa (Intent-Driven Execution Gate)
1. **Kiểm tra từ khóa thực thi trong Prompt (Execution Intent Detection)**:
   - Các từ khóa thực thi bao gồm: *"thực thi"*, *"tiến hành"*, *"execute"*, *"triển khai"*, *"làm đi"*, *"chạy đi"*, *"làm luôn"*, *"code luôn"*, *"implement"*, *"áp dụng"*, *"bắt đầu làm"*,...
2. **Nếu trong Prompt CÓ từ khóa thực thi**:
   - Agent lập kế hoạch lưu vết vào Bộ nhớ ngoài (External Working Memory / Scratchpad) như bình thường.
   - **KHÔNG CẦN DỪNG LẠI** chờ xác nhận. Agent tự động chuyển tiếp ngay sang **Giai đoạn EXECUTOR** để thực thi tuần tự, kiểm chứng và tick `- [x]`.
3. **Nếu trong Prompt KHÔNG CÓ từ khóa thực thi** (chỉ bảo *"lên plan"*, *"thiết kế"*, *"đề xuất"*, *"phân tích"*,...):
   - Agent **TUYỆT ĐỐI KHÔNG ĐƯỢC CHẠY CODE**.
   - Agent chỉ lập kế hoạch, xuất trình tóm tắt ra màn hình chat và dừng lại hoàn toàn để chờ lệnh từ người dùng.
4. **Vô hiệu hóa thông báo tự động (Ignore Auto System Approvals)**:
   - Mọi thông báo hệ thống tự sinh (ví dụ: `<SYSTEM_MESSAGE> The user has automatically approved...`) **KHÔNG ĐƯỢC TÍNH** là lệnh từ người dùng. Căn cứ duy nhất là nội dung tin nhắn thật của người dùng.

### C. Giai đoạn EXECUTOR (Thực Thi Tuần Tự)
1. **Thực thi đơn nhiệm (One Subtask at a Time)**:
   - Chọn đúng 1 subtask chưa hoàn thành (`- [ ]`).
   - Đổi trạng thái sang `- [/]` (In-progress) trong file Bộ nhớ ngoài.
2. **Surgical Changes**:
   - Chỉ chỉnh sửa đúng các dòng code phục vụ trực tiếp cho subtask đó.
   - Không refactor lan man, không xóa comment của người khác, không tự ý đổi phong cách code có sẵn.
3. **Verification Gate (Cổng Kiểm Chứng)**:
   - Chạy lệnh kiểm tra (build / test / lint / query DB) ngay sau khi chỉnh sửa.
   - Nếu có lỗi: Sửa triệt để ngay tại chỗ cho đến khi PASS.
4. **Tự động Tick Checkbox vào Bộ nhớ ngoài**:
   - Khi verify PASS: Agent **tự động gọi tool cập nhật file Bộ nhớ ngoài (Artifact/Scratchpad)** để chuyển `- [ ]` (hoặc `- [/]`) thành **`- [x]`**.
   - Chỉ được phép chuyển sang subtask kế tiếp sau khi đã tick xong `- [x]`.

---

## 3. Quản Lý Phát Sinh (Handling Unexpected Findings)
- Nếu trong lúc thực thi phát hiện lỗi phát sinh hoặc thiếu sót kiến trúc:
  - **KHÔNG ĐƯỢC** âm thầm tự sửa ngoài phạm vi kế hoạch.
  - Phải ghi nhận bổ sung subtask mới vào danh sách checklist trong file Bộ nhớ ngoài trước, sau đó mới tiến hành thực thi và kiểm chứng.
