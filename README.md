<div align="center">

**English** | [Tiếng Việt](./README.vi.md)

---

# study-web

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
  <b>Production-grade hands-on IT learning platform</b> engineered around real-world software engineering projects. Integrates client-side sandboxed execution (<b>PGlite WebAssembly PostgreSQL</b>), an enterprise dynamic authorization engine (<b>Dynamic IAM &amp; Feature Overrides</b>), and a multi-stage content lifecycle studio.
</p>

[Overview](#overview) • [Product Demonstration](#product-demonstration) • [System Architecture](#system-architecture) • [Interactive Workspaces](#interactive-workspaces) • [Key Technical Highlights](#key-technical-highlights) • [Technology Stack](#technology-stack) • [Quick Start](#quick-start) • [Verification](#automated-testing--quality-assurance) • [Docs-as-Code](#documentation-index)

---

</div>

## Product Demonstration

The following recording demonstrates the real-time execution lifecycle of the **study-web** in-browser lab workspace:

<div align="center">

<img src="./docs/assets/demo-5s.gif" alt="study-web Real-time In-Browser SQL Lab & PGlite WASM Execution Demo" width="100%" />

<p align="center">
  <sub><b>Figure 1:</b> Live execution sequence inside the Learner Workspace — Monaco SQL editing, AST syntax guard policy verification, sub-10ms PGlite WebAssembly database execution, automated multiset diff grading, and authoritative score unlock.</sub>
</p>

<p align="center">
  <a href="./docs/assets/demo-5s.mp4"><b>Direct MP4 Download (H.264)</b></a> &bull;
  <a href="./docs/assets/demo-5s.webm"><b>Direct WebM Download</b></a> &bull;
  <a href="./docs/assets/demo-poster.png"><b>High-Resolution Poster Frame</b></a>
</p>

</div>

<details>
<summary><b>Technical Execution Sequence (0:00 – 0:05)</b> <i>(Click to expand)</i></summary>

- **0.0s – 1.6s**: Student constructs query in embedded Monaco Editor with SQL syntax highlighting and auto-completion.
- **1.6s – 2.4s**: On execution trigger, the client-side Abstract Syntax Tree (AST) guard (`sqlGuard.ts`) verifies statement safety and ensures read-only isolation.
- **2.4s – 3.8s**: In-browser **PGlite 0.5.10** (PostgreSQL 16 compiled to WebAssembly) executes the query against local seed tables within a dedicated Web Worker in **7.8ms**, eliminating cloud container cold starts.
- **3.8s – 5.0s**: Automated diff grader compares execution result sets against expected schemas, confirms 100% multiset parity, and triggers authoritative score allocation (+50 XP).

</details>

---

## Overview

Traditional online IT education is often hindered by passive video consumption and disconnected theoretical exercises. **`study-web`** addresses this friction through **focused 15–30 minute hands-on lab sprints** contextualized within functional software architectures.

### Core Architectural Principles

- **Active Practice Over Passive Consumption**: Learners interact with authentic codebases, solve schema migration challenges, write queries, fix regression bugs, and verify test suites directly in the browser.
- **Sub-10ms Client-Side Feedback**: Utilizing WebAssembly engines (**PGlite PostgreSQL**), queries execute inside isolated browser Web Workers with near-zero latency, circumventing cloud server provisioning costs and cold starts.
- **Dual-Tier Tamper-Proof Evaluation**: Diagnostic feedback runs instantly on the client, while final grading is authoritatively validated against hidden test suites by an isolated backend execution worker before credit is awarded.
- **Enterprise Governance & IAM**: Engineered to SaaS production standards, featuring fine-grained role-based access control, per-user feature overrides, multi-stage content review workflows, and session-bound token rotation.

---

## System Architecture

`study-web` is built as a **Clean Modular Monolith** with clear separation between client workspaces, ingress routing, domain business logic, and isolated sandboxed execution tiers:

```mermaid
graph TD
    Client["Client Browser (React 19 + Monaco Editor + PGlite WASM Web Worker)"]
    Nginx["Nginx Reverse Proxy / Ingress Gateway"]
    NestGateway["NestJS API Gateway (Helmet, CookieParser, CORS, RateLimiting)"]
    
    subgraph Security_Layer["Security & IAM Core"]
        AuthGuard["JWT HttpOnly Cookie Auth Guard"]
        TokenRotation["Refresh Token Rotation Service (ADR-001)"]
        EntitlementsGuard["Dynamic Entitlements & Feature Override Guard (DOC-07)"]
        SwaggerAuth["Swagger Basic Auth Guard (Production Mode)"]
    end

    subgraph Service_Modules["NestJS Business Domain Modules"]
        AuthModule["Auth & Session Management"]
        UserModule["User & Plan Tier Management"]
        LabModule["Lab Series & Curriculum Service"]
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

## Interactive Workspaces

The platform provides three purpose-built interactive workspaces tailored for specific engineering personas:

| Workspace | Persona | Capabilities | Primary Technologies |
|:---|:---|:---|:---|
| **Learner Lab Workspace** | Students & Engineers | Interactive Monaco code editor, sub-10ms in-browser PGlite WASM database, live AST syntax policy checking, instant multiset diff grading. | React 19, Monaco Editor, PGlite WASM, TanStack Query |
| **Contributor Studio** | Content Authors | Curriculum authoring with formal Markdown Grammar (SPEC-01), split-screen student view preview, seed and test schema validator. | React 19, Tailwind CSS v4, Marked AST parser |
| **Admin Control Plane** | System Admins & Leads | Multi-stage review queue state machine, dynamic user and group IAM overrides, audit log inspection, and plan tier administration. | React 19, Radix UI primitives, Lucide, Recharts |

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

## Monorepo Layout

```
study-web/
├── MODULE_BE/               # NestJS 12 Backend API & Persistence Layer
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

## Key Technical Highlights

### 1. In-Browser WASM Database & Ephemeral Grading ([ADR-002](./docs/adr/002-pglite-sql-sandbox.md))
- **Isolated In-Memory Database**: Each SQL lab instantiates a **PGlite 0.5.10** database running compiled PostgreSQL in a client-side Web Worker.
- **Zero Cloud Compute Overhead**: Queries execute in **under 10ms** locally in the browser with full PostgreSQL syntax support (CTEs, Window Functions, JSONB, Subqueries).
- **Tamper-Proof Evaluation**: Learner SQL queries never hit the production PostgreSQL database. For authoritative verification, the backend spawns an ephemeral PGlite instance, applies hidden validation assertions, calculates multiset differences, and tears down immediately.
- **AST SQL Guard**: Enforces single-statement structure and blocks mutation operations (`DROP`, `ALTER`, `TRUNCATE`) via client and server AST inspection.

### 2. Dynamic Entitlements & User Feature Overrides ([DOC-07](./docs/07-dynamic-authorization-and-entitlements.md))
- **Hierarchical RBAC**: First-class support for `Admin`, `Contributor`, `UserPro`, and `User`.
- **Per-User Feature Overrides**: Granular capability toggles (such as `can_access_beta_labs` or `can_publish_unreviewed`) can be applied directly to individual user accounts without modifying system-wide roles.
- **Immutable Audit Logging**: Every privilege escalation, role modification, and override change is permanently recorded with user ID, actor ID, timestamp, and client IP.

### 3. Enterprise Auth & Session Lifecycle ([ADR-001](./docs/adr/ADR-001-auth-refresh-rotation.md))
- **Refresh Token Rotation**: Every token refresh cycle invalidates the previous refresh token and generates a new cryptographically bound pair.
- **SHA-256 Token Hashing**: Refresh tokens are stored strictly as SHA-256 hashes in the relational database.
- **Concurrency Grace Window**: A 30-second overlap window protects against race conditions caused by network latency or multi-tab browser requests.
- **XSS & CSRF Hardening**: Authentication tokens are strictly transmitted via `HttpOnly`, `SameSite=Lax`, and `Secure` cookies.

### 4. Multi-Stage Content Lifecycle State Machine
- **Formal Workflow Engine**:
  $$\text{Draft} \longrightarrow \text{Submitted} \longrightarrow \text{In Review} \genfrac{}{}{0pt}{}{\nearrow \text{Approved} \longrightarrow \text{Published}}{\searrow \text{Changes Requested} \longrightarrow \text{Draft}}$$
- **Custom Markdown Grammar ([SPEC-01](./docs/specs/lab-markdown-v1.md))**: Structured curriculum format enabling embedded schema definitions, starter code snippets, and automated test seed blocks.
- **Separation of Concerns**: Contributors build curriculum in the Studio; designated Admins evaluate submissions and manage production publication.

---

## Technology Stack

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

## Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v20.x or later recommended)
- [Docker](https://www.docker.com/) & Docker Compose
- [Git](https://git-scm.com/)

### 1. Clone & Set Up Database
```bash
# Clone the repository
git clone https://github.com/NguyenKhanhDuy2703/study-web.git
cd study-web

# Spin up local PostgreSQL container
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
npm run prisma:seed

# Start NestJS in Development Mode
npm run start:dev
```
> **Backend Gateway**: `http://localhost:3000`  
> **Swagger API Docs**: `http://localhost:3000/api/docs` *(Protected by Basic Auth in production)*

### 3. Launch Learner Frontend (`MODULE_FE`)
```bash
cd ../MODULE_FE

# Install dependencies
npm install

# Start Vite Dev Server
npm run dev
```
> **Learner Web Application**: `http://localhost:5173`

### 4. Launch Admin & Contributor Portal (`MODULE_ADMIN`)
```bash
cd ../MODULE_ADMIN

# Install dependencies
npm install

# Start Vite Dev Server
npm run dev
```
> **Admin & Studio Portal**: `http://localhost:5174`

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

## Automated Testing & Quality Assurance

The codebase enforces strict automated test verification across unit, integration, and UI workflows:

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

## Documentation Index

All architectural designs, system specifications, and governance roadmaps are committed to version control in [`docs/`](./docs):

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

## Author & Maintainer

**Nguyen Khanh Duy** — *Fullstack Lead & Software Architect*  
Lead architect of the core NestJS backend, PGlite WebAssembly sandbox, and dynamic authorization engine.

- **GitHub**: [@NguyenKhanhDuy2703](https://github.com/NguyenKhanhDuy2703)  
- **LinkedIn**: [Nguyễn Khánh Duy](https://www.linkedin.com/in/nguy%E1%BB%85n-kh%C3%A1nh-duy-4477a2355/)  
- **Email**: [nguyenkhanhduy270304@gmail.com](mailto:nguyenkhanhduy270304@gmail.com)

---

## License

This project is licensed under the [MIT License](LICENSE) — see the [LICENSE](LICENSE) file for details.

<div align="center">
  <sub>Built with engineering rigor, zero-latency feedback loops, and an emphasis on practical developer education.</sub>
</div>
