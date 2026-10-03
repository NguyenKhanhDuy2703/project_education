# Study-Web — Change Report

> **Ngày thực hiện:** 2026-10-03  
> **Phạm vi:** CI/CD · Backend Auth · FE Login · Config & Swagger  

---

## Tóm tắt công việc

| Task | Trạng thái | Mô tả ngắn |
|------|-----------|-----------|
| 1 — Fix CI | ✅ Done | Rename pipeline, xóa path/step thừa từ project RenderCV cũ |
| 2 — Login (account + Google) | ✅ Done | Thêm Google OAuth strategy BE + callback page FE |
| 3 — Config / Swagger / No Hardcode | ✅ Done | Xóa tất cả giá trị hardcode, đưa về env vars |
| 4 — Report | ✅ Done | Tài liệu này |

---

## Task 1 — Fix CI/CD Workflows

### Vấn đề phát hiện

| File | Vấn đề |
|------|--------|
| `main.yml` | Tên pipeline: **"RenderCV Unified CI/CD Pipeline"** (sai project) |
| `main.yml` | `paths` filter chứa `packages/cv-contracts/**` — thư mục này không tồn tại trong repo |
| `_be-test-worker.yml` | Step `"Test Shared CV Contracts"` chạy `npm --prefix ../packages/cv-contracts test` — sẽ fail vì package không có |

### Thay đổi

```diff
# main.yml — line 1
- name: RenderCV Unified CI/CD Pipeline
+ name: StudyIT CI/CD Pipeline
```

- Xóa `- "packages/cv-contracts/**"` khỏi tất cả `paths` trigger (PR + push + paths-filter).
- Xóa step `Test Shared CV Contracts` trong `_be-test-worker.yml`.

---

## Task 2 — Login (Account + Google OAuth)

### FE — Đã có sẵn (giữ nguyên)

- `LoginForm.tsx` — form đăng nhập email/SĐT + password, show/hide password, Remember Me, mock mode
- `useAuth.ts` + `auth.api.ts` — mutation qua React Query, dispatch Redux store
- `AuthLayout.tsx` — card layout đẹp với brand StudyIT

### FE — Bổ sung

| File | Thay đổi |
|------|---------|
| `features/auth/components/LoginForm.tsx` | Fix `handleGoogle()` dùng `VITE_API_URL` với path `/api/v1` đúng |
| `pages/auth/GoogleCallbackPage.tsx` | **Tạo mới** — nhận `?token=` từ backend redirect, dispatch `setToken + setUser`, navigate `/dashboard` |
| `routes/index.tsx` | Thêm import + route `/auth/callback` (standalone, không có layout) |
| `.env.example` | Thêm `VITE_API_URL` và `VITE_USE_MOCK` |

### BE — Bổ sung

| File | Thay đổi |
|------|---------|
| `configs/google.config.ts` | **Tạo mới** — namespace `google.*` từ env vars |
| `modules/auth/google.strategy.ts` | **Tạo mới** — `passport-google-oauth20` strategy |
| `modules/users/users.service.ts` | Thêm `findByGoogleId()` |
| `modules/auth/auth.controller.ts` | Thêm `GET /auth/google` và `GET /auth/google/callback` |
| `modules/auth/auth.module.ts` | Thêm `GoogleStrategy` vào providers |
| `app.module.ts` | Load `googleConfig` vào ConfigModule |
| `package.json` | Thêm `passport-google-oauth20` + `@types/passport-google-oauth20` |

### OAuth Flow

```
Browser → GET /api/v1/auth/google
         ↓ (Passport redirect)
Google Consent Screen
         ↓ (user approves)
GET /api/v1/auth/google/callback
         ↓ (GoogleStrategy.validate)
DB: findOrCreate user
         ↓ (generateTokens)
Set HttpOnly cookie + redirect
→ http://localhost:5173/auth/callback?token=<JWT>
         ↓ (GoogleCallbackPage.tsx)
dispatch setToken → getCurrentUser → setUser → navigate /dashboard
```

> **Lưu ý setup:** Cần tạo Google OAuth App tại console.cloud.google.com, thêm
> `http://localhost:3000/api/v1/auth/google/callback` vào **Authorized redirect URIs**.

---

## Task 3 — Config, Swagger, No Hardcode

### Tổng hợp các giá trị hardcode đã xử lý

| Vị trí | Hardcode cũ | Fix |
|--------|------------|-----|
| `jwt.strategy.ts` L25 | `'your_super_secret_jwt_key_2026_change_in_production'` | `configService.getOrThrow('JWT_SECRET')` — ném lỗi nếu thiếu |
| `auth.service.ts` L113 | `'15m'` | `configService.get('jwt.accessTokenExpiresIn')` |
| `auth.service.ts` L117 | `'7d'` | `configService.get('jwt.refreshTokenExpiresIn')` |
| `auth.controller.ts` | `process.env.NODE_ENV === 'production'` | `configService.get('app.env') === 'production'` |
| `auth.controller.ts` | `maxAge: 15 * 60 * 1000` | `parseDurationMs(configService.get('jwt.accessTokenExpiresIn'))` |
| `app.module.ts` | `jwt?.secret \|\| process.env.JWT_SECRET` | `jwt?.secret` (env validation đủ) |
| `main.ts` | `\|\| 'http://localhost:5173'` và các fallback Swagger | Lấy trực tiếp từ config namespaces |
| `.env` | `MONGO_URI` thừa, `DB_HOST/PORT/USERNAME/PASSWORD` thừa | Đã xóa |

### Swagger bổ sung

- Thêm `.addCookieAuth('accessToken')` — hiển thị cookie auth scheme trong Swagger UI.
- Title / description / version / prefix đọc 100% từ env qua `swagger.*` namespace.

### Biến env mới

| Biến | Default | Mô tả |
|------|---------|-------|
| `ACCESS_TOKEN_EXPIRES_IN` | `15m` | Thời hạn access token |
| `REFRESH_TOKEN_EXPIRES_IN` | `7d` | Thời hạn refresh token |
| `GOOGLE_CLIENT_ID` | — | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | — | Google OAuth client secret |
| `GOOGLE_CALLBACK_URL` | — | Backend callback URL sau Google redirect |

---

## Danh sách files thay đổi

### CI/CD

| File | Loại |
|------|------|
| `.github/workflows/main.yml` | Modified |
| `.github/workflows/_be-test-worker.yml` | Modified |

### Backend (MODULE_BE)

| File | Loại |
|------|------|
| `src/configs/jwt.config.ts` | Modified |
| `src/configs/google.config.ts` | New |
| `src/configs/env.validation.ts` | Modified |
| `src/app.module.ts` | Modified |
| `src/main.ts` | Modified |
| `src/modules/auth/auth.controller.ts` | Modified |
| `src/modules/auth/auth.service.ts` | Modified |
| `src/modules/auth/auth.module.ts` | Modified |
| `src/modules/auth/jwt.strategy.ts` | Modified |
| `src/modules/auth/google.strategy.ts` | New |
| `src/modules/users/users.service.ts` | Modified |
| `.env` | Modified |

### Frontend (MODULE_FE)

| File | Loại |
|------|------|
| `src/features/auth/components/LoginForm.tsx` | Modified |
| `src/pages/auth/GoogleCallbackPage.tsx` | New |
| `src/routes/index.tsx` | Modified |
| `.env.example` | Modified |

---

## Việc cần làm tiếp theo

- [ ] Tạo Google OAuth App, điền `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` thực vào `.env`
- [ ] Thêm `http://localhost:3000/api/v1/auth/google/callback` vào **Authorized redirect URIs** trên Google Console
- [ ] Xem xét cho phép `phone` nullable trong Prisma schema cho user đăng ký qua Google  
  → Chạy `prisma migrate dev --name allow-null-phone`
- [ ] Thêm `VITE_API_URL=http://localhost:3000/api/v1` vào `MODULE_FE/.env.local`
- [ ] Kiểm tra `npm test` trên BE sau khi xóa step cv-contracts
