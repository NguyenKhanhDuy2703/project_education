---
doc_type: workflow
title: Account Lifecycle, Profile, Session Recovery, and Preferences
project: study-web
version: "1.0"
version_source: repository
authors:
  - {name: StudyWeb engineering team, role: implementation owner}
scope: MODULE_FE and MODULE_BE authentication, account profile, theme, and locale behavior
date: 2026-10-24
source_file: Current repository routes, auth controllers/services, stores, and preference providers
status: final
language: en
approved_by: []
related_docs: [01-auth-login-to-home.md, 13-contributor-onboarding-and-application.md]
---

# Account Lifecycle, Profile, Session Recovery, and Preferences

## 1. Document Information

| Attribute | Detail |
|---|---|
| Document | Account Lifecycle, Profile, Session Recovery, and Preferences |
| Version | 1.0 |
| Owner | StudyWeb engineering team (inferred from repository) |
| Scope | Public authentication, protected-session lifecycle, read-only profile, theme, English-only locale |
| Date | 2026-10-24 |
| Source | Current `MODULE_FE` and `MODULE_BE` implementation |

## 2. Content

### 2.1. TL;DR and coverage

| Feature | Status | Entry point | Outcome |
|---|---|---|---|
| Email/phone registration | `PARTIAL` | `/register` | Backend creates a standard user; frontend currently expects an auth token that registration does not return. |
| Password login | `IMPLEMENTED` | `/login` | Active user receives an access token plus HttpOnly access/refresh cookies. |
| Google OAuth | `IMPLEMENTED` with security debt | `/auth/google` → `/auth/callback` | User is created/resolved, tokens issued, profile hydrated, then browser redirects home. |
| Silent refresh | `IMPLEMENTED` | Axios interceptor and proactive timer | One refresh request is shared across concurrent 401 responses; failed credentials clear local auth state. |
| Logout | `IMPLEMENTED` | Header/dashboard action | Server session is revoked, cookies cleared, and client auth state removed. |
| Forgot password | `PLACEHOLDER` | `/forgot-password` | Client validates an email and simulates success; no reset endpoint or email is sent. |
| Profile | `PARTIAL` | `/user/dashboard/profile` | Identity, role, contributor state, and preferences are displayed; profile fields are not editable. |
| Change password | `IMPLEMENTED` API | `POST /auth/change-password` | Authenticated user verifies current password and replaces it; learner profile has no direct form. |
| Theme | `IMPLEMENTED` | Profile/header controls | `light`, `dark`, or `system` persists in `localStorage`. |
| Locale | `IMPLEMENTED` as English-only | Global i18n provider | Legacy Vietnamese setting is normalized to `en`; only English is selectable. |

### 2.2. Actors and responsibilities

| Actor | Responsibility |
|---|---|
| Guest | Register, sign in, start Google OAuth, or open the reset-password placeholder. |
| Authenticated user | Maintain an active session, view profile, change theme, and log out. |
| Frontend auth layer | Persist access token/user, attach bearer token, coordinate refresh, and protect routes. |
| Backend auth layer | Validate credentials/status, hash passwords, issue/rotate tokens, manage sessions and cookies. |
| Google | Authenticate an external identity and return it through Passport OAuth. |

### 2.3. Registration flow (`PARTIAL`)

**Trigger:** guest submits name, email, phone, and password on `/register`.

1. `RegisterForm` validates required input and calls `authApi.register()`.
2. `POST /auth/register` rejects an existing email or phone.
3. Backend hashes the password with Bcrypt and creates a user with forced role `user`; client input cannot escalate privilege.
4. Backend returns a success message and sanitized user object.
5. Current frontend mutation calls `setAuth()` as if an `accessToken` were returned.

**Truth boundary:** registration does not issue tokens or cookies in the current controller/service. The expected post-registration state is therefore inconsistent between FE and BE and must not be described as automatic login until fixed.

**Errors:** duplicate email/phone returns `400`; form/API errors remain on the registration screen.

### 2.4. Password login, protected navigation, and logout (`IMPLEMENTED`)

```mermaid
sequenceDiagram
  actor User
  participant FE as LoginForm / Redux
  participant API as AuthController
  participant DB as User + AuthSession
  User->>FE: Submit email/phone + password
  FE->>API: POST /auth/login
  API->>DB: Resolve user; check active; verify Bcrypt hash
  API->>DB: Create hashed refresh-token session
  API-->>FE: accessToken + user; HttpOnly cookies
  FE->>FE: Persist access token and user
  FE-->>User: Navigate to requested protected route
  User->>FE: Logout
  FE->>API: POST /auth/logout with cookies
  API->>DB: Revoke matching session
  API-->>FE: Clear access/refresh cookies
  FE->>FE: Clear Redux and localStorage auth data
```

Alternative outcomes:

- Missing/invalid credentials or missing local password: `401 Invalid credentials`.
- Suspended/deactivated user: `401 Account is deactivated`.
- `ProtectedRoute` redirects unauthenticated users to login; contributor routes additionally require contributor capability.
- Access token is held in Redux and `localStorage`; refresh token is cookie-first and removed from local storage by current reducers.

### 2.5. Session refresh and multi-request recovery (`IMPLEMENTED`)

1. The auth hook schedules refresh approximately 60 seconds before JWT expiry, with a five-second minimum delay.
2. Returning to a visible browser tab triggers refresh when expiry is within 60 seconds.
3. For a non-auth API `401`, the Axios interceptor marks the request once and asks `RefreshCoordinator` for a shared refresh operation.
4. `POST /auth/refresh` reads the HttpOnly refresh cookie first, validates its hashed session, rotates tokens, and preserves a short previous-token grace path for concurrent callers.
5. Frontend stores the new access token and retries the original request.
6. Only an explicit refresh `401/403` logs the user out locally; transient network errors are returned without destroying the session.

UI states: ordinary refresh is silent; terminal expiry is represented by cleared auth state and the session-expired/protected-route experience.

### 2.6. Google OAuth (`IMPLEMENTED` with open security issue)

1. Browser opens `GET /auth/google`; Passport redirects to Google.
2. Google returns to `GET /auth/google/callback`.
3. Backend generates tokens, stores HttpOnly cookies, selects the configured frontend URL, and redirects to `/auth/callback`.
4. `GoogleCallbackPage` reads the access token, stores it, calls `GET /auth/me`, hydrates the user, and navigates home.
5. If profile loading fails, it attempts a JWT payload fallback; an unusable token returns the user to login.

**Open issue:** the backend also places `refreshToken` in the redirect query string. The frontend immediately removes refresh-token storage, but URL exposure remains avoidable security debt; OAuth should rely on the HttpOnly cookie and omit that query parameter.

### 2.7. Password and profile management

**Change password (`IMPLEMENTED` API):** authenticated caller sends current and new password to `POST /auth/change-password`; backend verifies the current hash, rejects reuse/invalid input according to DTO/service rules, hashes the replacement, and updates the account.

**Forgot password (`PLACEHOLDER`):** `/forgot-password` validates email format, waits 600 ms, and displays a privacy-preserving “if an account exists” message. It does not call the backend, create a reset token, or send mail.

**Profile (`PARTIAL`):** `/user/dashboard/profile` reads the Redux user hydrated from `GET /auth/me`. It displays identity, role, contributor status, access summary, and theme preference. There is no profile-update endpoint invocation, avatar upload, email verification action, or phone editing flow on this page.

### 2.8. Theme and language preferences

| Preference | Persistence | Resolution | Failure behavior |
|---|---|---|---|
| Theme | `localStorage.study_theme` | Explicit light/dark or `prefers-color-scheme` for system | Storage failure is ignored; UI remains usable. |
| Locale | `localStorage.study_locale` | English only; `vi` is sanitized to `en` | Missing translations fall back to English, then to the translation key. |

No backend rows are written for these preferences; they are device/browser-local.

### 2.9. Data effects, authorization, and observability

| Operation | Authorization | Persistent effect | Audit/telemetry |
|---|---|---|---|
| Register | Public | Creates `User` with hashed password and role `user` | Application errors only; no dedicated audit event shown. |
| Login | Public | Creates/updates token-session records | No user-facing login history. |
| Refresh | Valid refresh token | Rotates hashed session tokens | Concurrency characterized by backend tests. |
| Logout | Cookie/body token when present | Revokes matching session | No admin audit entry. |
| Change password | JWT | Replaces password hash | No dedicated audit-log call shown. |
| Theme/locale | Browser user | Local storage only | None. |

### 2.10. Revision history and open issues

| Version | Date | Author | Note |
|---|---|---|---|
| 1.0 | 2026-10-24 | StudyWeb engineering team | First code-backed full account lifecycle flow. |

Open issues:

1. Align registration: either issue an authenticated session or change the frontend to redirect to login after successful creation.
2. Replace the forgot-password simulation with token issuance, expiry, mail delivery, reset confirmation, and session revocation.
3. Remove refresh token from the Google callback URL.
4. Add a learner-facing change-password/profile-edit experience if those capabilities are product requirements.

## 3. References

- [Authentication and session flow](01-auth-login-to-home.md)
- [Contributor onboarding](13-contributor-onboarding-and-application.md)
- [`MODULE_FE/src/routes/index.tsx`](../../MODULE_FE/src/routes/index.tsx)
- [`MODULE_FE/src/features/auth/api/auth.api.ts`](../../MODULE_FE/src/features/auth/api/auth.api.ts)
- [`MODULE_FE/src/services/api.client.ts`](../../MODULE_FE/src/services/api.client.ts)
- [`MODULE_FE/src/pages/auth/ForgotPasswordPage.tsx`](../../MODULE_FE/src/pages/auth/ForgotPasswordPage.tsx)
- [`MODULE_FE/src/pages/dashboard/views/UserProfileView.tsx`](../../MODULE_FE/src/pages/dashboard/views/UserProfileView.tsx)
- [`MODULE_FE/src/features/preferences/theme.tsx`](../../MODULE_FE/src/features/preferences/theme.tsx)
- [`MODULE_FE/src/features/preferences/i18n.tsx`](../../MODULE_FE/src/features/preferences/i18n.tsx)
- [`MODULE_BE/src/modules/auth/auth.controller.ts`](../../MODULE_BE/src/modules/auth/auth.controller.ts)
- [`MODULE_BE/src/modules/auth/auth.service.ts`](../../MODULE_BE/src/modules/auth/auth.service.ts)
