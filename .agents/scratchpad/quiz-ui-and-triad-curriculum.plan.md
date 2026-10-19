# Kế Hoạch Triển Khai: Tối Ưu Giao Diện Quiz Dạng Danh Sách & Tinh Gọn 3 Khóa Học Đại Diện

> **Yêu cầu người dùng**:
> 1. **Task 1 (Format Quiz & Khóa học đại diện)**:
>    - Trình bày tất cả câu hỏi Quizlet với 4 options ngay bên dưới để chọn luôn, thay vì lật từng flashcard.
>    - Giữ lại đúng **3 khóa học đại diện** cho Tam Giác Học Tập: **SQL**, **Quiz**, và **Automation Test**.
> 2. **Task 2 (Tách biệt UI Quizlet khỏi Coding Layout)**:
>    - Phần Quiz không format theo giao diện coding: Không có thanh chia 2 cột LeetCode, không có tab `Instructions` (introduction), không có tab `Solution (PRO)`, không có Monaco editor.
>    - Thiết kế giao diện Quiz Canvas chuyên nghiệp: Danh sách toàn bộ câu hỏi căn giữa, chọn trực tiếp các option, nút Nộp bài (Submit) kèm chấm điểm và giải thích sau khi nộp.
>
> **Tuân thủ giao thức**:
> - Plan-and-Execute Pattern (`.agents/skills/plan-and-execute/SKILL.md`)
> - Human Confirmation Gate (`AGENTS.md`): Dừng lại chờ lệnh xác nhận trực tiếp trước khi chạy code.

---

## 1. Thiết Kế Chi Tiết Giao Diện Quiz (Dedicated Quiz Canvas Wireframe)

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  [Logo] StudyWeb  /  Khóa Học  /  Lộ Trình Trắc Nghiệm      [ 20m ⏱️ ] [User]   │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│                        📘 KIỂM THỬ PHẦN MỀM & QA CONCEPTS                        │
│             Mục tiêu: Đánh giá tư duy thiết kế test case & phân loại bug         │
│               Tiến độ: [████████████░░░░░░░░] 3 / 5 câu đã trả lời              │
│                                                                                  │
│   ┌──────────────────────────────────────────────────────────────────────────┐   │
│   │ Câu 1: Đâu là mục tiêu quan trọng nhất của việc viết Test Case?           │   │
│   │                                                                          │   │
│   │  (A) Chứng minh rằng phần mềm hoàn toàn không có bất kỳ lỗi nào          │   │
│   │  [B] Phát hiện lỗi tiềm ẩn và xác minh phần mềm đáp ứng đúng yêu cầu   ✓ │   │
│   │  (C) Tăng dung lượng code và kéo dài thời gian phát triển dự án          │   │
│   │  (D) Thay thế hoàn toàn vai trò của lập trình viên trong dự án           │   │
│   │                                                                          │   │
│   │  💡 Giải thích: Test case giúp định hướng kiểm thử, phát hiện lỗi sớm    │   │
│   │     và đối soát với tài liệu đặc tả nghiệp vụ (SRS).                     │   │
│   └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│   ┌──────────────────────────────────────────────────────────────────────────┐   │
│   │ Câu 2: Khi phát hiện lỗi sập server (500) khi đặt hàng, độ nghiêm trọng? │   │
│   │                                                                          │   │
│   │  [A] Critical (Nghiêm trọng - chặn luồng nghiệp vụ chính)              ✓ │   │
│   │  (B) Major (Quan trọng - có luồng thay thế)                              │   │
│   │  (C) Minor (Lỗi nhỏ - giao diện hiển thị lệch)                           │   │
│   │  (D) Trivial (Lỗi chính tả văn bản)                                      │   │
│   └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│   ┌──────────────────────────────────────────────────────────────────────────┐   │
│   │ Câu 3: Phương pháp kiểm thử Boundary Value Analysis (BVA) tập trung vào? │   │
│   │                                                                          │   │
│   │  (A) Các giá trị ngẫu nhiên ở giữa khoảng hợp lệ                         │   │
│   │  [B] Các giá trị tại biên và lân cận biên (ví dụ: min-1, min, max, max+1)│   │
│   │  (C) Chỉ các giá trị chuỗi ký tự đặc biệt                                │   │
│   │  (D) Tốc độ phản hồi của cơ sở dữ liệu                                   │   │
│   └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│              ┌────────────────────────────────────────────────┐                  │
│              │      [ Gửi Bài Trắc Nghiệm / Submit Quiz ]     │                  │
│              └────────────────────────────────────────────────┘                  │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Kế Hoạch Triển Khai Tuần Tự (Two-Tier Task Decomposition)

### Task 1: Tinh Gọn 3 Khóa Học Đại Diện & Seed Data Chuẩn (`MODULE_BE`)
- [ ] **Subtask 1.1**: Chuẩn hóa 3 khóa học duy nhất ở trạng thái `isActive: true` trong `MODULE_BE/prisma/seed.ts`:
  1. **Khóa SQL**: `sql-query-fundamentals` (Title: *SQL Query Fundamentals*, Category: `database`, gồm 10 bài lab thực hành truy vấn chuẩn hóa).
  2. **Khóa Quiz**: `testing-co-ban` (Title: *Kiểm Thử Phần Mềm & QA Concepts Quiz*, Category: `testing`, chuyển các bài lab sang `sandboxType: 'quizlet'` với danh sách câu hỏi 4 options A, B, C, D rõ ràng).
  3. **Khóa Automation Test**: `api-automation-testing-low-code` (Title: *API Automation Testing Low-Code*, Category: `testing`, các bài lab điền code `js_worker` với scaffold `/* TODO: ... */`).
- [ ] **Subtask 1.2**: Đặt `isActive: false` cho tất cả các series còn lại (`nestjs-backend-architecture`, `docker-container-devops`, `sql-database-fundamentals`) để giao diện chỉ hiển thị đúng 3 khóa học.
- [ ] **Subtask 1.3**: Làm sạch dữ liệu rác cũ `w3schools-sql-*` trong PostgreSQL và chạy seed: `npx tsx prisma/seed.ts`.
  - *Verify Gate*: Query DB kiểm tra chỉ có đúng 3 series `isActive: true`.

### Task 2: Thiết Kế Lại Giao Diện Quizlet Độc Quyền Trên Frontend (`MODULE_FE`)
- [ ] **Subtask 2.1**: Tái cấu trúc layout [LabWorkspacePage.tsx](file:///d:/Projects/study-web/MODULE_FE/src/pages/lab/LabWorkspacePage.tsx) khi `isQuizletMode === true`:
  - Ẩn hoàn toàn cột bên trái (Không render `<aside>` chứa tab Instructions, Solution (PRO), Submissions).
  - Không render thanh Monaco code editor, không hiển thị nút Run kiểu coding.
  - Sử dụng layout Single-Column Canvas căn giữa (`max-w-3xl mx-auto py-8`), tối ưu đọc và tương tác.
- [ ] **Subtask 2.2**: Trình bày toàn bộ danh sách câu hỏi với 4 option ngay bên dưới:
  - Thay thế cơ chế Flashcard (từng câu một) bằng danh sách toàn bộ câu hỏi dạng thẻ thanh lịch (Clean Cards).
  - Mỗi câu hỏi hiển thị đầy đủ câu hỏi, badge số thứ tự, và 4 options A, B, C, D có thể chọn trực tiếp.
  - Thanh trạng thái tiến độ đếm số câu đã chọn (ví dụ: `Đã chọn 3/4 câu`).
- [ ] **Subtask 2.3**: Xây dựng nút Submit Quiz & Logic Chấm Điểm Trực Quan:
  - Nút "Submit Quiz" ở cuối danh sách (kèm nút trên Top Bar đồng bộ).
  - Sau khi Submit: Hiển thị kết quả điểm số (ví dụ: `Chính xác 3/3 câu`), tô màu trạng thái đúng (xanh lá) / sai (đỏ), mở rộng phần Giải Thích (Explanation) chi tiết.
  - Tích hợp gọi mutation nộp bài ghi nhận tiến độ học viên vào CSDL.
  - *Verify Gate*: Chuyển đổi giữa lab SQL, lab Quiz và lab Auto Test: layout thay đổi tương ứng mượt mà, không lỗi React Hook/State.

### Task 3: Đồng Bộ Catalog Hub & Hiển Thị 3 Khóa Học (`MODULE_FE` & `MODULE_ADMIN`)
- [ ] **Subtask 3.1**: Kiểm tra trang danh mục [SeriesHubPage.tsx](file:///d:/Projects/study-web/MODULE_FE/src/pages/lab/SeriesHubPage.tsx) và [HomePage.tsx](file:///d:/Projects/study-web/MODULE_FE/src/pages/HomePage.tsx):
  - Hiển thị nổi bật 3 thẻ khóa học đại diện: 🔵 SQL Query, 🟣 Testing Quiz, 🟢 API Auto Test.
  - Các bộ lọc Tabs (All, SQL, Quiz, Auto Test) lọc chính xác 3 khóa học.
- [ ] **Subtask 3.2**: Chạy kiểm tra build 3 module:
  - `npm --prefix MODULE_BE run build` (0 errors)
  - `npm --prefix MODULE_FE run build` (0 errors)
  - `npm --prefix MODULE_ADMIN run build` (0 errors)

---

## 3. Cổng Xác Nhận Người Dùng (Human Confirmation Gate)
🛑 **DỪNG LẠI HOÀN TOÀN TẠI ĐÂY (HALT TOOL EXECUTION)**:
Kế hoạch chi tiết theo chuẩn Plan-and-Execute đã được ghi nhận. Vui lòng xác nhận để bắt đầu triển khai Phase 2: Executor!
