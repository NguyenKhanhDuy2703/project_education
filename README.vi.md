<div align="center">

[🌐 English](./README.md) | **🇻🇳 Tiếng Việt**

---

# 🎓 study-web (project_education)
### Enterprise Hands-on IT Lab Platform & Educational Engineering Ecosystem

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
  <b>Nền tảng thực hành Lab IT qua dự án mẫu thực tế</b> — Giải quyết bài toán "học đi đôi với hành" bằng các chuỗi bài lab thực chiến tinh gọn (15–30 phút), tích hợp hệ thống phân quyền động doanh nghiệp (Dynamic IAM & Entitlements) và kiến trúc Full-Stack Production-Ready.
</p>

[Khám phá Video Demo](#video-showcase--demo-trực-quan) • [Tổng quan](#tổng-quan-dự-án-project-overview) • [Kiến trúc](#kiến-trúc-hệ-thống-system-architecture) • [Điểm nhấn](#điểm-nhấn-kỹ-thuật-key-engineering-highlights) • [Công nghệ](#công-nghệ-sử-dụng-technology-stack) • [Khởi chạy Nhanh](#khởi-chạy-nhanh-quick-start) • [Kiểm thử](#kiểm-thử--nghiệm-thu-chất-lượng-testing--quality-verification) • [Tài liệu](#mục-lục-tài-liệu-kiến-trúc-documentation-index)

---

</div>

## 🎬 Video Showcase & Demo Trực quan

Khám phá trải nghiệm thực tế của nền tảng qua video ngắn 60s, video giới thiệu toàn cảnh kiến trúc 5 phút và hình ảnh mô phỏng không gian thực hành:

<div align="center">

<table>
<tr>
<th width="65%" align="center">🖥️ Video Toàn cảnh Hệ thống (16:9 Walkthrough)</th>
<th width="35%" align="center">📱 Video Ngắn (9:16 Shorts / Reel)</th>
</tr>
<tr>
<td align="center" valign="top">
  <a href="https://github.com/NguyenKhanhDuy2703/study-web/releases">
    <img src="./docs/assets/video-preview-banner.svg" alt="study-web Video Tour & Interactive Lab Preview" width="100%"/>
  </a>
  <br/>
  <b>Video Chi tiết 5 Phút:</b> Trải nghiệm kiến trúc, PGlite WASM, Studio soạn bài và Cổng Admin IAM.<br/>
  <a href="https://github.com/NguyenKhanhDuy2703/study-web/releases">▶ <b>Xem Video Chi Tiết</b></a>
</td>
<td align="center" valign="top">
  <a href="https://github.com/NguyenKhanhDuy2703/study-web/releases">
    <img src="./docs/assets/video-short-preview.svg" alt="study-web 60-Second Video Short Preview" width="100%"/>
  </a>
  <br/>
  <b>Video Ngắn 60s:</b> Chạy truy vấn SQL trực tiếp in-browser và tự động chấm điểm tức thì.<br/>
  <a href="https://github.com/NguyenKhanhDuy2703/study-web/releases">▶ <b>Xem Video Ngắn (Shorts)</b></a>
</td>
</tr>
</table>

</div>

<details>
<summary><b>⏱️ Mục lục Mốc thời gian Video (Timestamp Chapters)</b> <i>(Nhấp để mở rộng)</i></summary>

#### 📱 Video Ngắn 60 Giây (Fast Lab Sprint)
- `0:00` — Khởi tạo môi trường WebAssembly tức thì không cần cấu hình
- `0:15` — Monaco SQL Editor & thực thi PostgreSQL 16 trong Web Worker (PGlite)
- `0:30` — Bộ lọc an ninh AST `sqlGuard` và đối soát diff kết quả theo tập hợp
- `0:45` — Chấm điểm xác thực phía Backend trên instance tạm thời và trao điểm (+50 XP)

#### 🖥️ Video Toàn cảnh Kỹ thuật 5 Phút (End-to-End Tour)
- `0:00` — Tầm nhìn sản phẩm & Triết lý chuỗi bài thực hành ngắn hạn
- `1:00` — Không gian Học viên: Sandbox PGlite WASM Web Worker chuyên sâu
- `2:15` — Contributor Studio: Chuẩn ngữ pháp Markdown (SPEC-01) & Xem trước trực tiếp
- `3:30` — Bảng điều khiển Quản trị: Hàng đợi duyệt bài State Machine & IAM Động (DOC-07)
- `4:30` — Cơ chế chấm điểm Backend cách ly & Quét bảo mật container (ADR-001, ADR-002)

</details>

> [!TIP]
> **Tùy biến liên kết Video & Phát Video Cục bộ**: Để liên kết đến nền tảng ngoài (YouTube Shorts, Loom) hoặc phát trực tiếp video MP4 cục bộ:
> ```html
> <video src="./docs/assets/demo-short.mp4" controls width="100%" poster="./docs/assets/video-preview-banner.svg"></video>
> ```

---

## 📌 Tổng quan Dự án (Project Overview)

`study-web` được xây dựng để thay thế mô hình học lý thuyết dài dòng bằng **Chuỗi bài Lab thực hành ngắn hạn (Hands-on Lab Series)** xoay quanh các dự án mẫu thực tế.

- **Learn by Doing**: Người học tiếp cận bài lab, mở codebase dự án mẫu, trực tiếp viết mã / bắt bug / viết test / cấu hình Docker CI/CD và đối chiếu kết quả ngay lập tức.
- **Enterprise Governance**: Tích hợp quy trình biên tập nội dung nhiều vòng (**Content Lifecycle Studio**) dành cho Contributor và Admin với phân quyền đa tầng linh hoạt (**Dynamic Entitlements & Feature Overrides**).
- **Production-Grade Reliability**: Kiến trúc phân tầng tách biệt Frontend (Vite React) và Backend (NestJS Monolith), bảo vệ Swagger tài liệu API qua HTTP Basic Auth và quét bảo mật container tự động với Trivy.

---

## 🏛 Kiến trúc Hệ thống (System Architecture)

Hệ thống được thiết kế theo mô hình Clean Modular Monolith kết hợp kiến trúc phân quyền động (Dynamic Entitlements Engine):

```mermaid
graph TD
    Client["Client Browser (React 19 + Vite + Monaco Editor + PGlite WASM)"]
    Nginx["Nginx Reverse Proxy / Web Server"]
    NestGateway["NestJS API Gateway & Middleware (Cookie Parser, CORS, Helmet)"]
    
    subgraph Security_Layer["Security & IAM Core"]
        AuthGuard["JWT HttpOnly Cookie Auth Guard"]
        EntitlementsGuard["Dynamic Entitlements & RBAC Guard"]
        SwaggerAuth["Swagger Basic Auth Guard (Production)"]
    end

    subgraph Service_Modules["NestJS Application Modules"]
        AuthModule["Auth & IAM Module (Token Rotation ADR-001)"]
        UserModule["User & Subscription Management"]
        LabModule["Lab Series & Studio Module"]
        AuditModule["Audit Logging Module"]
    end

    subgraph Data_Layer["Data & Persistence"]
        Prisma["Prisma ORM v6"]
        Postgres[(PostgreSQL Database)]
        PGliteBackend["Ephemeral PGlite Sandbox (Backend Grader)"]
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

## ✨ Điểm nhấn Kỹ thuật (Key Engineering Highlights)

### 1. Phân quyền Động Đa cấp (Dynamic IAM & Feature Overrides)
- Hệ thống hỗ trợ 4 vai trò chính: `Admin`, `Contributor`, `UserPro`, và `User`.
- Cung cấp cơ chế **User Feature Override** cho phép can thiệp bật/tắt quyền truy cập tính năng (Entitlement) đến từng người dùng mà không cần thay đổi Role toàn cục.
- Audit Logging tự động ghi nhận mọi hành vi thay đổi quyền hạn và trạng thái nội dung để phục vụ đối soát an ninh.

### 2. Quy trình Biên tập Nội dung Toàn diện (Content Lifecycle Studio)
- Hỗ trợ workflow chuẩn State Machine cho các Series bài Lab:  
  `Draft` ➔ `Submitted` ➔ `In Review` ➔ `Changes Requested` ➔ `Approved` ➔ `Published` ➔ `Archived`.
- Phân định rõ ràng giữa người tạo đề (Contributor) và người phê duyệt xuất bản (Admin).

### 3. Bảo mật Cấp Doanh nghiệp (Enterprise-Grade Security)
- **Token Security**: Lưu trữ Refresh Token qua `HttpOnly`, `SameSite` Cookies để phòng chống tấn công XSS và trộm cắp token.
- **Tài liệu API được bảo vệ**: Swagger Documentation (`/api/docs`) tự động kích hoạt HTTP Basic Auth ở môi trường Production.
- **Container Hardening**: Dockerfile tối ưu kích thước qua Multi-Stage Build, quét lỗ hổng thư viện và OS qua Trivy Security Scanner.

### 4. Trải nghiệm Học tập Trực quan (Interactive Lab Workspace)
- Tích hợp **Monaco Editor** và **PGlite WebAssembly PostgreSQL** trực tiếp trên trình duyệt, cho phép chạy thử nghiệm cơ sở dữ liệu thật với độ trễ siêu thấp và đối soát chấm điểm tự động.

---

## 🛠 Công nghệ Sử dụng (Technology Stack)

| Lớp (Layer) | Công nghệ | Mục đích sử dụng |
|:---|:---|:---|
| **Frontend Web** | React 19, TypeScript, Vite 8 | Single Page Application tốc độ cao, type-safety tuyệt đối |
| **Admin Portal** | React 19, TypeScript, Vite 8 | Cổng quản trị hệ thống, duyệt bài lab, IAM & Audit logs |
| **Giao diện & UI** | Tailwind CSS v4, Radix UI, Shadcn | UI Component tinh gọn, chuẩn Accessibility (A11y) |
| **Code Editor** | `@monaco-editor/react` | Môi trường viết mã code in-browser cho các bài lab |
| **In-Browser DB** | `@electric-sql/pglite` | Engine PostgreSQL WASM chạy ngầm trong Web Worker |
| **State & Data** | TanStack React Query v5, Redux Toolkit | Server state cache, synchronization, client state |
| **Backend API** | NestJS 12, Express, TypeScript | Modular Monolith kiến trúc sạch, Dependency Injection |
| **ORM & Database** | Prisma ORM 6, PostgreSQL | Type-safe database queries, schema migrations, relations |
| **Bảo mật & Auth** | Passport.js, JWT, Bcrypt, Basic Auth | Xác thực bảo vệ endpoint và tài liệu Swagger |
| **DevOps & CI/CD** | Docker, Docker Compose, GitHub Actions, Trivy | Đóng gói container, kiểm thử tự động, quét bảo mật CVE |

---

## 🚀 Khởi chạy Nhanh (Quick Start)

### Yêu cầu Tiên quyết (Prerequisites)
- [Node.js](https://nodejs.org/) (khuyến nghị phiên bản v20 trở lên)
- [Docker](https://www.docker.com/) & Docker Compose
- [Git](https://git-scm.com/)

### 1. Khởi tạo Cơ sở dữ liệu
```bash
# Clone repository
git clone https://github.com/NguyenKhanhDuy2703/study-web.git
cd study-web

# (Tùy chọn) Khởi chạy PostgreSQL container cục bộ
docker run --name studyweb-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=studyweb_db \
  -p 5432:5432 -d postgres:16-alpine
```

### 2. Khởi động Backend (`MODULE_BE`)
```bash
cd MODULE_BE

# Cài đặt dependencies
npm install

# Cấu hình biến môi trường
cp .env.example .env
# Đảm bảo DATABASE_URL="postgresql://postgres:postgres@localhost:5432/studyweb_db"

# Đồng bộ Prisma schema & nạp dữ liệu mẫu (Seed Data)
npx prisma db push
npm run prisma:seed # (hoặc npx tsx prisma/seed.ts)

# Khởi chạy server ở chế độ dev
npm run start:dev
```
> **Backend Gateway**: `http://localhost:3000`  
> **Swagger API Docs**: `http://localhost:3000/api/docs` *(Bảo vệ bởi Basic Auth trên production)*

### 3. Khởi động Frontend Learner Web (`MODULE_FE`)
```bash
# Mở một terminal mới
cd MODULE_FE

# Cài đặt dependencies
npm install

# Khởi chạy Vite Dev Server
npm run dev
```
> **Learner Web Application**: `http://localhost:5173`

### 4. Khởi động Admin & Contributor Portal (`MODULE_ADMIN`)
```bash
# Mở terminal mới
cd MODULE_ADMIN

# Cài đặt dependencies
npm install

# Khởi chạy Vite Dev Server
npm run dev
```
> **Admin & Studio Portal**: `http://localhost:5174` (hoặc cổng được Vite phân bổ)

---

### Bảng Điều hướng Cổng Dịch vụ (Service Port Map)

| Ứng dụng / Dịch vụ | Địa chỉ URL mặc định | Mô tả chức năng |
|:---|:---|:---|
| **Backend REST API** | `http://localhost:3000` | NestJS Gateway, Module phân quyền & xác thực |
| **Interactive API Docs** | `http://localhost:3000/api/docs` | Swagger UI documentation & OpenAPI Schema |
| **Learner Web Portal** | `http://localhost:5173` | Không gian thực hành bài lab, tra cứu Series |
| **Admin & Studio Portal**| `http://localhost:5174` | Hàng đợi duyệt bài, Studio soạn Markdown, IAM |
| **PostgreSQL Database** | `localhost:5432` | Lưu trữ định danh, tiến độ bài lab và phân quyền |

---

## 🧪 Kiểm thử & Nghiệm thu Chất lượng (Testing & Quality Verification)

Toàn bộ hệ thống được bảo vệ bởi bộ kiểm thử tự động đa tầng:

```bash
# Backend Test Suite (TSX Node Test Runner - 13 Tests / 6 Suites)
cd MODULE_BE
npm run test
npm run build

# Frontend Learner Test Suite (Vitest + Happy-DOM - 182 Tests / 37 Suites)
cd MODULE_FE
npm run test
npm run build

# Admin Portal Test Suite & Production Build (Vitest - 40 Tests / 5 Suites)
cd MODULE_ADMIN
npm run test
npm run build

# Quét bảo mật lỗ hổng container & dependencies
trivy fs --severity HIGH,CRITICAL .
```

### Bảng Điểm Kiểm thử (Verified Test Scorecard)
- **Backend (`MODULE_BE`)**: **13 / 13** kiểm thử thành công qua 6 test suites (Auth session hashing, ADR-001 grace rotation window, DTO envelope mapping, PGlite grading authority).
- **Frontend (`MODULE_FE`)**: **182 / 182** kiểm thử thành công qua 37 test suites (PGlite WASM Web Worker lifecycle, AST sqlGuard policy, Monaco editor, quiz submission codec).
- **Admin Portal (`MODULE_ADMIN`)**: **40 / 40** kiểm thử thành công qua 5 test suites (Admin review queue state machine, contributor application flow, hierarchical IAM permissions).
- **Tổng số bài kiểm thử**: **235 / 235** kiểm thử vượt qua 100% không phát sinh lỗi.
- **Tốc độ Build**: `MODULE_FE` build trong **<1.0s**, `MODULE_ADMIN` trong **<0.6s**, `MODULE_BE` build NestJS sạch không lỗi kiểu dữ liệu.

---

## 📚 Mục lục Tài liệu Kiến trúc (Documentation Index)

Toàn bộ tài liệu phân tích, kiến trúc và lộ trình phát triển được lưu trữ có phiên bản dưới dạng **Docs-as-Code** trong thư mục [`docs/`](./docs):

- 📄 [`docs/01-proposal.md`](./docs/01-proposal.md): Đề xuất dự án, tầm nhìn sản phẩm và triết lý Series bài Lab IT ngắn hạn.
- 📋 [`docs/03-product-backlog.md`](./docs/03-product-backlog.md): Danh mục Product Backlog, phân rã User Stories và tiêu chí chấp nhận.
- 🗄 [`docs/05-database.md`](./docs/05-database.md): Thiết kế thực thể dữ liệu (ERD), quan hệ bảng và vòng đời bản ghi.
- 🔐 [`docs/07-dynamic-authorization-and-entitlements.md`](./docs/07-dynamic-authorization-and-entitlements.md): Đặc tả phân quyền động, cơ chế Guard và Override quyền hạn.
- 🛡 [`docs/SYSTEM_VERIFICATION_AND_ERROR_REPORT.md`](./docs/SYSTEM_VERIFICATION_AND_ERROR_REPORT.md): Báo cáo nghiệm thu hệ thống, kiểm thử và xử lý rủi ro bảo mật.
- ⚡ [`docs/adr/002-pglite-sql-sandbox.md`](./docs/adr/002-pglite-sql-sandbox.md): Architecture Decision Record cho PGlite In-Browser SQL Sandbox.
- 🔑 [`docs/adr/ADR-001-auth-refresh-rotation.md`](./docs/adr/ADR-001-auth-refresh-rotation.md): Architecture Decision Record cho Auth Refresh Token Rotation.

---

## 👨‍💻 Tác giả & Kiến trúc sư (Lead Architect)

- **Nguyễn Khánh Duy** — *Fullstack Lead & Software Architect*
- GitHub: [@NguyenKhanhDuy2703](https://github.com/NguyenKhanhDuy2703)
- LinkedIn: [Nguyễn Khánh Duy](https://www.linkedin.com/in/nguy%E1%BB%85n-kh%C3%A1nh-duy-4477a2355/)
- Email: [nguyenkhanhduy270304@gmail.com](mailto:nguyenkhanhduy270304@gmail.com)

---

## 📄 Bản quyền (License)

Dự án này được cấp phép theo các điều khoản của [Giấy phép MIT (MIT License)](LICENSE) — xem tệp tin LICENSE để biết thêm chi tiết.

---

<div align="center">
  <sub>Được phát triển với tư duy kỹ thuật hệ thống chuẩn mực và tinh thần liên tục cải tiến.</sub>
</div>
