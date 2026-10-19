# Quy Chuẩn Thiết Kế Sư Phạm & Soạn Bài Học / Blog Series
*(Pedagogical Guidelines & Content Authoring Standards for study-web)*

> **Tài liệu**: `DOC-CURRICULUM-03`  
> **Phiên bản**: 1.0  
> **Trạng thái**: Chuẩn hóa (Approved)  
> **Mục đích**: Hướng dẫn Tác giả (Author/Contributor) soạn bài học chuẩn sư phạm, tương tác cao và cuốn hút người học.

---

## 1. Triết Lý Sư Phạm Cốt Lõi (Core Pedagogy)

Nền tảng `study-web` được xây dựng dựa trên 3 trụ cột khoa học học tập (Learning Science):
1. **Cognitive Load Theory (Thuyết Giảm Tải Nhận Thức)**:
   - Không nhồi nhét quá nhiều kiến thức mới vào một bài học.
   - Mỗi lab chỉ giải quyết **1 vấn đề cốt lõi** trong thời lượng từ **10 đến 25 phút**.
2. **Active Learning & Immediate Feedback (Học qua Hành động & Phản hồi Tức thì)**:
   - Học viên không tiếp thu thụ động qua việc chỉ đọc chữ. Mọi bài học đều có Sandbox tương tác (gõ SQL thật, viết test thật, làm quiz có đối chiếu logic).
3. **Scaffolding (Dựng Giàn Giáo Năng Lực)**:
   - Giảm bớt các rào cản vụn vặt (boilerplate code, config lằng nhằng) để học viên tập trung 100% vào cú pháp và tư duy mục tiêu.

---

## 2. Công Thức 5 Bước Của Một Bài Lab / Blog Chuẩn (The 5-Phase Formula)

Mỗi file bài học Markdown phải được cấu trúc theo 5 phần mạch lạc:

```markdown
# [Tên Bài Học]: [Hành Động Cụ Thể Cần Đạt Được]

### 1. Đặt Vấn Đề (The Hook & Real-world Problem)
- Nêu tình huống thực tế thường gặp trong dự án doanh nghiệp.
- Chỉ ra hậu quả nếu làm sai (Ví dụ: "Hệ thống bị chậm 10 lần do thiếu Index", "API trả về token rỗng khiến App crash").

### 2. Khái Niệm Cốt Lõi & Trực Quan Hóa (Core Concept & Visuals)
- Giải thích bản chất bằng ngôn ngữ dễ hiểu, súc tích.
- Bắt buộc có bảng so sánh cú pháp hoặc sơ đồ Mermaid luồng dữ liệu.

### 3. Không Gian Thực Hành Tương Tác (Scaffolded Interactive Workspace)
- Sử dụng các khối Directive của SPEC-LAB-MD-V1 (:::starter, :::tests, :::schema, :::quiz...).
- Cung cấp hướng dẫn từng bước rõ ràng (Step-by-step guidance).

### 4. Cạm Bẫy Phổ Biến & Kinh Nghiệm Thực Chiến (Common Pitfalls & Senior Tips)
- Nêu 2-3 sai lầm mà fresher / junior hay mắc phải.
- Chia sẻ kinh nghiệm thực tế (Ví dụ: "Đừng bao giờ dùng SELECT * trong production").

### 5. Tóm Tắt & Thử Thách Mở Rộng (Recap & Next Step)
- 3 gạch đầu dòng ghi nhớ nhanh.
- Câu hỏi hoặc gợi mở dẫn dắt sang bài học tiếp theo trong series.
```

---

## 3. Quy Chuẩn Soạn Câu Hỏi Trắc Nghiệm (Quizel Standards)

Khi tạo khối `:::quiz`, tác giả phải tuân thủ nghiêm ngặt các quy tắc sau:

1. **Nguyên tắc Đặt câu hỏi (Stem Clarity)**:
   - Câu hỏi phải rõ ràng, ngắn gọn, có bối cảnh tình huống thực tế (Scenario-based).
   - Tuyệt đối không dùng câu phủ định kép gây bối rối (Ví dụ: tránh "Phương án nào sau đây không phải là không đúng?").
2. **Nguyên tắc Xây dựng Phương án Gây nhiễu (Distractors)**:
   - Các phương án sai phải là **những hiểu lầm phổ biến trong thực tế** của người mới học, không đặt phương án vô nghĩa hoặc buồn cười.
   - Độ dài và văn phong của 4 phương án phải tương đương nhau để tránh học viên đoán mò theo phương án dài nhất.
3. **Trường `explanation` và `hint` (Bắt Buộc)**:
   - **`hint`**: Gợi ý tư duy mở, hướng sự chú ý của học viên vào từ khóa then chốt mà không làm lộ đáp án.
   - **`explanation`**: Giải thích sâu tại sao đáp án đúng lại chính xác, VÀ nêu lý do vì sao từng phương án còn lại chưa đúng.

---

## 4. Quy Chuẩn Soạn Bài Thực Hành Automation Test Syntax

Khi tạo bài thực hành viết test tự động:

1. **Quy tắc Đặt tên Test Case**:
   - Sử dụng cú pháp BDD rõ nghĩa: `test("Xác thực hàm X trả về Y khi truyền tham số Z", () => { ... })`.
2. **Thiết kế Khối `:::starter`**:
   - Để sẵn khung khai báo bài bản, chỉ để lại các vị trí cần học viên điền cú pháp với chú thích `// TODO: ...`.
   - Giúp học viên tập trung vào Matcher (`toBe`, `toEqual`, `toContain`) thay vì mất thời gian gõ lại mock data.
3. **Thiết kế Khối `:::tests`**:
   - Kịch bản kiểm thử phải bao quát được ca đúng (Happy path), ca biên (Boundary/Corner cases) và ca sai dữ liệu.
   - Thông báo lỗi khi fail phải có thông điệp hướng dẫn sửa (Diagnostic messages) thân thiện.

---

## 5. Quy Chuẩn Soạn Bài Thực Hành SQL In-Browser

1. **Thiết kế Schema & Seed Data**:
   - Đặt tên bảng dạng số nhiều (`customers`, `orders`) hoặc chuẩn Postgres. Tên cột viết kiểu `snake_case`.
   - Cung cấp ít nhất 5 bản ghi mẫu đa dạng (có bản ghi thỏa mãn và bản ghi không thỏa mãn điều kiện) để học viên thấy rõ hiệu quả của mệnh đề `WHERE` hoặc `JOIN`.
2. **Kết quả Kỳ Vọng (`:::expected`)**:
   - Luôn cung cấp đúng tập mảng JSON kết quả mong đợi.
   - Cột nào cần hiển thị phải ghi rõ trong đề bài để tránh lỗi lệch thứ tự hoặc lệch tên cột bí danh (`AS`).
