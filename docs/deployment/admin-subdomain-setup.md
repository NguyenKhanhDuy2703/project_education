# Hướng Dẫn Cấu Hình Triển Khai Subdomain Riêng Cho Admin Studio (`admin.studyit.dev`)

> **Phiên bản**: 1.0.0  
> **Áp dụng cho**: Kiến trúc phân tách độc lập Web chính (`studyit.dev`) và Admin (`admin.studyit.dev`) từ Git Monorepo.

---

## 1. Tổng Quan Kiến Trúc (Architecture Overview)

Hệ thống được chia tách thành 2 ứng dụng Frontend độc lập cùng trỏ về một Backend API (`api.studyit.dev`):

```
                                  ┌──────────────────────────┐
                                  │   DNS / Cloudflare DNS   │
                                  └─────────────┬────────────┘
                                                │
                       ┌────────────────────────┴────────────────────────┐
                       ▼                                                 ▼
        ┌─────────────────────────────┐                   ┌─────────────────────────────┐
        │        Vercel Web App       │                   │       Vercel Admin App      │
        │        (MODULE_FE)          │                   │       (MODULE_ADMIN)        │
        │    Domain: studyit.dev      │                   │  Domain: admin.studyit.dev  │
        │  Stealth Mode: 0 Admin code │                   │  Zero Trust / IP Allowlist  │
        └──────────────┬──────────────┘                   └──────────────┬──────────────┘
                       │                                                 │
                       │    Cookie/Bearer Token                          │    Strict Admin Token
                       │    (User / Pro / Contributor)                   │    (Role: 'admin' only)
                       ▼                                                 ▼
        ┌───────────────────────────────────────────────────────────────────────────────┐
        │                     NestJS Backend API (MODULE_BE)                            │
        │                     Domain: api.studyit.dev                                   │
        │   - CORS Whitelist: ['studyit.dev', 'admin.studyit.dev']                      │
        │   - Host-Only Cookies (Không share wildcard domain)                           │
        │   - Controller Guards: @UseGuards(AuthGuard('jwt'), RolesGuard)               │
        └───────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Cấu Hình Vercel Multi-Project (Từ 1 Git Repository)

Trên Vercel Dashboard, tạo 2 Project riêng biệt liên kết với cùng một kho mã nguồn Git:

### Project 1: Web Chính (Learner & Contributor)
- **Project Name**: `studyit-web`
- **Root Directory**: `MODULE_FE`
- **Framework Preset**: `Vite`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`
- **Custom Domains**:
  - `studyit.dev` (Primary Production)
  - `www.studyit.dev` (Redirect to `studyit.dev`)
- **Environment Variables**:
  ```env
  VITE_API_BASE_URL=https://api.studyit.dev/api/v1
  VITE_SITE_URL=https://studyit.dev
  ```

### Project 2: Admin Studio (Quản Trị Viên)
- **Project Name**: `studyit-admin`
- **Root Directory**: `MODULE_ADMIN`
- **Framework Preset**: `Vite`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`
- **Custom Domains**:
  - `admin.studyit.dev` (Primary Production)
- **Environment Variables**:
  ```env
  VITE_API_BASE_URL=https://api.studyit.dev/api/v1
  VITE_SITE_URL=https://admin.studyit.dev
  ```

---

## 3. Cấu Hình SPA Rewrite & Security Headers (`vercel.json`)

File `MODULE_ADMIN/vercel.json` đã được cấu hình với các HTTP headers bảo vệ:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Robots-Tag",
          "value": "noindex, nofollow, noarchive"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

---

## 4. Bảo Mật Backend (`MODULE_BE`)

### 4.1. CORS Whitelist
Trong `MODULE_BE/src/main.ts`, danh sách origins cho phép bao gồm cả môi trường local và production:
```typescript
const defaultOrigins = [
  'http://localhost:5173',        // Web local dev
  'http://localhost:5174',        // Admin local dev
  'http://localhost:3000',        // Backend local dev / Swagger
  'https://studyit.dev',          // Web production
  'https://admin.studyit.dev',    // Admin production
  ...configuredOrigins,
];
```

### 4.2. Host-Only Cookies
Cookie `refreshToken` và `accessToken` **không** thiết lập thuộc tính `domain: '.studyit.dev'`. Do đó:
- Cookie tuân theo cơ chế Host-Only (chỉ gửi về host đã phát hành).
- Phiên đăng nhập người dùng thông thường trên `studyit.dev` hoàn toàn không bị rò rỉ hay tự động gửi kèm sang `admin.studyit.dev`.

### 4.3. RBAC & Guard Chặn Tuyệt Đối
Mọi endpoint quản trị (`/api/v1/admin/*`, `/api/v1/users/*`, `/api/v1/review/*`) đều được bảo vệ kép:
1. `AuthGuard('jwt')`: Kiểm tra tính toàn vẹn của token JWT.
2. `RolesGuard`: Xác minh vai trò người dùng trong cơ sở dữ liệu (`req.user.role === 'admin'`). Nếu không phải admin, trả về HTTP `403 Forbidden` ngay lập tức.

---

## 5. Chiến Lược Bảo Mật Phòng Thủ Theo Chiều Sâu (Defense-in-Depth)

Để đạt mức độ an toàn cấp doanh nghiệp, khuyến nghị áp dụng thêm tầng bảo vệ bên ngoài cho `admin.studyit.dev`:

### Tùy chọn A: Cloudflare Zero Trust (Khuyến nghị số 1 - Miễn phí đến 50 users)
1. Đặt DNS của domain qua **Cloudflare Proxy** (Đám mây cam).
2. Vào Cloudflare Dashboard -> **Zero Trust** -> **Access** -> **Applications**.
3. Thêm Application mới trỏ vào `admin.studyit.dev`.
4. Thiết lập Policy:
   - Cho phép danh sách email quản trị viên nhận mã OTP một lần (One-Time PIN) qua email.
   - Hoặc chỉ cho phép kết nối từ dải IP cố định (Corporate VPN / Static IP).
5. **Hiệu quả**: Kẻ tấn công hoặc người dùng vãng lai thậm chí không thể nhìn thấy màn hình đăng nhập của Admin nếu chưa vượt qua Cloudflare Zero Trust.

### Tùy chọn B: Vercel Deployment Protection
1. Vào Vercel Dashboard của Project `studyit-admin`.
2. Chọn **Settings** -> **Deployment Protection**.
3. Bật **Password Protection** hoặc **Vercel Authentication**.

---

## 6. Checklist Kiểm Thử Triển Khai (Post-Deployment Verification)

- [ ] Truy cập `studyit.dev`: Giao diện học viên và Contributor hoạt động bình thường, DevTools không có dấu vết chunk admin hay route `/admin`.
- [ ] Truy cập `admin.studyit.dev`: Màn hình `AdminLoginPage` hiển thị, đăng nhập bằng tài khoản non-admin bị từ chối với thông báo `"Tài khoản không có quyền quản trị viên"`.
- [ ] Đăng nhập tài khoản admin trên `admin.studyit.dev`: Vào được Admin Studio, quản lý bài viết, duyệt đơn Contributor, phân quyền IAM đầy đủ.
- [ ] Gọi thử API `/api/v1/admin/users` bằng token của user thường -> Nhận phản hồi HTTP `403 Forbidden`.
