# Bộ 8 Bài Kiểm Thử Tình Huống Thực Tế — Testing Theory Quizel V3 (40 Câu Hỏi)
*(ISTQB CTFL v4.0.1 & OWASP WSTG Scenario-Driven Certification Bank)*

> **Mã chương trình**: `CURRICULUM-QUIZ-V3`
> **Động cơ thực thi**: In-Browser Quizlet (Interactive scenario cards, hint drawer, explanation analysis)
> **Nguyên tắc**: 8 bài, mỗi bài 5 câu = 40 câu hỏi tình huống mới hoàn toàn; không sao chép nguyên văn sample exam ISTQB; mỗi câu có 4 phương án gây nhiễu hợp lý; giải thích chi tiết đúng/sai; đạt từ **80% (4/5 câu)** để hoàn thành bài.

---

## 1. Quiz 01: Bảy Nguyên Lý Kiểm Thử Trong Release Có Deadline (`quiz-v3-01-seven-testing-principles`)
*Free Preview • 5 câu tình huống*

### Câu 1.1: Release gấp và câu hỏi "Đã hết lỗi chưa?"
- **Tình huống**: Nhóm phát triển đang chuẩn bị release tính năng chuyển tiền nhanh trước 17h. Giám đốc dự án hỏi QA Lead: *"Các bạn đã chạy hơn 200 test case và tất cả đều pass. Chúng ta có thể chắc chắn 100% phần mềm không còn lỗi nào không?"*. Theo nguyên lý kiểm thử ISTQB, câu trả lời chuẩn xác nhất của QA là gì?
- **Phương án**:
  - A. Đúng, nếu toàn bộ 200 test case pass thì hệ thống hoàn toàn sạch lỗi (Zero defect).
  - B. Không, vì kiểm thử chỉ chứng minh sự hiện diện của lỗi, chứ không thể chứng minh phần mềm không có lỗi (Testing shows presence of defects, not their absence).
  - C. Đúng, nhưng chỉ khi kiểm thử tự động đạt độ bao phủ code 100%.
  - D. Không, phần mềm chỉ hết lỗi sau khi khách hàng sử dụng thực tế 30 ngày.
- **Đáp án đúng**: B (index 1)
- **Gợi ý**: Hãy nhớ nguyên lý cơ bản số 1 của ISTQB về mục đích thực sự của việc chạy test case.
- **Giải thích**:
  - *Đáp án B đúng*: Theo Nguyên lý 1 của ISTQB, testing chỉ giúp giảm xác suất lỗi còn sót lại trong sản phẩm; không một lượng kiểm thử nào có thể chứng minh sản phẩm 100% không còn lỗi.
  - *Đáp án A và C sai*: Ngay cả khi 100% test case pass hoặc code coverage 100%, vẫn có thể có những trường hợp kiểm thử chưa được nghĩ ra, lỗi môi trường, hoặc hiểu sai yêu cầu nghiệp vụ.
  - *Đáp án D sai*: Thời gian 30 ngày là con số tùy tiện, không phải nguyên lý kiểm thử.

### Câu 1.2: Áp lực kiểm thử toàn bộ khả năng (Exhaustive Testing)
- **Tình huống**: Một form thanh toán có 5 trường nhập liệu (Số thẻ, Tên, Ngày hết hạn, CVV, Mã OTP). Một Tester mới đề xuất kiểm tra mọi tổ hợp giá trị có thể nhập vào 5 trường này để đảm bảo không bỏ sót bất kỳ tình huống nào. Phản hồi hợp lý nhất từ Senior QA là gì?
- **Phương án**:
  - A. Hoan nghênh đề xuất vì kiểm thử toàn bộ (Exhaustive testing) là tiêu chuẩn bắt buộc của ISTQB.
  - B. Bác bỏ vì kiểm thử cạn kiệt toàn bộ mọi tổ hợp là bất khả thi; cần sử dụng phân tích rủi ro và các kỹ thuật thiết kế test case để ưu tiên.
  - C. Chỉ chạy kiểm thử cạn kiệt trên môi trường Staging, không chạy trên môi trường Development.
  - D. Thay thế bằng kiểm thử tự động Playwright vì máy tính có thể chạy hết mọi tổ hợp trong vài giây.
- **Đáp án đúng**: B (index 1)
- **Gợi ý**: Xem xét số lượng tổ hợp của 16 chữ số thẻ kết hợp với ngày, CVV và OTP là bao nhiêu khả năng.
- **Giải thích**:
  - *Đáp án B đúng*: Theo Nguyên lý 2 (Exhaustive testing is impossible), trừ các hệ thống cực kỳ đơn giản, việc kiểm tra mọi tổ hợp dữ liệu và tiền điều kiện là không khả thi về thời gian và chi phí. Cần dùng kỹ thuật phân tích rủi ro (Risk-based testing) và kỹ thuật phân vùng tương đương để chọn mẫu thử đại diện.
  - *Đáp án A, C, D sai*: Không máy tính nào có thể chạy hết hàng nghìn tỷ tỷ tổ hợp dữ liệu trong thời gian hữu hạn.

### Câu 1.3: Hiện tượng lờn thuốc kiểm thử (Pesticide Paradox)
- **Tình huống**: Trong suốt 6 sprint liên tiếp, đội QA lặp đi lặp lại cùng một bộ 50 kịch bản kiểm thử hồi quy (Regression Test Suite) mà không thay đổi. Số lượng lỗi mới phát hiện được giảm dần về 0, nhưng khi lên Production khách hàng vẫn liên tục báo lỗi mới. Hiện tượng này phản ánh nguyên lý nào?
- **Phương án**:
  - A. Lỗi tiềm ẩn (Defect Clustering).
  - B. Nghịch lý thuốc trừ sâu (Pesticide Paradox) — nếu lặp lại cùng một bộ test, chúng sẽ không còn tìm thêm được lỗi mới.
  - C. Ảo tưởng về sự vắng bóng của lỗi (Absence-of-errors fallacy).
  - D. Kiểm thử sớm (Early Testing).
- **Đáp án đúng**: B (index 1)
- **Gợi ý**: Tương tự như côn trùng kháng thuốc trừ sâu sau nhiều lần phun cùng một loại thuốc.
- **Giải thích**:
  - *Đáp án B đúng*: Theo Nguyên lý 5 (Pesticide Paradox), các test case cũ cần được rà soát định kỳ, viết mới hoặc bổ sung kịch bản khác nhau để tìm ra các lỗi mới trong các phần code vừa được sửa đổi.
  - *Đáp án A, C, D sai*: Defect clustering nói về lỗi tập trung ở một số module; Absence-of-errors nói về việc làm đúng yêu cầu nhưng sai nhu cầu người dùng.

### Câu 1.4: Tập trung lỗi cục bộ (Defect Clustering)
- **Tình huống**: Báo cáo thống kê sau 3 tháng của dự án chỉ ra rằng 80% số lỗi nghiêm trọng (Critical Bugs) chỉ xuất hiện trong 2 module: Module Tính Khuyến Mãi (Promotion Engine) và Module Tích Hợp Cổng Thanh Toán (Payment Gateway). Nguyên lý nào giải thích điều này và QA nên làm gì?
- **Phương án**:
  - A. Nguyên lý Defect Clustering; QA nên tập trung nguồn lực kiểm thử sâu hơn vào các module phức tạp và có mật độ lỗi cao này.
  - B. Nguyên lý Early Testing; QA nên dừng kiểm thử hai module này và chuyển sang các module khác.
  - C. Nguyên lý Context Dependent; QA cần đổi công cụ kiểm thử sang Cypress.
  - D. Nguyên lý Exhaustive Testing; QA phải kiểm thử 100% mọi dòng code của cả dự án.
- **Đáp án đúng**: A (index 0)
- **Gợi ý**: Quy luật Pareto 80/20 trong phân bố lỗi phần mềm.
- **Giải thích**:
  - *Đáp án A đúng*: Theo Nguyên lý 4 (Defect Clustering), một tỷ lệ nhỏ các module thường chứa phần lớn các lỗi phát sinh do độ phức tạp logic, sự phụ thuộc công nghệ hoặc biến động nhân sự.

### Câu 1.5: Ảo tưởng về sự vắng mặt của lỗi (Absence-of-errors Fallacy)
- **Tình huống**: Một ứng dụng quản lý kho được bàn giao đúng hạn, pass 100% tất cả các tiêu chí trong bản đặc tả kỹ thuật (SRS) và không có lỗi crash nào. Tuy nhiên khi đưa vào vận hành thực tế tại kho hàng, công nhân kho từ chối sử dụng vì thao tác quét mã vạch mất quá nhiều bước so với quy trình cũ. Tình huống này là ví dụ điển hình của nguyên lý nào?
- **Phương án**:
  - A. Testing shows presence of defects.
  - B. Early Testing saves time and money.
  - C. Absence-of-errors fallacy (Ảo tưởng không có lỗi không đồng nghĩa với phần mềm hữu ích và đáp ứng đúng nhu cầu người dùng).
  - D. Testing is context dependent.
- **Đáp án đúng**: C (index 2)
- **Gợi ý**: Một phần mềm không có bug kỹ thuật nhưng người dùng không dùng được thì có được xem là thành công không?
- **Giải thích**:
  - *Đáp án C đúng*: Theo Nguyên lý 7 (Absence-of-errors fallacy), việc sửa hết lỗi và xây dựng đúng bản đặc tả kỹ thuật sẽ vô nghĩa nếu hệ thống không đáp ứng được nhu cầu và mục tiêu thực tế của người dùng cuối (Verification vs Validation).

---

## 2. Quiz 02: Review Requirement & Static Testing (`quiz-v3-02-static-testing-requirements-review`)
*Free Preview • 5 câu tình huống*

### Câu 2.1: Phát hiện sớm lỗi trong bản đặc tả SRS
- **Tình huống**: Trong bản User Story có câu: *"Hệ thống phải phản hồi nhanh chóng khi người dùng nhấn nút tìm kiếm"*. QA review tài liệu và yêu cầu Product Owner viết lại tiêu chí nghiệm thu (Acceptance Criteria). Lý do chính của QA là gì?
- **Phương án**:
  - A. Từ "nhanh chóng" là định tính, mơ hồ, không thể đo lường và không thể kiểm thử được (Non-testable requirement).
  - B. QA không được can thiệp vào tài liệu yêu cầu của Product Owner.
  - C. Tính năng tìm kiếm bắt buộc phải dùng Elasticsearch mới đạt chuẩn.
  - D. Vì kiểm thử tĩnh (Static testing) không áp dụng được cho User Story.
- **Đáp án đúng**: A (index 0)
- **Gợi ý**: Yêu cầu kiểm thử được phải có con số cụ thể, ví dụ: phản hồi dưới 2 giây với 1000 người dùng đồng thời.
- **Giải thích**:
  - *Đáp án A đúng*: Một trong những nhiệm vụ cốt lõi của kiểm thử tĩnh (Review tài liệu) là phát hiện các yêu cầu mơ hồ, thiếu số liệu định lượng (như "nhanh", "đẹp", "dễ dùng") để chuyển thành tiêu chí đo lường cụ thể có thể viết test case được.

### Câu 2.2: Phân biệt Kiểm thử Tĩnh (Static) và Kiểm thử Động (Dynamic)
- **Tình huống**: Hoạt động nào sau đây thuộc về Kiểm thử Tĩnh (Static Testing)?
- **Phương án**:
  - A. Chạy test script Playwright trên trình duyệt Chrome.
  - B. Đăng nhập vào hệ thống và kiểm tra xem token JWT có được lưu vào cookie hay không.
  - C. Thực hiện Peer Review mã nguồn (Code Review) và rà soát tài liệu kiến trúc phần mềm mà không cần thực thi code.
  - D. Bắn tải 10,000 requests vào API bằng công cụ k6 để đo Response Time.
- **Đáp án đúng**: C (index 2)
- **Gợi ý**: Điểm khác biệt mấu chốt giữa Static và Dynamic là có "chạy code" (execute code) hay không.
- **Giải thích**:
  - *Đáp án C đúng*: Static Testing bao gồm việc đọc duyệt tài liệu, walkthrough, inspection, và static code analysis (SonarQube/Linter) mà không cần chạy chương trình. Các phương án A, B, D đều phải thực thi phần mềm (Dynamic Testing).

### Câu 2.3: Vai trò Moderator trong buổi Formal Review
- **Tình huống**: Trong một buổi Formal Inspection tài liệu thiết kế database, ai là người chịu trách nhiệm điều phối cuộc họp, quản lý thời gian, và đảm bảo mọi thành viên đều có cơ hội đóng góp ý kiến?
- **Phương án**:
  - A. Tác giả tài liệu (Author).
  - B. Người điều phối (Moderator / Facilitator).
  - C. Quản lý dự án (Project Manager).
  - D. Người ghi chép biên bản (Scribe / Recorder).
- **Đáp án đúng**: B (index 1)
- **Gợi ý**: Xem các vai trò chuẩn trong quy trình review của ISTQB Chapter 3.
- **Giải thích**:
  - *Đáp án B đúng*: Moderator là người chủ trì buổi review, đảm bảo tuân thủ agenda và giải quyết các xung đột thảo luận. Scribe ghi nhận lỗi; Author giải trình; Manager cấp ngân sách.

### Câu 2.4: Lợi ích kinh tế của Shift-Left Testing
- **Tình huống**: Tại sao việc phát hiện lỗi ở giai đoạn Review Yêu Cầu (Requirements Phase) lại giúp dự án tiết kiệm chi phí gấp hàng chục lần so với phát hiện lỗi ở giai đoạn Kiểm thử Hệ thống (System Testing) hoặc Production?
- **Phương án**:
  - A. Vì sửa một dòng chữ trong tài liệu tốn ít chi phí hơn rất nhiều so với việc phải code lại, sửa database và test lại toàn bộ hệ thống.
  - B. Vì Tester không cần trả lương khi làm kiểm thử tài liệu.
  - C. Vì developer không bao giờ mắc lỗi nếu tài liệu được viết chi tiết.
  - D. Vì Product Owner sẽ chịu toàn bộ chi phí sửa lỗi nếu bị phát hiện sớm.
- **Đáp án đúng**: A (index 0)
- **Gợi ý**: Hãy xem xét đường cong chi phí sửa lỗi (Cost of Quality curve).
- **Giải thích**:
  - *Đáp án A đúng*: Lỗi yêu cầu nếu lọt qua giai đoạn code sẽ dẫn đến sai thiết kế, sai kiến trúc dữ liệu và sai hàng nghìn dòng code. Khi phát hiện muộn ở Production, chi phí rework, hotfix và bồi thường khách hàng tăng theo cấp số nhân.

### Câu 2.5: Checklist trong Review tài liệu
- **Tình huống**: Khi nhận tài liệu API Specification để review tĩnh, checklist nào sau đây là quan trọng nhất đối với một QA Engineer?
- **Phương án**:
  - A. Font chữ của file Word có phải là Times New Roman 13 hay không.
  - B. Các mã phản hồi lỗi (400, 401, 403, 404, 422, 500) và cấu trúc payload lỗi có được định nghĩa rõ ràng cho từng endpoint không.
  - C. Tên của lập trình viên backend có được ghi ở trang bìa không.
  - D. Số lượng trang của tài liệu có vượt quá 50 trang không.
- **Đáp án đúng**: B (index 1)
- **Gợi ý**: Hãy chú ý đến tính hoàn chỉnh (completeness) của hợp đồng API (API Contract) cho cả luồng thành công và luồng thất bại.
- **Giải thích**:
  - *Đáp án B đúng*: Một tài liệu API chuẩn bắt buộc phải nêu rõ định dạng request/response cho cả Happy Path lẫn Unhappy Path để QA thiết kế bộ test case bao phủ toàn diện.

---

*(Tiếp tục bổ sung các Quiz 03 đến Quiz 08 tương tự với đầy đủ 5 câu tình huống thực tế cho mỗi bài)*
