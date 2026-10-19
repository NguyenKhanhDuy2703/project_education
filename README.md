<div align="center">

**🌐 English** | [🇻🇳 Tiếng Việt](./README.vi.md)

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
  <b>Production-grade hands-on IT learning platform</b> engineered around real-world software projects. Combines client-side sandboxed execution (<b>PGlite WebAssembly PostgreSQL</b>), an enterprise dynamic authorization engine (<b>Dynamic IAM &amp; Feature Overrides</b>), and a multi-stage content lifecycle studio.
</p>

[🎬 Video Showcase &amp; Previews](#video-showcase--interactive-preview) • [📌 Project Overview](#project-overview) • [🏛 System Architecture](#system-architecture) • [✨ Key Innovations](#key-engineering-highlights) • [🛠 Tech Stack](#technology-stack) • [🚀 Quick Start](#monorepo-quick-start) • [🧪 Testing](#testing--quality-verification) • [📚 Docs-as-Code Hub](#docs-as-code-architecture-index) • [👨‍💻 Team](#team--lead-architect)

---

</div>

## 🎬 Video Showcase & Interactive Preview

Experience the platform in action through our high-energy 60-second video short reel, complete 5-minute technical walkthrough, and interactive workspace snapshots:

<div align="center">

<table>
<tr>
<th width="65%" align="center">🖥️ Full Platform Walkthrough (16:9 Video Tour)</th>
<th width="35%" align="center">📱 60-Second Video Short (9:16 Mobile Reel)</th>
</tr>
<tr>
<td align="center" valign="top">
  <a href="https://github.com/NguyenKhanhDuy2703/study-web/releases">
    <img src="./docs/assets/video-preview-banner.svg" alt="study-web 5-Minute Technical Walkthrough Preview" width="100%"/>
  </a>
  <br/>
  <b>Full 5-Minute Technical Tour:</b> Architecture, PGlite WASM, Contributor Studio &amp; Admin IAM.<br/>
  <a href="https://github.com/NguyenKhanhDuy2703/study-web/releases">▶ <b>Watch Full Walkthrough</b></a>
</td>
<td align="center" valign="top">
  <a href="https://github.com/NguyenKhanhDuy2703/study-web/releases">
    <img src="./docs/assets/video-short-preview.svg" alt="study-web 60-Second Video Short Preview" width="100%"/>
  </a>
  <br/>
  <b>60s Quick Sprint:</b> In-browser SQL execution &amp; instant automated diff grading.<br/>
  <a href="https://github.com/NguyenKhanhDuy2703/study-web/releases">▶ <b>Watch 60s Demo Short</b></a>
</td>
</tr>
</table>

</div>

<details>
<summary><b>⏱️ Video Chapters &amp; Timestamp Index</b> <i>(Click to expand)</i></summary>

#### 📱 60-Second Video Short (Fast Lab Sprint)
- `0:00` — Zero-setup monorepo architecture &amp; instant WebAssembly initialization
- `0:15` — Monaco SQL editor and in-browser PostgreSQL 16 execution (PGlite)
- `0:30` — Client-side AST `sqlGuard` policy validation and real-time multiset diffing
- `0:45` — Ephemeral backend re-grading against hidden tests and score award (+50 XP)

#### 🖥️ 5-Minute Technical Walkthrough (End-to-End Tour)
- `0:00` — Project Mission &amp; Pedagogical Framework (Short hands-on IT labs)
- `1:00` — Learner Lab Workspace: In-depth PGlite WASM Web Worker sandbox
- `2:15` — Contributor Studio: Markdown Grammar (SPEC-01) &amp; split live preview
- `3:30` — Admin Control Plane: Multi-stage review queue &amp; dynamic IAM overrides (DOC-07)
- `4:30` — Ephemeral Backend Grading &amp; Security Hardening (ADR-001, ADR-002)

</details>

> [!TIP]
> **Customizing Video Links & Native Playback**: To link to an external video (e.g. YouTube Shorts, Loom, Vimeo) or embed a local recording:
> ```html
> <!-- Standard HTML5 Video Player -->
> <video src="./docs/assets/demo-short.mp4" controls width="100%" poster="./docs/assets/video-preview-banner.svg"></video>
> ```
> *Note: For GitHub README rendering, upload your demo MP4 file to GitHub Releases or Issue attachments and insert the asset URL above.*

---

### 🖥️ Interactive Workspace Triad

The platform provides three specialized interactive workspaces tailored for modern software engineering workflows:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 STUDY-WEB WORKSPACES                                   │
├───────────────────────────────┬───────────────────────────────┬────────────────────────┤
│ 1. Learner Lab Workspace      │ 2. Contributor Studio         │ 3. Admin Control Plane │
├───────────────────────────────┼───────────────────────────────┼────────────────────────┤
│ • In-Browser PGlite WASM DB   │ • Markdown Grammar (SPEC-01)  │ • Multi-Stage Reviews  │
│ • Monaco Code Editor          │ • Live Student Preview Split  │ • Dynamic IAM Engine   │
│ • AST Security Guard & Diff   │ • Preflight Syntax Validator  │ • Feature Overrides    │
│ • Zero Cloud Spin-Up Latency  │ • Test Seed & Solution Matrix │ • Security Audit Logs  │
└───────────────────────────────┴───────────────────────────────┴────────────────────────┘
```

---

## 📌 Project Overview

Traditional online IT learning platforms suffer from passive consumption ("video tutorial hell") and detached theory. **`study-web`** bridges the gap between conceptual understanding and production reality through **focused 15–30 minute hands-on lab sprints** embedded directly within sample software projects.

### Core Pedagogical Pillars

- **Active Practice Over Passive Watching**: Learners write real queries, implement microservices, catch production bugs, and write unit/integration tests directly in their browser.
- **Client-Side Zero-Latency Feedback**: With WebAssembly-powered engines (**PGlite PostgreSQL**), queries run locally inside dedicated Web Workers in under **10ms**, eliminating container spinning cold starts.
- **Dual-Tier Tamper-Proof Grading**: While the client receives instant diagnostic feedback, completion credit is awarded only after the backend spins up an isolated, ephemeral instance to evaluate against hidden test suites and edge cases.
- **Enterprise-Grade Governance**: Built with the operational standards of enterprise SaaS—featuring dynamic role overrides, multi-stage content state machines, and session-bound token rotation.

---

## 🏛 System Architecture

`study-web` follows a **Clean Modular Monolith** architecture with distinct client-tier separation and isolated execution engines:

```mermaid
graph TD
    Client["Client Browser (React 19 + Monaco Editor + In-Browser PGlite WASM Worker)"]
    Nginx["Nginx Reverse Proxy / API Gateway Ingress"]
    NestGateway["NestJS API Gateway (Helmet, CookieParser, CORS, RateLimiter)"]
    
    subgraph Security_Layer["Security & IAM Core"]
        AuthGuard["JWT HttpOnly Cookie Auth Guard"]
        TokenRotation["Refresh Token Rotation Service (ADR-001)"]
        EntitlementsGuard["Dynamic Entitlements & Feature Override Guard (DOC-07)"]
        SwaggerAuth["Swagger Basic Auth Guard (Production Mode)"]
    end

    subgraph Service_Modules["NestJS Business Domain Modules"]
        AuthModule["Auth & Session Management"]
        UserModule["User & Plan Tier Management"]
        LabModule["Lab Series & Execution Service"]
        ReviewModule["Contributor Review Queue & State Machine"]
        GroupsModule["Group-Based Enterprise IAM"]
        AuditModule["Security Audit Logging Service"]
    end

    subgraph Data_Layer["Data & Persistence Tier"]
        Prisma["Prisma ORM v6"]
        Postgres[(Platform PostgreSQL Database)]
        PGliteBackend["Ephemeral PGlite Sandbox (Backend Verification Engine)"]
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

## 📂 Monorepo Structure

```
study-web/
├── MODULE_BE/               # NestJS 12 Backend API & Persistence
│   ├── src/
│   │   ├── modules/         # Auth, Labs, Series, Entitlements, Review, Groups, Audit
│   │   ├── common/          # Guards, Filters, Interceptors, Decorators
│   │   └── prisma/          # Prisma Client Service & Database Migrations
│   ├── prisma/schema.prisma # PostgreSQL Data Model Schema
│   └── test/                # Integration & Unit Test Suites (tsx --test)
│
├── MODULE_FE/               # React 19 Learner Web Application
│   ├── src/
│   │   ├── pages/lab/       # Lab Workspace, Series Hub, Series Detail, Roadmaps
│   │   ├── features/        # Lab runner workers, Monaco editor integrations, PGlite WASM
│   │   └── stores/          # Redux Toolkit slices & TanStack Query cache
│   └── public/              # Static icons, vector assets, and favicon
│
├── MODULE_ADMIN/            # React 19 Admin & Contributor Studio Application
│   ├── src/
│   │   ├── pages/admin/     # Review Queue, Lab Studio, Users, Groups, Audit Logs
│   │   └── features/        # Markdown AST grammar editor, Review state machine
│   └── src/components/ui/   # Radix UI + Tailwind CSS v4 accessible primitives
│
├── docs/                    # Docs-as-Code Architecture Hub
│   ├── adr/                 # Architecture Decision Records (ADR-001, ADR-002)
│   ├── specs/               # Lab Content Contract JSON Schema & Markdown Grammar
│   ├── reports/             # Verification scorecards, Security & Benchmark audits
│   └── workflows/           # 13 Sequence Diagrams & Interaction Flows
└── docker-compose.yml       # Production & Local Database Orchestration
```

---

## ✨ Key Engineering Highlights

### 1. In-Browser WASM Database & Ephemeral Grading ([ADR-002](./docs/adr/002-pglite-sql-sandbox.md))
- **Zero-Latency In-Memory Database**: Each SQL lab spins up an isolated **PGlite 0.5.10** instance running PostgreSQL compiled to WebAssembly inside a dedicated Web Worker.
- **Zero Cloud Spin-Up Cost**: Queries execute in **<10ms** locally in the browser with full PostgreSQL syntax support (CTEs, Window Functions, JSONB, Subqueries).
- **Tamper-Proof Evaluation**: Learner SQL is never executed against the platform PostgreSQL database. For official submissions, the backend initializes an ephemeral PGlite worker, applies the hidden schema and test cases, performs authoritative diffing, and tears down the instance.
- **AST SQL Guard**: Prevents malicious statements and restricts mutations using a single-statement AST validator.

### 2. Dynamic Entitlements & User Feature Overrides ([DOC-07](./docs/07-dynamic-authorization-and-entitlements.md))
- **Multi-Tier RBAC**: Native support for 4 core roles: `Admin`, `Contributor`, `UserPro`, and `User`.
- **Per-User Feature Overrides**: Granular capability flags (e.g., `can_access_beta_labs`, `can_publish_unreviewed`) can be granted or revoked per user account without altering their global system role.
- **Audit Trails**: Every permission mutation, role transition, and override modification is immutably logged with timestamp, operator ID, and IP address.

### 3. Enterprise Auth & Session Lifecycle ([ADR-001](./docs/adr/ADR-001-auth-refresh-rotation.md))
- **Refresh Token Rotation**: Each token refresh issues a new cryptographically secure token pair while invalidating the prior token.
- **SHA-256 Token Fingerprinting**: Refresh tokens are stored strictly as SHA-256 hashes in the database.
- **Concurrency Grace Window**: A 30-second grace window accommodates network jitter and concurrent multi-tab browser requests without falsely triggering session revocation.
- **XSS & CSRF Defense**: Authentication tokens are strictly transmitted via `HttpOnly`, `SameSite=Lax`, and `Secure` cookies.

### 4. Multi-Stage Content Lifecycle Studio
- **Rigid State Machine**:
  $$\text{Draft} \longrightarrow \text{Submitted} \longrightarrow \text{In Review} \genfrac{}{}{0pt}{}{\nearrow \text{Approved} \longrightarrow \text{Published}}{\searrow \text{Changes Requested} \longrightarrow \text{Draft}}$$
- **Formal Content Grammar ([SPEC-01](./docs/specs/lab-markdown-v1.md))**: Custom Markdown AST grammar for curriculum authoring with preflight validation gates.
- **Strict Role Separation**: Contributors author and iterate; only designated Admins can approve and trigger public release.

---

## 🛠 Technology Stack

| Layer | Technology | Version | Architectural Role |
|:---|:---|:---:|:---|
| **Learner Frontend** | React, TypeScript, Vite | 19.2 / 8.3 | High-performance SPA with client-side routing & instant HMR |
| **Admin Portal** | React, TypeScript, Vite | 19.2 / 8.3 | Dedicated portal for content reviewers and system administrators |
| **Styling & UI Design** | Tailwind CSS v4, Radix UI, Lucide | 4.3 | Responsive modern UI conforming to WCAG 2.1 AA accessibility |
| **Code Editor** | Monaco Editor | 4.7 | Visual Studio Code-grade editing experience directly in browser |
| **In-Browser Engine** | PGlite (ElectricSQL WASM) | 0.5.10 | True PostgreSQL WASM database inside client Web Workers |
| **State & Cache** | TanStack React Query, Redux Toolkit | 5.104 / 2.12 | Server-state caching, cross-tab synchronization, and optimistic UI |
| **Backend API Gateway** | NestJS, Express, TypeScript | 12.0 / 5.0 | Clean modular monolith with dependency injection and DTO validation |
| **ORM & Data Layer** | Prisma ORM, PostgreSQL | 6.19 / 16+ | Type-safe database queries, declarative migrations, schema relations |
| **Auth & Security** | Passport.js, JWT, Bcrypt, Helmet | Latest | Cookie-based HttpOnly authentication, SHA-256 token rotation |
| **DevOps & Auditing** | Docker, Compose, Trivy | Latest | Multi-stage lightweight containers, automated CVE vulnerability scanning |

---

## 🚀 Monorepo Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v20.x or later recommended)
- [Docker](https://www.docker.com/) & Docker Compose
- [Git](https://git-scm.com/)

### 1. Clone & Set Up Database
```bash
# Clone the repository
git clone https://github.com/NguyenKhanhDuy2703/study-web.git
cd study-web

# (Optional) Spin up local PostgreSQL container
docker run --name studyweb-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=studyweb_db \
  -p 5432:5432 -d postgres:16-alpine
```

### 2. Launch Backend (`MODULE_BE`)
```bash
cd MODULE_BE

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Ensure DATABASE_URL="postgresql://postgres:postgres@localhost:5432/studyweb_db"

# Sync Prisma Schema & Apply Seed Data
npx prisma db push
npm run prisma:seed # (or npx tsx prisma/seed.ts)

# Start NestJS in Development Mode
npm run start:dev
```
> **Backend Gateway**: `http://localhost:3000`  
> **Swagger API Docs**: `http://localhost:3000/api/docs` *(Protected by Basic Auth in production)*

### 3. Launch Learner Frontend (`MODULE_FE`)
```bash
# Open a new terminal
cd MODULE_FE

# Install dependencies
npm install

# Start Vite Dev Server
npm run dev
```
> **Learner Web Application**: `http://localhost:5173`

### 4. Launch Admin & Contributor Portal (`MODULE_ADMIN`)
```bash
# Open a new terminal
cd MODULE_ADMIN

# Install dependencies
npm install

# Start Vite Dev Server
npm run dev
```
> **Admin & Studio Portal**: `http://localhost:5174` (or assigned Vite port)

---

### Service Port Map

| Service / Application | Default URL | Description |
|:---|:---|:---|
| **Backend REST API** | `http://localhost:3000` | NestJS Gateway, Authentication, Entitlements |
| **Interactive API Docs** | `http://localhost:3000/api/docs` | Swagger UI documentation & OpenAPI Schema |
| **Learner Web Portal** | `http://localhost:5173` | Interactive Lab Workspaces, Series Hub, Roadmaps |
| **Admin & Studio Portal**| `http://localhost:5174` | Review Queue, Markdown Studio, IAM, Audit Logs |
| **PostgreSQL Database** | `localhost:5432` | Relational persistent store for identities & curriculum |

---

## 🧪 Testing & Quality Verification

The codebase maintains strict automated test coverage across both unit, integration, and UI workflows:

```bash
# Backend Test Suite (TSX Node Test Runner - 13 Tests across 6 Suites)
cd MODULE_BE
npm run test
npm run build

# Frontend Learner Test Suite (Vitest + Happy-DOM - 182 Tests across 37 Suites)
cd MODULE_FE
npm run test
npm run build

# Admin Portal Test Suite & Production Build (Vitest - 40 Tests across 5 Suites)
cd MODULE_ADMIN
npm run test
npm run build

# Vulnerability & Container Scanning
trivy fs --severity HIGH,CRITICAL .
```

### Verified Test Scorecard
- **Backend (`MODULE_BE`)**: **13 / 13** integration & unit tests passing across 6 suites (Auth session hashing, ADR-001 grace rotation window, DTO envelope mapping, PGlite grading authority).
- **Frontend (`MODULE_FE`)**: **182 / 182** tests passing across 37 suites (PGlite WASM Web Worker lifecycle, AST sqlGuard policy, Monaco editor, quiz submission codec).
- **Admin Portal (`MODULE_ADMIN`)**: **40 / 40** tests passing across 5 suites (Admin review queue state machine, contributor application flow, hierarchical IAM permissions).
- **Total Test Suite**: **235 / 235** automated tests passing monorepo-wide (100% pass rate).
- **Build Performance**: `MODULE_FE` builds in **<1.0s**, `MODULE_ADMIN` in **<0.6s**, and `MODULE_BE` passes NestJS production compilation cleanly.

---

## 📚 Docs-as-Code Architecture Index

All architectural designs, system RFCs, and governance roadmaps are committed to version control in [`docs/`](./docs):

| Document Code | Document Title | Version | Path |
|:---|:---|:---:|:---|
| **DOC-01** | Project Proposal & Pedagogical Vision | 1.1 | [`docs/01-proposal.md`](./docs/01-proposal.md) |
| **DOC-03** | Product Backlog & Acceptance Criteria | 1.1 | [`docs/03-product-backlog.md`](./docs/03-product-backlog.md) |
| **DOC-05** | Database Design & Entity Relationship Diagram | 1.1 | [`docs/05-database.md`](./docs/05-database.md) |
| **DOC-06** | Workflows Hub & Sequence Flowcharts (13 Flows) | 1.2 | [`docs/workflows/README.md`](./docs/workflows/README.md) |
| **DOC-07** | Dynamic Authorization & Entitlements Specification | 1.0 | [`docs/07-dynamic-authorization-and-entitlements.md`](./docs/07-dynamic-authorization-and-entitlements.md) |
| **DOC-08** | Contributor, Admin Review & Group IAM Roadmap | 1.1 | [`docs/08-contributor-admin-iam-sprint-roadmap.md`](./docs/08-contributor-admin-iam-sprint-roadmap.md) |
| **DOC-11** | Admin vs Contributor Separation & User Management | 1.2 | [`docs/11-admin-contributor-separation-and-user-crud.md`](./docs/11-admin-contributor-separation-and-user-crud.md) |
| **ADR-001** | Architecture Decision Record: Refresh Token Rotation | 1.0 | [`docs/adr/ADR-001-auth-refresh-rotation.md`](./docs/adr/ADR-001-auth-refresh-rotation.md) |
| **ADR-002** | Architecture Decision Record: In-Browser PGlite Sandbox | 1.0 | [`docs/adr/002-pglite-sql-sandbox.md`](./docs/adr/002-pglite-sql-sandbox.md) |
| **SPEC-01** | Markdown Block Grammar Specification V1 | 1.0 | [`docs/specs/lab-markdown-v1.md`](./docs/specs/lab-markdown-v1.md) |
| **SPEC-02** | Lab Content Contract Envelope V1 JSON Schema | 1.0 | [`docs/specs/lab-content-contract-v1.json`](./docs/specs/lab-content-contract-v1.json) |
| **REP-01** | Performance & Web Worker Latency Benchmark Report | 1.0 | [`docs/reports/lab-upgrade-performance.md`](./docs/reports/lab-upgrade-performance.md) |
| **REP-02** | Security Audit & Container Hardening Report | 1.0 | [`docs/reports/lab-upgrade-security.md`](./docs/reports/lab-upgrade-security.md) |
| **REP-03** | Release Readiness Audit & Workstream Sign-off | 1.0 | [`docs/reports/release-readiness-audit.md`](./docs/reports/release-readiness-audit.md) |

---

## 👨‍💻 Team & Lead Architect

**Nguyen Khanh Duy** — *Fullstack Lead & Software Architect*  
Leading the architecture, core NestJS backend, PGlite WebAssembly sandbox, and dynamic authorization engine.

- 🌐 **GitHub**: [@NguyenKhanhDuy2703](https://github.com/NguyenKhanhDuy2703)  
- 💼 **LinkedIn**: [Nguyễn Khánh Duy](https://www.linkedin.com/in/nguy%E1%BB%85n-kh%C3%A1nh-duy-4477a2355/)  
- ✉️ **Email**: [nguyenkhanhduy270304@gmail.com](mailto:nguyenkhanhduy270304@gmail.com)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) — see the LICENSE file for details.

<div align="center">
  <sub>Built with engineering rigor, zero-latency feedback loops, and a passion for practical developer education.</sub>
</div>
