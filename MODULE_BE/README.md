# MODULE_BE — Backend API & Persistence Core

> Part of the **[study-web](https://github.com/NguyenKhanhDuy2703/study-web)** educational platform.

`MODULE_BE` is the production-ready NestJS backend for `study-web`. It coordinates user authentication, session security (refresh token rotation with grace periods), role-based and dynamic feature-override authorization, curriculum content management, and isolated backend grading of student lab submissions.

---

## 🛠 Tech Stack

- **Framework**: [NestJS 12](https://nestjs.com/) (Express platform)
- **Language**: TypeScript 5+ (Strict mode)
- **Database & ORM**: [PostgreSQL 16](https://www.postgresql.org/) + [Prisma ORM 6](https://www.prisma.io/)
- **Ephemeral Sandbox**: [@electric-sql/pglite](https://pglite.dev/) (Isolated Node WASM grader)
- **Authentication**: Passport.js, JWT, Bcrypt, Google OAuth 2.0
- **API Documentation**: OpenAPI / Swagger (`@nestjs/swagger`) with HTTP Basic Auth in production
- **Security & Hardening**: Helmet, Cookie Parser, Class Validator, Trivy CVE scanned

---

## ✨ Architectural Features

### 1. Refresh Token Rotation with Grace Window ([ADR-001](../docs/adr/ADR-001-auth-refresh-rotation.md))
- Automatic token pair regeneration upon refresh.
- SHA-256 hashed token storage in the `AuthSession` database table.
- 30-second concurrency grace window to prevent false-positive session invalidations caused by concurrent frontend requests.
- Cookie-based authentication via `HttpOnly`, `SameSite=Lax`, and `Secure` headers.

### 2. Dynamic Entitlements & User Feature Overrides ([DOC-07](../docs/07-dynamic-authorization-and-entitlements.md))
- 4 primary roles: `Admin`, `Contributor`, `UserPro`, `User`.
- User-level feature override capability allowing admins to toggle specific permissions per account without mutating global roles.
- `EntitlementsGuard` decorator-driven metadata checks.

### 3. Ephemeral PGlite Submission Grader ([ADR-002](../docs/adr/002-pglite-sql-sandbox.md))
- Untrusted student SQL is never executed against the platform PostgreSQL instance.
- Ephemeral in-memory PGlite instances are instantiated on-the-fly, seeded with authoritative test datasets, executed under timeout limits, diffed against hidden solutions, and discarded.

---

## 🚀 Getting Started

### Prerequisites
- Node.js v20+
- Running PostgreSQL instance (or Docker)

### Installation & Development
```bash
# Navigate to MODULE_BE
cd MODULE_BE

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Set DATABASE_URL, JWT_SECRET, SWAGGER_USER, SWAGGER_PASSWORD

# Apply database schema & seed initial data
npx prisma db push
npx tsx prisma/seed.ts

# Start NestJS development server
npm run start:dev
```

- **API Base URL**: `http://localhost:3000`
- **Swagger Documentation**: `http://localhost:3000/api/docs` *(Protected by HTTP Basic Auth in production)*

---

## 🧪 Testing & Production Build

```bash
# Execute unit and integration tests (TSX test runner - 13 tests across 6 suites)
npm run test

# Compile production bundle
npm run build

# Start production server
npm run start:prod
```
