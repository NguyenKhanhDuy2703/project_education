---
doc_type: workflow
title: Sơ đồ Luồng Truy cập Bài Lab & Phân quyền Pro (RBAC Guard)
project: study-web
version: "1.1"
version_source: codebase
authors:
  - {name: Nguyen Khanh Duy, alias: Duy, role: Fullstack Lead & Architect}
scope: Luồng nghiệp vụ người dùng (Trang chủ -> Danh sách Lab -> Mở nội dung Lab) và phân hệ kiểm soát quyền truy cập RBAC
date: 2026-10-13
source_file: "MODULE_BE/src/common/guards/roles.guard.ts, MODULE_FE/src/routes"
status: final
language: vi
related_docs: [../01-proposal.md, ../05-database.md]
---

# Sơ đồ Luồng Truy cập Bài Lab & Phân quyền Pro (RBAC Guard)

## 1. Thông tin tài liệu (Document Information)

| Thuộc tính | Chi tiết |
|---|---|
| **Tên tài liệu** | Sơ đồ Luồng Truy cập Bài Lab & Phân quyền Pro |
| **Version** | v1.1 |
| **Người làm** | Nguyen Khanh Duy (Fullstack Lead & Architect) |
| **Phạm vi (Scope)** | Luồng nghiệp vụ người dùng từ Trang chủ -> Danh sách Lab -> Mở nội dung Lab, kèm kiểm soát quyền RBAC 2 lớp |
| **Thời gian** | 2026-10-13 |
| **Tham chiếu từ** | `MODULE_BE/src/common/guards/roles.guard.ts` và cơ chế bảo vệ Route phía `MODULE_FE/src/routes` |

---

## 2. Nội dung chính (Content)

### 2.1. Sơ đồ Luồng Nghiệp vụ Người dùng (User Business Flow)

Sơ đồ thể hiện chu trình tương tác thực tế của người dùng thông thường từ Trang chủ, qua trang Danh sách bài Lab và mở Nội dung bài Lab thực hành:

```mermaid
flowchart TD
    Start([1. User đang ở Trang chủ]) --> ViewHome[User xem giao diện Trang chủ: Banner giới thiệu & Các chủ đề nổi bật]
    
    %% --- Bước chuyển từ Trang chủ sang Lab ---
    ViewHome --> ActionGoLab{User thao tác để vào Lab}
    ActionGoLab -->|Bấm menu 'Labs' trên thanh điều hướng| LabPage[2. Mở Trang Danh sách Lab]
    ActionGoLab -->|Bấm nút 'Khám phá ngay' / 'Bắt đầu'| LabPage

    %% --- Giao diện Trang Lab ---
    LabPage --> ViewLabCatalog[User xem Danh sách các bài Lab]
    ViewLabCatalog --> FilterAction{User có lọc bài không?}
    
    FilterAction -->|Có| UseFilter[Chọn bộ lọc: Role 'Tester/Backend/DevOps', Độ khó, hoặc ô Tìm kiếm]
    UseFilter --> UpdateList[Danh sách Lab tự động lọc theo yêu cầu]
    UpdateList --> ClickLabCard
    
    FilterAction -->|Không: xem danh sách có sẵn| ClickLabCard[User bấm vào 1 thẻ bài Lab cụ thể]

    %% --- Phân nhánh khi chọn bài ---
    ClickLabCard --> CheckLabType{Thẻ bài Lab được click là loại nào?}

    %% --- Nhánh Bài PRO ---
    CheckLabType -->|Bài có nhãn PRO 🔒| ShowProModal[Hiện Popup: 'Bài Lab PRO - Nâng cấp để mở khóa']
    ShowProModal --> UserChoiceModal{User thao tác trên Popup}
    UserChoiceModal -->|Bấm 'Xem gói PRO'| PricingPage[Chuyển sang trang Bảng giá / Nâng cấp]
    UserChoiceModal -->|Bấm nút 'Đóng / X'| LabPage

    %% --- Nhánh Bài FREE -> Vào Nội dung Lab ---
    CheckLabType -->|Bài FREE| LabContentPage[3. Màn hình Nội dung Lab hiển thị]
    
    LabContentPage --> ViewLabWorkspace[User nhìn thấy 3 khu vực chính trên giao diện:]
    ViewLabWorkspace --> Area1[Thanh tiêu đề: Tên bài, Thời lượng, Nút 'Quay lại danh sách']
    ViewLabWorkspace --> Area2[Khung nội dung: Đề bài, Hướng dẫn từng bước & Tiêu chí checklist]
    ViewLabWorkspace --> Area3[Khung thực hành: Không gian làm bài & Nút 'Chạy thử', 'Nộp bài']

    Area3 --> ReadyToPractice([User sẵn sàng đọc đề và bắt đầu làm bài])
```

#### Các điểm chạm (Touchpoints) của Người dùng trên Giao diện:
1. **Trang chủ (Home Page)**:
   - Người dùng dễ dàng thấy menu cố định "Labs" trên thanh điều hướng (Navbar) hoặc nút kêu gọi hành động (Call-to-Action) tại banner chính để mở danh mục thực hành.
2. **Trang Danh sách Lab (Lab Catalog)**:
   - Bộ lọc và thanh tìm kiếm hỗ trợ lọc nhanh theo Chuyên môn (Tester, Backend, DevOps) và Độ khó.
   - Thẻ bài Lab thể hiện rõ nhãn phân loại (Free vs Pro 🔒) và trạng thái làm bài cá nhân (Chưa làm / Đang làm / Đã hoàn thành).
3. **Mở Nội dung Lab**:
   - Nếu bấm bài Pro: Hiển thị Modal thông báo quyền lợi gói Pro văn minh kèm nút tìm hiểu và nút đóng, không gây đứt gãy luồng trải nghiệm.
   - Nếu bấm bài Free: Mở thẳng giao diện Workspace chia bố cục rõ ràng: Khung đọc đề/hướng dẫn và Khung thực hành thao tác.

### 2.2. Sơ đồ Luồng Nghiệp vụ Dành cho Tài khoản PRO (User PRO Flow)

Đối với học viên sở hữu tài khoản **User PRO**, lộ trình tương tự tài khoản thường nhưng toàn bộ rào cản Paywall được gỡ bỏ, đồng thời mở khóa cả Blog lý thuyết PRO và tính năng xem Lời giải mẫu (Solution):

```mermaid
flowchart TD
    Start([1. User PRO đang ở Trang chủ]) --> ViewHome[User xem Trang chủ: Thấy Badge 'PRO' trên Avatar cá nhân]
    
    %% --- Điều hướng sang trang Lab & Blog ---
    ViewHome --> ClickLabs[Bấm menu 'Labs & Blog' trên thanh điều hướng]
    ClickLabs --> LabCatalogPage[2. Mở Trang Danh sách Labs & Blog]

    %% --- Giao diện danh sách đối với User PRO ---
    LabCatalogPage --> ViewList[Xem danh sách: Toàn bộ bài Free và PRO đều ở trạng thái MỞ KHÓA]
    ViewList --> PickItem[User PRO bấm chọn một bài bất kỳ: Free hoặc PRO]

    %% --- Phân loại loại nội dung được mở ---
    PickItem --> CheckContentType{Loại bài User PRO vừa chọn}

    %% --- Nhánh 1: Blog PRO (Chỉ đọc lý thuyết chuyên sâu) ---
    CheckContentType -->|Blog PRO / Lý thuyết| OpenBlog[3A. Mở màn hình Đọc Blog PRO]
    OpenBlog --> BlogUI[Giao diện đọc bài viết đầy đủ:]
    BlogUI --> BlogContent1[- Toàn văn nội dung chuyên sâu không bị mờ / cắt ngắn]
    BlogContent1 --> BlogContent2[- Tài liệu đính kèm & Cheat-sheet độc quyền cho PRO]
    BlogContent2 --> ClickFinishBlog[Bấm 'Đánh dấu đã đọc' -> Hoàn thành bài]

    %% --- Nhánh 2: Lab Thực hành PRO ---
    CheckContentType -->|Lab Thực hành PRO / Free| OpenLabWorkspace[3B. Mở màn hình Lab Workspace]
    OpenLabWorkspace --> WorkspaceUI[Giao diện làm bài với đặc quyền PRO:]
    WorkspaceUI --> LabNormal[- Đề bài, Hướng dẫn từng bước & Không gian thực hành]
    LabNormal --> ProFeature[- Nút đặc quyền PRO: 'Xem Lời giải mẫu / Solution']
    
    %% --- Thao tác làm bài ---
    ProFeature --> ActionPractice[User thực hành: Gõ bài -> Chạy thử -> Nộp bài]
    ActionPractice --> SubmitSuccess[Nộp bài đạt yêu cầu]

    %% --- Hoàn thành & Tiếp tục ---
    ClickFinishBlog --> UpdateProgress[Cập nhật tiến độ hoàn thành vào Profile PRO]
    SubmitSuccess --> UpdateProgress
    UpdateProgress --> Done([Tiếp tục chọn bài tiếp theo])
```

#### Các đặc quyền giao diện của User PRO:
1. **Không bị chặn Paywall**: Toàn bộ bài có gắn nhãn PRO hiển thị biểu tượng mở khóa 🔓, bấm vào là xem ngay mà không gặp popup yêu cầu nâng cấp.
2. **Blog lý thuyết PRO**: Hiển thị đầy đủ 100% nội dung kiến thức chuyên sâu và tài liệu đính kèm.
3. **Workspace Thực hành PRO**: Mở khóa thêm nút **"Xem Lời giải mẫu (Solution)"** để tham khảo đáp án chuẩn khi gặp bài khó.

### 2.3. Sơ đồ Tuần tự Kỹ thuật (Sequence Diagram)

```mermaid
sequenceDiagram
    autonumber
    actor User as Học viên
    participant FE as Giao diện Web
    participant Guard as Roles Guard
    participant LabService as Lab Service
    participant DB as Database (Postgres)

    User->>FE: Chọn Series bài lab trên trang chủ
    FE->>LabService: GET /api/series/:slug
    LabService->>DB: Lấy thông tin Series và danh sách bài lab
    DB-->>LabService: Dữ liệu Series và các bài lab con
    LabService-->>FE: 200 OK (Danh sách bài lab)

    User->>FE: Bấm chọn một bài lab cụ thể
    FE->>Guard: GET /api/labs/:id (kèm Bearer Token)

    Guard->>Guard: Giải mã JWT lấy userId và role
    Guard->>DB: Truy vấn bài lab theo id
    DB-->>Guard: Dữ liệu lab kèm cờ isProOnly

    alt Bài lab Pro nhưng User là tài khoản Free
        Guard-->>FE: 403 Forbidden (Yêu cầu nâng cấp Pro)
        FE-->>User: Hiển thị Modal nâng cấp tài khoản UserPro
    else Hợp lệ (Bài lab Free hoặc User đã là Pro)
        Guard->>LabService: Chuyển tiếp request hợp lệ
        LabService->>DB: Lấy đề bài, initialSnippet, testScript
        DB-->>LabService: Dữ liệu đầy đủ bài lab
        LabService-->>FE: 200 OK (Trả về nội dung bài lab)
        FE-->>User: Render màn hình Lab Workspace 2 cột
    end
```

### 2.4. Phân tích Chi tiết Từng Bước

1. **Cấp độ Series (Public Catalog)**:
   * Danh sách các Series bài lab được công khai để khách vãng lai và học viên tự do khám phá.
   * Từng bài lab trong series được gắn nhãn minh bạch: `Miễn phí (Free Preview)` hoặc `Dành cho Pro (Pro Only)`.

2. **Cơ chế Bảo vệ 2 Lớp (Dual-layer Guard)**:
   * **Lớp 1 (Phía Frontend)**: Kiểm tra thông tin `user.role` trong Redux Store để hiển thị biểu tượng ổ khóa 🔒 hoặc nút mở khóa.
   * **Lớp 2 (Phía Backend - Tuyệt đối)**: Sử dụng NestJS `RolesGuard`. Dù học viên có cố tình gọi API trực tiếp bằng Postman, nếu không có token `userPro` hoặc `admin`, backend lập tức từ chối với mã `403 Forbidden`. Không trả về bất kỳ nội dung bài lab hay kịch bản test nào.

3. **Cung cấp Dữ liệu Môi trường Thực hành (Lab Workspace)**:
   * Khi vượt qua kiểm tra quyền, Frontend nhận về payload gồm:
     * `instructions`: Nội dung hướng dẫn từng bước viết bằng Markdown.
     * `initialSnippet`: Đoạn code mẫu ban đầu đưa vào khung soạn thảo.
     * `sandboxType`: Loại môi trường cần khởi tạo (`js_worker`, `ui_mock`, `api_mock`).
     * `testScript`: Kịch bản kiểm thử sẵn sàng để gửi xuống Web Worker khi bấm nút Test.

---

## 3. Tài liệu tham khảo & Liên kết (References)

- **Mã nguồn liên quan**:
  - Guard kiểm tra vai trò: [MODULE_BE/src/common/guards/roles.guard.ts](file:///d:/Projects/study-web/MODULE_BE/src/common/guards/roles.guard.ts)
  - Định tuyến bảo vệ Frontend: [MODULE_FE/src/routes/ProtectedRoute.tsx](file:///d:/Projects/study-web/MODULE_FE/src/routes/ProtectedRoute.tsx)
- **Tài liệu hệ thống**:
  - Đề xuất Dự án: [01-proposal.md](file:///d:/Projects/study-web/Docs/01-proposal.md)
  - Thiết kế Cơ sở Dữ liệu: [05-database.md](file:///d:/Projects/study-web/Docs/05-database.md)
