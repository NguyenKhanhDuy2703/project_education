<div align="center">

[English](./README.md) | **Tiếng Việt**

---

# study-web

### Nền tảng Thực hành Lab IT Doanh nghiệp & Hệ sinh thái Kỹ thuật Đào tạo

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-12.0+-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![React](https://img.shields.io/badge/React-19.0+-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.0+-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PGlite WASM](https://img.shields.io/badge/PostgreSQL-PGlite_WASM-336791?logo=postgresql&logoColor=white)](https://pglite.dev/)
[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Security](https://img.shields.io/badge/Trivy-CVE_Scanned-1D9E75?logo=security&logoColor=white)](https://github.com/aquasecurity/trivy)
[![Vitest](https://img.shields.io/badge/Vitest-100%25_Passing-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

<p align="center">
  <b>Nền tảng thực hành Lab IT qua dự án mẫu thực tế</b> — Giải quyết triệt để bài toán học thụ động bằng các chuỗi bài thực hành ngắn hạn (15–30 phút), tích hợp động cơ thực thi sandbox phía trình duyệt (<b>PGlite WebAssembly PostgreSQL</b>), cơ chế phân quyền động doanh nghiệp (<b>Dynamic IAM &amp; Feature Overrides</b>) và quy trình biên tập nội dung đa tầng.
</p>

[Tổng quan](#tổng-quan-dự-án) • [Trực quan Sản phẩm](#trực-quan-sản-phẩm) • [Kiến trúc Hệ thống](#kiến-trúc-hệ-thống) • [Không gian Làm việc](#không-gian-làm-việc) • [Điểm nhấn Kỹ thuật](#điểm-nhấn-kỹ-thuật) • [Công nghệ](#công-nghệ-sử-dụng) • [Khởi chạy Nhanh](#khởi-chạy-nhanh) • [Kiểm thử Tự động](#kiểm-thử-tự-động--nghiệm-thu-chất-lượng) • [Mục lục Tài liệu](#mục-lục-tài-liệu-kiến-trúc)

---

</div>

## Trực quan Sản phẩm

Đoạn ghi hình sau mô phỏng toàn bộ chu kỳ thực thi của không gian thực hành **study-web** trên trình duyệt:

<div align="center">

<img src="./docs/assets/demo-5s.gif" alt="study-web Demo Thực thi Truy vấn SQL trên Trình duyệt với PGlite WASM" width="100%" />

<p align="center">
  <sub><b>Hình 1:</b> Quy trình thực thi thực tế trong Learner Workspace — Soạn thảo Monaco SQL, kiểm tra an toàn cú pháp qua AST guard, thực thi cơ sở dữ liệu WebAssembly (PGlite) dưới 10ms, chấm điểm tự động đối soát diff và mở khóa điểm tích lũy.</sub>
</p>

<p align="center">
  <a href="./docs/assets/demo-5s.mp4"><b>Tải xuống Video MP4 (H.264)</b></a> &bull;
  <a href="./docs/assets/demo-5s.webm"><b>Tải xuống WebM</b></a> &bull;
  <a href="./docs/assets/demo-poster.png"><b>Xem Ảnh Poster Độ Phân Giải Cao</b></a>
</p>

</div>

<details>
<summary><b>Trình tự Thực thi Kỹ thuật (0:00 – 0:05)</b> <i>(Nhấp để xem chi tiết)</i></summary>

- **0.0s – 1.2s**: Học viên hoàn thiện truy vấn trực tiếp trong Monaco Editor với tính năng tô sáng cú pháp và gợi ý mã lệnh tự động.
- **1.2s – 1.8s**: Khi nhấn nút thực thi, bộ lọc AST phía client (`sqlGuard.ts`) phân tích cây cú pháp trừu tượng, xác thực tính an toàn và ngăn chặn các thao tác ghi phá hủy dữ liệu.
- **1.8s – 2.9s**: Công cụ **PGlite 0.5.10** (PostgreSQL 16 biên dịch sang WebAssembly) chạy truy vấn trong Web Worker độc lập với độ trễ chỉ **7.8ms**, bộ so khớp diff xác nhận độ tương thích 100% với đáp án chuẩn.
- **2.9s – 5.0s**: Hộp thoại hoàn thành chuẩn doanh nghiệp hiển thị kết quả kiểm chứng thành công và kích hoạt mở khóa điểm thưởng (+50 XP).

</details>

---

## Tổng quan Dự án

Mô hình đào tạo IT trực tuyến truyền thống thường rơi vào tình trạng thụ động ("video tutorial hell") và tách rời thực tế công nghiệp. **`study-web`** khắc phục rào cản này bằng các **chuỗi bài lab thực chiến ngắn hạn (15–30 phút)** lồng ghép chặt chẽ vào các dự án phần mềm hoàn chỉnh.

### Trụ cột Thiết kế Cốt lõi

- **Thực hành Tích cực Thay vì Học Thụ động**: Học viên trực tiếp mở codebase mẫu, viết truy vấn cơ sở dữ liệu, sửa lỗi hồi quy, viết kiểm thử đơn vị và kiểm chứng kết quả ngay trên trình duyệt.
- **Phản hồi Tức thì Dưới 10ms**: Nhờ động cơ WebAssembly (**PGlite PostgreSQL**), các câu truy vấn được xử lý ngay trong Web Worker phía trình duyệt, loại bỏ chi phí duy trì hạ tầng container trên đám mây.
- **Cơ chế Chấm điểm Hai Tầng Chống Gian lận**: Phản hồi chẩn đoán chạy tức thì trên client, nhưng kết quả nộp bài chính thức được thẩm định độc lập phía backend thông qua worker tạm thời chạy đối chiếu bộ test case ẩn.
- **Quản trị Phân quyền Chuẩn Doanh nghiệp**: Thiết kế theo tiêu chuẩn SaaS doanh nghiệp với phân quyền đa cấp, cơ chế ghi đè quyền hạn theo từng người dùng (User Feature Overrides), quy trình duyệt nội dung qua State Machine và cơ chế xoay vòng phiên đăng nhập an toàn.

---

## Kiến trúc Hệ thống

Hệ thống tuân thủ mô hình **Clean Modular Monolith** phân tách rõ rệt giữa lớp giao diện, gateway điều hướng, nghiệp vụ phân quyền và các môi trường thực thi sandbox độc lập:

```mermaid
graph TD
    Client["Client Browser (React 19 + Monaco Editor + PGlite WASM Web Worker)"]
    Nginx["Nginx Reverse Proxy / Ingress Gateway"]
    NestGateway["NestJS API Gateway (Helmet, CookieParser, CORS, RateLimiting)"]
    
    subgraph Security_Layer["Lớp Bảo mật & Quản trị IAM"]
        AuthGuard["JWT HttpOnly Cookie Auth Guard"]
        TokenRotation["Refresh Token Rotation Service (ADR-001)"]
        EntitlementsGuard["Dynamic Entitlements & Feature Override Guard (DOC-07)"]
        SwaggerAuth["Swagger Basic Auth Guard (Môi trường Production)"]
    end

    subgraph Service_Modules["Các Module Nghiệp vụ NestJS"]
        AuthModule["Auth & Session Management"]
        UserModule["User & Plan Tier Management"]
        LabModule["Lab Series & Curriculum Service"]
        ReviewModule["Contributor Review Queue & State Machine"]
        GroupsModule["Group-Based Enterprise IAM"]
        AuditModule["Security Audit Logging Service"]
    end

    subgraph Data_Layer["Lớp Lưu trữ Dữ liệu & Sandbox"]
        Prisma["Prisma ORM v6"]
        Postgres[(Cơ sở dữ liệu Hệ thống PostgreSQL)]
        PGliteBackend["Ephemeral PGlite Sandbox (Động cơ Thẩm định Backend)"]
    end

    Client -->|HTTPS / REST API| Nginx
    Nginx --> NestGateway
    NestGateway --> Security_Layer
    Security_Layer --> Service_Modules
    Service_Modules --> Prisma
    Service_Modules --> PGliteBackend
    Prisma --> Postgres
```

---

## Không gian Làm việc

Hệ thống thiết kế 3 không gian làm việc chuyên biệt theo từng vai trò kỹ thuật:

| Không gian | Đối tượng | Năng lực Kỹ thuật | Công nghệ Chủ đạo |
|:---|:---|:---|:---|
| **Learner Lab Workspace** | Học viên & Lập trình viên | Monaco code editor, cơ sở dữ liệu PGlite WASM xử lý <10ms, kiểm soát an toàn AST, đối soát diff tập kết quả tự động. | React 19, Monaco Editor, PGlite WASM, TanStack Query |
| **Contributor Studio** | Tác giả Nội dung | Soạn thảo giáo trình theo chuẩn ngữ pháp Markdown (SPEC-01), chế độ xem trước trực tiếp phía học viên, kiểm tra cú pháp schema tự động. | React 19, Tailwind CSS v4, Marked AST parser |
| **Admin Control Plane** | Quản trị viên & Phê duyệt | Hàng đợi xét duyệt bài lab theo State Machine, phân quyền động người dùng và nhóm, thanh tra nhật ký kiểm toán (Audit Logs). | React 19, Radix UI, Lucide, Recharts |

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                CÁC KHÔNG GIAN STUDY-WEB                                │
├───────────────────────────────┬───────────────────────────────┬────────────────────────┤
│ 1. Learner Lab Workspace      │ 2. Contributor Studio         │ 3. Admin Control Plane │
├───────────────────────────────┼───────────────────────────────┼────────────────────────┤
│ • In-Browser PGlite WASM DB   │ • Ngữ pháp Markdown (SPEC-01) │ • Duyệt bài Đa tầng    │
│ • Trình soạn thảo Monaco      │ • Xem trước trực tiếp Split   │ • Động cơ Phân quyền   │
│ • Kiểm soát An toàn AST       │ • Tiền kiểm Cú pháp Schema    │ • Ghi đè Quyền hạn     │
│ • Không độ trễ Container Cloud│ • Bộ dữ liệu Mẫu & Đáp án     │ • Nhật ký Đối soát     │
└───────────────────────────────┴───────────────────────────────┴────────────────────────┘
```

---

## Cấu trúc Thư mục Monorepo

```
study-web/
├── MODULE_BE/               # Backend API NestJS 12 & Lớp Lưu trữ Dữ liệu
│   ├── src/
│   │   ├── modules/         # Auth, Labs, Series, Entitlements, Review, Groups, Audit
│   │   ├── common/          # Guards, Filters, Interceptors, Decorators
│   │   └── prisma/          # Dịch vụ Prisma Client & Database Migrations
│   ├── prisma/schema.prisma # Mô hình Dữ liệu PostgreSQL
│   └── test/                # Bộ Kiểm thử Tích hợp & Đơn vị (tsx --test)
│
├── MODULE_FE/               # Ứng dụng Web Học viên React 19
│   ├── src/
│   │   ├── pages/lab/       # Không gian Lab, Danh mục Series, Lộ trình
│   │   ├── features/        # Worker chạy lab, tích hợp Monaco, PGlite WASM
│   │   └── stores/          # Quản lý State Redux Toolkit & Cache TanStack Query
│   └── public/              # Tài nguyên Vector, Biểu tượng tĩnh
│
├── MODULE_ADMIN/            # Cổng Quản trị & Biên soạn Studio React 19
│   ├── src/
│   │   ├── pages/admin/     # Hàng đợi Duyệt bài, Quản lý User, Nhóm, Audit Logs
│   │   └── features/        # Trình soạn thảo AST Markdown, State Machine duyệt bài
│   └── src/components/ui/   # Giao diện Radix UI + Tailwind CSS v4 chuẩn A11y
│
├── docs/                    # Trung tâm Tài liệu Kiến trúc Docs-as-Code
│   ├── adr/                 # Quyết định Kiến trúc (ADR-001, ADR-002)
│   ├── specs/               # Hợp đồng Dữ liệu Lab JSON Schema & Ngữ pháp Markdown
│   ├── reports/             # Báo cáo Nghiệm thu, An ninh & Đánh giá Hiệu năng
│   └── workflows/           # 13 Sơ đồ Tuần tự Chi tiết
└── docker-compose.yml       # Cấu hình Khởi chạy Docker Toàn hệ thống
```

---

## Điểm nhấn Kỹ thuật

### 1. Cơ sở dữ liệu WebAssembly trên Trình duyệt ([ADR-002](./docs/adr/002-pglite-sql-sandbox.md))
- **Môi trường Cơ sở dữ liệu Cô lập**: Mỗi bài lab khởi tạo một phiên bản **PGlite 0.5.10** chạy PostgreSQL biên dịch sang WebAssembly trong Web Worker riêng.
- **Tiết kiệm Hạ tầng Máy chủ**: Câu lệnh chạy trong **dưới 10ms** ngay trên máy học viên với đầy đủ cú pháp PostgreSQL (CTEs, Window Functions, JSONB, Subqueries).
- **Thẩm định Độc lập Phía Máy chủ**: Truy vấn của học viên không chạm vào database sản xuất. Khi nộp bài, backend khởi chạy PGlite worker tạm thời để đối chiếu với bộ test case ẩn.
- **Kiểm soát An toàn AST**: Bộ phân tích cú pháp ngăn chặn các câu lệnh nguy hại (`DROP`, `ALTER`, `TRUNCATE`) và bắt buộc định dạng đơn câu lệnh.

### 2. Phân quyền Động Doanh nghiệp ([DOC-07](./docs/07-dynamic-authorization-and-entitlements.md))
- **Phân tầng Vai trò (RBAC)**: Hỗ trợ 4 nhóm vai trò: `Admin`, `Contributor`, `UserPro`, và `User`.
- **Ghi đè Quyền hạn Từng Tài khoản (User Feature Overrides)**: Cho phép bật/tắt từng tính năng độc lập (như `can_access_beta_labs` hay `can_publish_unreviewed`) cho từng cá nhân mà không cần đổi vai trò toàn cục.
- **Nhật ký Kiểm toán Bất biến**: Mọi thay đổi quyền hạn và trạng thái tài khoản đều được ghi nhận với mã người dùng, mã người thực hiện, thời điểm và địa chỉ IP.

### 3. Bảo mật Xác thực & Vòng đời Phiên làm việc ([ADR-001](./docs/adr/ADR-001-auth-refresh-rotation.md))
- **Xoay vòng Refresh Token (Token Rotation)**: Mỗi lần cấp mới token sẽ hủy token cũ và phát hành cặp mã định danh mới.
- **Băm SHA-256 Lưu trữ**: Token chỉ được lưu dưới dạng băm một chiều SHA-256 trong cơ sở dữ liệu.
- **Cửa sổ Trễ Đồng thời 30 Giây**: Bảo vệ khỏi lỗi mất phiên do độ trễ mạng hoặc tải trang đồng thời trên nhiều tab trình duyệt.
- **Phòng chống Tấn công XSS & CSRF**: Token xác thực được lưu hoàn toàn trong cookie `HttpOnly`, `SameSite=Lax`, và `Secure`.

### 4. Quy trình Biên tập Nội dung Đa vòng
- **Hệ thống State Machine Chuẩn hóa**:
  $$\text{Draft} \longrightarrow \text{Submitted} \longrightarrow \text{In Review} \genfrac{}{}{0pt}{}{\nearrow \text{Approved} \longrightarrow \text{Published}}{\searrow \text{Changes Requested} \longrightarrow \text{Draft}}$$
- **Ngữ pháp Giáo trình Markdown ([SPEC-01](./docs/specs/lab-markdown-v1.md))**: Định dạng chuẩn hóa tích hợp khai báo schema, mã khởi tạo và kiểm thử tự động.
- **Tách bạch Trách nhiệm**: Tác giả soạn bài trong Studio; chỉ Quản trị viên mới có thẩm quyền xuất bản ra môi trường chung.

---

## Công nghệ Sử dụng

| Lớp Hệ thống | Công nghệ | Phiên bản | Vai trò Kiến trúc |
|:---|:---|:---:|:---|
| **Learner Frontend** | React, TypeScript, Vite | 19.2 / 8.3 | Ứng dụng SPA hiệu năng cao, điều hướng mượt mà, hỗ trợ HMR |
| **Admin Portal** | React, TypeScript, Vite | 19.2 / 8.3 | Cổng chuyên biệt dành cho tác giả nội dung và ban quản trị |
| **Giao diện & UI** | Tailwind CSS v4, Radix UI, Lucide | 4.3 | UI responsive hiện đại, tuân thủ tiêu chuẩn tiếp cận WCAG 2.1 AA |
| **Trình soạn thảo Mã** | Monaco Editor | 4.7 | Trải nghiệm soạn thảo chuẩn Visual Studio Code trên trình duyệt |
| **Động cơ In-Browser** | PGlite (ElectricSQL WASM) | 0.5.10 | Cơ sở dữ liệu PostgreSQL thực thụ chạy trong Web Worker client |
| **Quản lý Dữ liệu Client** | TanStack React Query, Redux Toolkit | 5.104 / 2.12 | Quản lý bộ nhớ đệm máy chủ, đồng bộ đa tab, xử lý optimistic UI |
| **Backend API Gateway** | NestJS, Express, TypeScript | 12.0 / 5.0 | Modular Monolith kiến trúc sạch, Dependency Injection, DTO validation |
| **Lưu trữ & ORM** | Prisma ORM, PostgreSQL | 6.19 / 16+ | Truy vấn type-safe, declarative migration, quan hệ thực thể chặt chẽ |
| **Bảo mật & Auth** | Passport.js, JWT, Bcrypt, Helmet | Mới nhất | Xác thực cookie HttpOnly, xoay vòng mã định danh SHA-256 |
| **DevOps & Kiểm toán** | Docker, Compose, Trivy | Mới nhất | Đóng gói container đa tầng, quét lỗ hổng bảo mật thư viện tự động |

---

## Khởi chạy Nhanh

### Yêu cầu Tiên quyết
- [Node.js](https://nodejs.org/) (phiên bản khuyến nghị v20.x trở lên)
- [Docker](https://www.docker.com/) & Docker Compose
- [Git](https://git-scm.com/)

### 1. Clone Mã nguồn & Khởi động Cơ sở Dữ liệu
```bash
# Clone repository
git clone https://github.com/NguyenKhanhDuy2703/study-web.git
cd study-web

# Khởi chạy container PostgreSQL cục bộ
docker run --name studyweb-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=studyweb_db \
  -p 5432:5432 -d postgres:16-alpine
```

### 2. Khởi động Backend (`MODULE_BE`)
```bash
cd MODULE_BE

# Cài đặt thư viện
npm install

# Cấu hình biến môi trường
cp .env.example .env
# Đảm bảo DATABASE_URL="postgresql://postgres:postgres@localhost:5432/studyweb_db"

# Đồng bộ Prisma Schema & Nạp Dữ liệu Mẫu
npx prisma db push
npm run prisma:seed

# Khởi chạy NestJS ở chế độ phát triển
npm run start:dev
```
> **Backend Gateway**: `http://localhost:3000`  
> **Swagger API Docs**: `http://localhost:3000/api/docs` *(Yêu cầu Basic Auth ở môi trường Production)*

### 3. Khởi động Giao diện Học viên (`MODULE_FE`)
```bash
cd ../MODULE_FE

# Cài đặt thư viện
npm install

# Khởi chạy Vite Dev Server
npm run dev
```
> **Cổng Học viên**: `http://localhost:5173`

### 4. Khởi động Cổng Quản trị & Studio (`MODULE_ADMIN`)
```bash
cd ../MODULE_ADMIN

# Cài đặt thư viện
npm install

# Khởi chạy Vite Dev Server
npm run dev
```
> **Cổng Quản trị & Soạn bài**: `http://localhost:5174`

---

### Bảng Cổng Dịch vụ (Service Port Map)

| Ứng dụng / Dịch vụ | URL Mặc định | Mô tả |
|:---|:---|:---|
| **Backend REST API** | `http://localhost:3000` | NestJS Gateway, Xác thực, Phân quyền Entitlements |
| **Tài liệu API Tương tác** | `http://localhost:3000/api/docs` | Swagger UI documentation & OpenAPI Schema |
| **Cổng Học viên** | `http://localhost:5173` | Không gian Làm việc Lab, Danh mục Series, Lộ trình học |
| **Cổng Quản trị & Studio**| `http://localhost:5174` | Hàng đợi Duyệt bài, Soạn thảo Markdown, Quản trị IAM, Audit Logs |
| **Cơ sở Dữ liệu PostgreSQL** | `localhost:5432` | Nơi lưu trữ dữ liệu bền vững người dùng và chương trình học |

---

## Kiểm thử Tự động & Nghiệm thu Chất lượng

Hệ thống duy trì quy trình kiểm thử tự động toàn diện trên cả 3 phân hệ:

```bash
# Kiểm thử Backend (TSX Node Test Runner - 13 Tests trên 6 Suites)
cd MODULE_BE
npm run test
npm run build

# Kiểm thử Giao diện Học viên (Vitest + Happy-DOM - 182 Tests trên 37 Suites)
cd MODULE_FE
npm run test
npm run build

# Kiểm thử Cổng Quản trị (Vitest - 40 Tests trên 5 Suites)
cd MODULE_ADMIN
npm run test
npm run build

# Quét lỗ hổng bảo mật với Trivy
trivy fs --severity HIGH,CRITICAL .
```

### Bảng Điểm Kiểm thử Hệ thống
- **Backend (`MODULE_BE`)**: **13 / 13** kiểm thử tích hợp & đơn vị vượt qua trên 6 bộ kiểm thử (Băm phiên xác thực, cửa sổ trễ xoay vòng token ADR-001, ánh xạ envelope DTO, quyền thẩm định PGlite).
- **Frontend (`MODULE_FE`)**: **182 / 182** kiểm thử vượt qua trên 37 bộ kiểm thử (Vòng đời PGlite Web Worker, chính sách bảo vệ AST sqlGuard, Monaco editor, giải mã quiz).
- **Admin Portal (`MODULE_ADMIN`)**: **40 / 40** kiểm thử vượt qua trên 5 bộ kiểm thử (State machine hàng đợi duyệt bài, quy trình đăng ký contributor, phân quyền IAM đa cấp).
- **Tổng số Kiểm thử Tự động**: **235 / 235** kiểm thử vượt qua toàn monorepo (Tỷ lệ đạt 100%).
- **Tốc độ Build**: `MODULE_FE` build trong **<1.0s**, `MODULE_ADMIN` trong **<0.6s**, và `MODULE_BE` biên dịch sản xuất hoàn toàn sạch sẽ.

---

## Mục lục Tài liệu Kiến trúc

Toàn bộ tài liệu thiết kế kiến trúc, đặc tả kỹ thuật và lộ trình được quản lý phiên bản theo mô hình Docs-as-Code tại thư mục [`docs/`](./docs):

| Mã Tài liệu | Tên Tài liệu | Phiên bản | Đường dẫn |
|:---|:---|:---:|:---|
| **DOC-01** | Đề xuất Dự án & Tầm nhìn Giáo dục | 1.1 | [`docs/01-proposal.md`](./docs/01-proposal.md) |
| **DOC-03** | Danh mục Backlog Sản phẩm & Tiêu chí Chấp nhận | 1.1 | [`docs/03-product-backlog.md`](./docs/03-product-backlog.md) |
| **DOC-05** | Thiết kế Cơ sở Dữ liệu & Sơ đồ ERD | 1.1 | [`docs/05-database.md`](./docs/05-database.md) |
| **DOC-06** | Trung tâm Quy trình & 13 Sơ đồ Tuần tự | 1.2 | [`docs/workflows/README.md`](./docs/workflows/README.md) |
| **DOC-07** | Đặc tả Kỹ thuật Phân quyền Động & Entitlements | 1.0 | [`docs/07-dynamic-authorization-and-entitlements.md`](./docs/07-dynamic-authorization-and-entitlements.md) |
| **DOC-08** | Lộ trình Quản lý Contributor, Admin Review & IAM | 1.1 | [`docs/08-contributor-admin-iam-sprint-roadmap.md`](./docs/08-contributor-admin-iam-sprint-roadmap.md) |
| **DOC-11** | Tách biệt Vai trò Admin vs Contributor & Quản lý User | 1.2 | [`docs/11-admin-contributor-separation-and-user-crud.md`](./docs/11-admin-contributor-separation-and-user-crud.md) |
| **ADR-001** | Quyết định Kiến trúc: Xoay vòng Refresh Token | 1.0 | [`docs/adr/ADR-001-auth-refresh-rotation.md`](./docs/adr/ADR-001-auth-refresh-rotation.md) |
| **ADR-002** | Quyết định Kiến trúc: Sandbox PGlite trên Trình duyệt | 1.0 | [`docs/adr/002-pglite-sql-sandbox.md`](./docs/adr/002-pglite-sql-sandbox.md) |
| **SPEC-01** | Đặc tả Ngữ pháp Khối Markdown Giáo trình V1 | 1.0 | [`docs/specs/lab-markdown-v1.md`](./docs/specs/lab-markdown-v1.md) |
| **SPEC-02** | JSON Schema Hợp đồng Dữ liệu Lab V1 | 1.0 | [`docs/specs/lab-content-contract-v1.json`](./docs/specs/lab-content-contract-v1.json) |
| **REP-01** | Báo cáo Đánh giá Hiệu năng & Độ trễ Web Worker | 1.0 | [`docs/reports/lab-upgrade-performance.md`](./docs/reports/lab-upgrade-performance.md) |
| **REP-02** | Báo cáo Kiểm toán An ninh & Gia cố Container | 1.0 | [`docs/reports/lab-upgrade-security.md`](./docs/reports/lab-upgrade-security.md) |
| **REP-03** | Báo cáo Đánh giá Mức độ Sẵn sàng Phát hành | 1.0 | [`docs/reports/release-readiness-audit.md`](./docs/reports/release-readiness-audit.md) |

---

## Tác giả & Kỹ sư Thiết kế

**Nguyễn Khánh Duy** — *Fullstack Lead & Kiến trúc sư Phần mềm*  
Chủ trì thiết kế kiến trúc toàn hệ thống, NestJS backend cốt lõi, PGlite WebAssembly sandbox và động cơ phân quyền động.

- **GitHub**: [@NguyenKhanhDuy2703](https://github.com/NguyenKhanhDuy2703)  
- **LinkedIn**: [Nguyễn Khánh Duy](https://www.linkedin.com/in/nguy%E1%BB%85n-kh%C3%A1nh-duy-4477a2355/)  
- **Email**: [nguyenkhanhduy270304@gmail.com](mailto:nguyenkhanhduy270304@gmail.com)

---

## Giấy phép Sử dụng

Dự án được phân phối dưới giấy phép [MIT License](LICENSE) — xem tệp tin [LICENSE](LICENSE) để biết thêm chi tiết.

<div align="center">
  <sub>Được phát triển với tư duy kỹ thuật chuẩn mực, vòng phản hồi độ trễ tối thiểu và tinh thần giáo dục thực nghiệm.</sub>
</div>
