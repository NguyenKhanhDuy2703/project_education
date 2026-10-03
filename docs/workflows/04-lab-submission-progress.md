---
doc_type: workflow
title: Sơ đồ Luồng Nộp Bài Lab & Ghi nhận Tiến độ (Submission & Progress Tracking)
project: study-web
version: "1.0"
version_source: codebase
authors:
  - {name: Nguyen Khanh Duy, alias: Duy, role: Fullstack Lead & Architect}
scope: Phân hệ Lưu vết bài nộp học viên và Tự động tính toán tiến độ học tập O(1)
date: 2026-10-02
source_file: "MODULE_BE/src/modules, MODULE_FE/src/pages/dashboard"
status: final
language: vi
related_docs: [../01-proposal.md, ../05-database.md]
---

# Sơ đồ Luồng Nộp Bài Lab & Ghi nhận Tiến độ (Submission & Progress Tracking)

## 1. Thông tin tài liệu (Document Information)

| Thuộc tính | Chi tiết |
|---|---|
| **Tên tài liệu** | Sơ đồ Luồng Nộp Bài Lab & Ghi nhận Tiến độ |
| **Version** | v1.0 |
| **Người làm** | Nguyen Khanh Duy (Fullstack Lead & Architect) |
| **Phạm vi (Scope)** | Luồng gửi kết quả bài làm lên server, lưu lịch sử nộp bài, cập nhật bản ghi trạng thái hoàn thành và đồng bộ Dashboard |
| **Thời gian** | 2026-10-02 |
| **Tham chiếu từ** | Thiết kế CSDL tinh gọn tại `Docs/05-database.md` (2 bảng `lab_submissions` và `user_progress`) |

---

## 2. Nội dung chính (Content)

### 2.1. Sơ đồ Tuần tự (Sequence Diagram)

```mermaid
sequenceDiagram
    autonumber
    actor User as Học viên
    participant FE as Lab Workspace
    participant BE as Backend Lab Service
    participant DB as Database (Postgres)
    participant Dash as Dashboard Cá Nhân

    User->>FE: Bấm nút Nộp bài
    FE->>BE: POST /api/labs/:id/submit (submittedCode, status, timeMs)
    BE->>BE: Xác thực JWT trích xuất userId
    
    Note over BE, DB: Bước 1: Luôn lưu lịch sử nộp bài vào lab_submissions
    BE->>DB: INSERT INTO lab_submissions
    DB-->>BE: Lưu bản ghi thành công

    Note over BE, DB: Bước 2: Cập nhật tiến độ vào user_progress
    alt Bài làm đạt yêu cầu (status: passed)
        BE->>DB: UPSERT INTO user_progress (isCompleted = true)
        DB-->>BE: Cập nhật tiến độ thành công
        BE-->>FE: 200 OK (Hoàn thành bài lab xuất sắc)
        FE-->>User: Hiển thị chúc mừng và mở bài tiếp theo
    else Bài làm chưa đạt (status: failed)
        BE-->>FE: 200 OK (Đã lưu bài làm, gợi ý thử lại)
        FE-->>User: Hiển thị thông báo lưu bài làm để sửa tiếp
    end

    Note over User, Dash: Bước 3: Đồng bộ hiển thị trên Dashboard
    User->>Dash: Mở trang Dashboard cá nhân
    Dash->>BE: GET /api/users/me/dashboard-stats
    BE->>DB: Đếm số bài lab hoàn thành từ user_progress
    DB-->>BE: Trả về số bài đã xong
    BE-->>Dash: 200 OK (totalCompleted, streakDays, seriesProgress)
    Dash-->>User: Render thanh tiến độ phần trăm và huy hiệu
```

### 2.2. Phân tích Kỹ thuật Chi tiết

1. **Chiến lược Phân tách Dữ liệu (Dual-table Strategy)**:
   * **`lab_submissions` (Lưu vết không giới hạn)**: Mỗi lần học viên bấm Nộp bài đều sinh 1 dòng mới. Phục vụ việc xem lại lịch sử code cũ, đối chiếu quá trình tiến bộ của học viên.
   * **`user_progress` (Trạng thái đơn nhất)**: Chỉ có duy nhất 1 dòng cho mỗi cặp `(userId, labId)`. Dùng cú pháp `ON CONFLICT (userId, labId) DO UPDATE` (PostgreSQL Upsert).
   * 👉 **Lợi ích**: Khi người dùng vào trang Dashboard, câu lệnh đếm bài hoàn thành chỉ cần quét trên bảng `user_progress` cực kỳ nhỏ gọn, không phải `GROUP BY` hay `DISTINCT` trên bảng `lab_submissions` chứa hàng triệu dòng log.

2. **Bảo mật Điểm số & Trạng thái**:
   * Đối với các bài lab chạy Web Worker: Script test chạy ở client, nhưng Backend vẫn có thể thực hiện kiểm tra ngẫu nhiên (Sanity Check) cú pháp hoặc kiểm tra độ dài code trước khi ghi nhận trạng thái `passed`.
   * Học viên phải đăng nhập thì mới được ghi nhận tiến độ vào Database. Nếu là khách vãng lai (Guest), tiến độ được lưu tạm thời vào `localStorage` của trình duyệt.

---

## 3. Tài liệu tham khảo & Liên kết (References)

- **Mã nguồn liên quan**:
  - Trang Dashboard học viên: [MODULE_FE/src/pages/dashboard/DashboardPage.tsx](file:///d:/Projects/study-web/MODULE_FE/src/pages/dashboard/DashboardPage.tsx)
  - Khai báo 2 bảng CSDL: [MODULE_BE/prisma/schema.prisma](file:///d:/Projects/study-web/MODULE_BE/prisma/schema.prisma)
- **Tài liệu hệ thống**:
  - Thiết kế Cơ sở Dữ liệu: [05-database.md](file:///d:/Projects/study-web/Docs/05-database.md)
  - Luồng chạy Web Worker: [03-webworker-execution.md](file:///d:/Projects/study-web/Docs/workflows/03-webworker-execution.md)
