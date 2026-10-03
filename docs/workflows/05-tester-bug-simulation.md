---
doc_type: workflow
title: Sơ đồ Luồng Mô phỏng Mini-App Bắt Lỗi cho Tester (UI Bug Sandbox)
project: study-web
version: "1.0"
version_source: codebase
authors:
  - {name: Nguyen Khanh Duy, alias: Duy, role: Fullstack Lead & Architect}
scope: Phân hệ Không gian tương tác thực hành kiểm thử giao diện & Bắt lỗi app mẫu
date: 2026-10-02
source_file: "MODULE_FE/src"
status: final
language: vi
related_docs: [../01-proposal.md, ../05-database.md]
---

# Sơ đồ Luồng Mô phỏng Mini-App Bắt Lỗi cho Tester (UI Bug Sandbox)

## 1. Thông tin tài liệu (Document Information)

| Thuộc tính | Chi tiết |
|---|---|
| **Tên tài liệu** | Sơ đồ Luồng Mô phỏng Mini-App Bắt Lỗi cho Tester |
| **Version** | v1.0 |
| **Người làm** | Nguyen Khanh Duy (Fullstack Lead & Architect) |
| **Phạm vi (Scope)** | Cơ chế nhúng Mini-App sandbox có cấy sẵn lỗi có chủ đích, luồng học viên thao tác phát hiện lỗi và đối soát phiếu báo cáo lỗi (Bug Report) |
| **Thời gian** | 2026-10-02 |
| **Tham chiếu từ** | Nghiệp vụ đào tạo Tester thực chiến: học viên học bằng cách bắt lỗi trực tiếp trên giao diện thực tế |

---

## 2. Nội dung chính (Content)

### 2.1. Sơ đồ Tuần tự (Sequence Diagram)

```mermaid
sequenceDiagram
    autonumber
    actor Tester as Học viên Tester
    participant UI as Giao diện Web Study
    participant Sandbox as Mini-App Sandbox
    participant BE as Backend Lab Service
    participant DB as Database (Postgres)

    Note over Tester, Sandbox: Bước 1 - Mở bài lab thực hành Tester
    Tester->>UI: Mở bài lab Tìm lỗi ở Form Đặt Hàng
    UI->>BE: GET /api/labs/:id
    BE->>DB: Lấy dữ liệu bài lab và mockConfig
    DB-->>BE: Trả về đề bài và danh sách bug ẩn
    BE-->>UI: 200 OK (Đề bài Markdown và cấu hình sandbox)
    UI->>Sandbox: Render Mini-App Form Đặt Hàng có cấy sẵn lỗi

    Note over Tester, Sandbox: Bước 2 - Thao tác tìm lỗi trên ứng dụng mẫu
    Tester->>Sandbox: Nhập số lượng âm (-5) và bấm Thanh toán
    Sandbox->>Sandbox: Logic cấy lỗi cho phép đặt hàng với tiền âm
    Sandbox-->>Tester: Giao diện hiển thị Đặt hàng thành công với tiền âm
    
    Note over Tester, UI: Bước 3 - Điền phiếu báo cáo lỗi (Bug Report)
    Tester->>UI: Điền Bug Report (Tiêu đề, Bước tái hiện, Severity)
    Tester->>UI: Bấm nút Kiểm tra Bug Report
    UI->>BE: POST /api/labs/:id/verify-bug (targetField, bugType, severity)
    BE->>DB: Đối chiếu với mockConfig của bài lab
    
    alt Bắt đúng con bug ẩn trong hệ thống
        BE-->>UI: 200 OK (Chính xác, tìm được 1 lỗi)
        UI-->>Tester: Đánh dấu tích xanh trên thanh nhiệm vụ
    else Báo cáo chưa chính xác
        BE-->>UI: 200 OK (Chưa khớp, kèm gợi ý kiểm tra lại)
        UI-->>Tester: Hiển thị gợi ý để học viên thử lại
    end

    Note over Tester, UI: Bước 4 - Hoàn thành bài lab khi tìm đủ lỗi
    Tester->>UI: Bắt đủ các lỗi và bấm Hoàn thành bài Lab
    UI->>BE: POST /api/labs/:id/submit (status: passed)
    BE->>DB: Ghi nhận vào lab_submissions và user_progress
    BE-->>UI: 200 OK
    UI-->>Tester: Mở khóa đáp án chuẩn và test case mẫu
```

### 2.2. Phân tích Kỹ thuật Chi tiết

1. **Cơ chế Cấy lỗi (Bug Injection Architecture)**:
   * Ứng dụng mẫu không phải là code bị lỗi ngoài tầm kiểm soát. Nó là một **React component được thiết kế có chủ đích** với các tham số lỗi có thể bật/tắt (Feature Flags).
   * Ví dụ: prop `injectBugs={['ALLOW_NEGATIVE_QUANTITY', 'BYPASS_PHONE_VALIDATION']}`.

2. **Cách chấm điểm tự động cho Tester**:
   * Tester học viên không nộp code mà nộp **tư duy phân tích lỗi**.
   * Hệ thống chuẩn hóa form nộp thành các thuộc tính cấu trúc: Trường dữ liệu bị lỗi (`targetField`), Kiểu lỗi (`bugType`), Mức độ nghiêm trọng (`severity`).
   * Backend so sánh bộ ba này với danh sách cấu hình trong `mockConfig` để trả về phản hồi tức thì mà không cần người chấm thủ công.

---

## 3. Tài liệu tham khảo & Liên kết (References)

- **Mã nguồn liên quan**:
  - Giao diện Trang chủ Tester: [MODULE_FE/src/pages/HomePage.tsx](file:///d:/Projects/study-web/MODULE_FE/src/pages/HomePage.tsx)
  - Thiết kế Cơ sở Dữ liệu (bảng `labs`, cột `mockConfig`): [05-database.md](file:///d:/Projects/study-web/Docs/05-database.md)
- **Tài liệu hệ thống**:
  - Đề xuất Dự án: [01-proposal.md](file:///d:/Projects/study-web/Docs/01-proposal.md)
  - Luồng nộp bài & Cập nhật tiến độ: [04-lab-submission-progress.md](file:///d:/Projects/study-web/Docs/workflows/04-lab-submission-progress.md)
