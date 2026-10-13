---
doc_type: workflow
title: Sơ đồ Luồng Nộp Bài Lab & Ghi nhận Tiến độ (Submission & Progress Tracking)
project: study-web
version: "1.1"
version_source: codebase
authors:
  - {name: Nguyen Khanh Duy, alias: Duy, role: Fullstack Lead & Architect}
scope: Luồng nghiệp vụ người dùng (Workspace -> Do Lab -> Submit) và phân hệ lưu vết bài nộp, ghi nhận tiến độ
date: 2026-10-13
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
| **Version** | v1.1 |
| **Người làm** | Nguyen Khanh Duy (Fullstack Lead & Architect) |
| **Phạm vi (Scope)** | Chu trình nghiệp vụ làm bài (Workspace -> Do Lab -> Submit), lưu lịch sử nộp bài, ghi nhận trạng thái hoàn thành và đồng bộ Dashboard |
| **Thời gian** | 2026-10-13 |
| **Tham chiếu từ** | Thiết kế CSDL tinh gọn tại `docs/05-database.md` (2 bảng `lab_submissions` và `user_progress`) |

---

## 2. Nội dung chính (Content)

### 2.1. Sơ đồ Luồng Nghiệp vụ Người dùng (User Business Flow)

Sơ đồ thể hiện chu trình thao tác cốt lõi của người dùng trên giao diện khi thực hành bài lab: Mở Workspace $\to$ Làm bài (Do Lab) $\to$ Nộp bài (Submit):

```mermaid
flowchart TD
    Start([1. Mở Lab Workspace]) --> ViewWorkspace[User quan sát giao diện làm bài:]
    ViewWorkspace --> ReadPane[Cột trái: Đọc đề bài, mục tiêu & hướng dẫn từng bước]
    ViewWorkspace --> CodePane[Cột phải: Xem code mẫu ban đầu trên Editor]

    %% --- Giai đoạn 2: Do Lab (Thực hành & Chạy thử) ---
    CodePane --> TypingCode[2. Thực hành: User viết code giải quyết yêu cầu đề bài]
    TypingCode --> ClickRun[Bấm nút 'Chạy thử']
    ClickRun --> RunFeedback{Kết quả chạy thử trên màn hình}

    %% Vòng lặp sửa bài
    RunFeedback -->|Còn test case thất bại / Báo lỗi| ViewFailDetails[Xem chi tiết lỗi & test case chưa đạt]
    ViewFailDetails --> FixCode[User chỉnh sửa lại code trên Editor]
    FixCode --> ClickRun

    %% Vòng lặp thành công
    RunFeedback -->|Tất cả test case đều Vượt qua| PassState[Bảng kết quả báo xanh: 100% Passed]
    
    %% --- Giai đoạn 3: Nộp bài (Submit) ---
    PassState --> ClickSubmit[3. Bấm nút 'Nộp bài']
    ClickSubmit --> SubmitProcessing[Hệ thống ghi nhận bài nộp]
    SubmitProcessing --> ShowCompletionModal[Hiện thông báo: 'Hoàn thành bài Lab thành công!']
    ShowCompletionModal --> NextAction{User chọn hành động tiếp theo}
    NextAction -->|Bấm 'Bài tiếp theo'| GoNextLab([Mở bài Lab kế tiếp trong Series])
    NextAction -->|Bấm 'Xem lại bài'| StayReview([Ở lại màn hình xem lại code vừa làm])
```

#### Các điểm chạm (Touchpoints) của Người dùng trên Giao diện:
1. **Khám phá Workspace (Init)**:
   - Cột trái: Cung cấp đầy đủ đề bài, tiêu chí kiểm thử và hướng dẫn chi tiết.
   - Cột phải: Khung soạn thảo code (Monaco Editor) nạp sẵn Starter Code mẫu.
2. **Thực hành & Vòng lặp chạy thử (Do Lab)**:
   - Học viên viết code và chủ động bấm nút **"Chạy thử"** để chạy test nhanh trên Web Worker (không tốn chi phí server).
   - Nếu lỗi: Panel hiển thị rõ test case bị hỏng, input/output để học viên tự sửa tại chỗ.
   - Khi vượt qua 100% test: Giao diện chuyển trạng thái xanh và kích hoạt nút nộp bài.
3. **Nộp bài & Chuyển tiếp (Submit & Next Lab)**:
   - Bấm **"Nộp bài"**: Kết quả được lưu lên server, đồng bộ tiến độ học tập.
   - Giao diện hiển thị Modal vinh danh hoàn thành, cung cấp nút **"Bài tiếp theo"** giúp học viên tiếp tục lộ trình học tập liền mạch mà không bị đứt đoạn trải nghiệm.

### 2.2. Sơ đồ Luồng Nghiệp vụ Đặc quyền PRO: Xem Hướng dẫn Mẫu (Solution Guide Flow)

Đối với tài khoản **User PRO**, hệ thống mở khóa tính năng xem Hướng dẫn mẫu / Lời giải chi tiết (Solution Guide) ngay trong Workspace, trong khi tài khoản thường sẽ nhận popup giới thiệu nâng cấp:

```mermaid
flowchart TD
    Start([User đang làm bài trong Lab Workspace]) --> ClickSolutionBtn{User bấm nút 'Xem Hướng dẫn mẫu / Lời giải'}

    %% --- Phân nhánh theo loại tài khoản ---
    ClickSolutionBtn --> CheckTier{Kiểm tra gói tài khoản}

    %% --- Nhánh 1: User thường ---
    CheckTier -->|User thường - Chưa nâng cấp| ShowUpgradePrompt[Màn hình bật Popup: 'Mở khóa Hướng dẫn mẫu với gói PRO']
    ShowUpgradePrompt --> PromptAction{Thao tác của User thường}
    PromptAction -->|Bấm 'Xem gói PRO'| GoPricing[Chuyển sang trang Nâng cấp tài khoản]
    PromptAction -->|Bấm 'Đóng'| BackToWorkspace[Đóng popup -> Tiếp tục tự giải bài]

    %% --- Nhánh 2: User PRO (Đã upgrade) ---
    CheckTier -->|User PRO - Đã upgrade| OpenSolutionPane[Mở bảng 'Hướng dẫn mẫu & Lời giải chuẩn']
    
    OpenSolutionPane --> SolutionUI[User PRO xem trọn vẹn 3 nội dung:]
    SolutionUI --> Sec1[1. Code giải mẫu chuẩn - Clean Code & Best Practices]
    SolutionUI --> Sec2[2. Giải thích chi tiết từng bước: Tại sao làm như vậy?]
    SolutionUI --> Sec3[3. Nút 'Sao chép code mẫu' để thử nghiệm trực tiếp]

    Sec3 --> ProAction{User PRO thao tác tiếp}
    ProAction -->|Tự gõ lại hoặc paste vào Editor| RunTest[Bấm 'Chạy thử' kiểm tra]
    RunTest --> Submit[Bấm 'Nộp bài' hoàn thành]
```

#### Điểm chạm giao diện (UI Touchpoints) cho Hướng dẫn mẫu:
1. **Nút Hướng dẫn mẫu 💡**: Nằm trên thanh công cụ của Editor; User thường thấy nhãn `🔒 Pro`, User PRO thấy nhãn mở khóa `🔓`.
2. **Popup Paywall cho User thường**: Giới thiệu lợi ích giải pháp chuẩn, không làm mất code đang gõ dở nếu user bấm đóng.
3. **Bảng Lời giải cho User PRO**: Bố trí dạng thanh trượt bên phải (Side Drawer) hoặc Tab song song, hiển thị mã nguồn chuẩn, giải thích từng dòng và nút Copy nhanh.

### 2.3. Sơ đồ Tuần tự Kỹ thuật (Sequence Diagram)

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

### 2.4. Phân tích Kỹ thuật Chi tiết

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
