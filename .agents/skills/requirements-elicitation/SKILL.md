---
name: requirements-elicitation
description: Rigorous architectural interviewing, Socratic interrogation, and critical requirement elicitation. Triggers when the user wants to refine an idea, plan a new feature, design an architecture, resolve ambiguities, or explicitly asks the AI to interrogate, challenge, question, and deeply elicit context before implementing.
---

# requirements-elicitation

Skill dành cho việc **phỏng vấn đào sâu kiến trúc, phản biện logic (Socratic Interrogation) và thu thập bối cảnh toàn diện** trước khi thiết kế hoặc viết code.

---

## 1. Triết lý Cốt lõi (Philosophy)

1. **Không giả định khi chưa có căn cứ (Never Assume)**: Nếu yêu cầu còn điểm mù, mơ hồ hoặc có nhiều cách hiểu, AI bắt buộc phải đặt câu hỏi làm rõ thay vì tự tiện chọn hướng đi.
2. **Phản biện đa chiều (Critical Counter-Questioning)**: Không chỉ ghi nhận mong muốn bề mặt ("what"), AI phải hỏi sâu về động cơ ("why"), giới hạn ("boundary"), và các trường hợp lỗi/ngoại lệ ("edge cases").
3. **Đào sâu từng vòng (Iterative Probing)**: Tiếp tục đặt câu hỏi từ tổng quan (Core Concept) đến chi tiết kỹ thuật (Data Model, Security, Performance, UI/UX) cho đến khi 100% bối cảnh và tiêu chí thành công (Success Criteria) được xác định rõ ràng.

---

## 2. Khung Phân tích 6 Trụ cột (The 6-Pillar Framework)

Mỗi lần kích hoạt phỏng vấn yêu cầu, AI phải kiểm tra qua đủ 6 trụ cột:

| Trụ cột | Trọng tâm phân tích |
|---|---|
| **1. Business Intent & Scope** | Mục tiêu cốt lõi là gì? Ai dùng? Ai quản trị? Đâu là ranh giới trong scope (In-scope) và ngoài scope (Out-of-scope)? |
| **2. Permission & Security Boundary** | Ai có quyền cấp? Ai có quyền bị cấm? Cơ chế chặn ở cấp Backend (Guard/Filter) ra sao? Chống bypass thế nào? |
| **3. Data Model & Lifecycle** | Thực thể lưu trữ gồm những bảng/cột nào? Quan hệ 1-n hay n-n? Vòng đời của một record (tạo, cập nhật, hết hạn, soft-delete)? |
| **4. Edge Cases & Exception Handling** | Điều gì xảy ra khi xung đột quyền (Role cho phép nhưng User bị cấm, hoặc ngược lại)? Hết hạn quyền? Bị cấm giữa chừng khi đang thao tác? |
| **5. Performance & Caching** | Quyền hạn có được cache không? Khi Admin đổi quyền trên UI thì cache bị invalidate tức thì (real-time) hay đợi token hết hạn? |
| **6. UI/UX Interaction & Feedback** | User thấy gì trên UI khi bị cấm một tính năng (Ẩn nút, disable, hay hiển thị modal nâng cấp/bị khóa)? Admin thao tác thế nào trên trang quản trị? |

---

## 3. Quy tắc Đặt Câu hỏi (Questioning Rules)

- **Chia nhóm có cấu trúc**: Không đặt câu hỏi lộn xộn; gom nhóm theo chủ đề (Kiến trúc, Nghiệp vụ, Ngoại lệ, Giao diện).
- **Đưa ra các phương án gợi ý (Trade-off Analysis)**: Với mỗi câu hỏi phức tạp, nêu rõ 2-3 hướng tiếp cận kèm ưu/nhược điểm để người dùng cân nhắc.
- **Không ngừng cho đến khi Clear**: Chỉ dừng phỏng vấn và chuyển sang viết bản Thiết kế/Đặc tả (Specification) khi người dùng đã trả lời đầy đủ và không còn điểm mâu thuẫn.
