# Khung Giáo Trình 8 Bài Automation Playwright Low-Code V3
*(3 Cấp Độ Tăng Dần: Block Builder ➔ Smart Cloze ➔ Guided/Full Code)*

> **Mã chương trình**: `CURRICULUM-AUTO-V3`
> **Framework**: `@playwright/test` (Official Locators & Web-First Assertions)
> **Engine**: In-Browser Client Scenario Runner (Sandboxed Fixture Simulation, zero external network)
> **Mục tiêu**: Đưa Manual QA tiếp cận lập trình kiểm thử tự động một cách trực quan, có giàn giáo hỗ trợ (faded scaffolding), tự động sinh mã Playwright TypeScript chuẩn mực.

---

## Danh Sách 8 Bài Học Chuẩn

| Cấp độ | Mã Lab / Slug | Tiêu đề Bài học | Fixture Ứng Dụng | Kỹ Năng / Cú pháp | Preview / Pro |
|---|---|---|---|---|:---:|
| **Block Builder** | `auto-v3-01-test-structure-goto` | Cấu Trúc Test Cơ Bản & Điều Hướng (page.goto) | `order-investigation-app` | `page.goto('/orders')`, Arrange-Act-Assert, Test title | Free |
| **Block Builder** | `auto-v3-02-resilient-locators` | Chọn Locator Bền Vững: getByRole & getByLabel | `order-investigation-app` | `getByRole`, `getByLabel`, `getByText`, tránh CSS dễ vỡ | Free |
| **Block Builder** | `auto-v3-03-form-interactions` | Tương Tác Form: fill, click, check & selectOption | `auth-login-portal` | `fill()`, `click()`, `check()`, `selectOption()` | Free |
| **Smart Cloze** | `auto-v3-04-web-first-assertions` | Web-First Assertions Tự Động Chờ | `order-investigation-app` | `toBeVisible()`, `toHaveText()`, `toHaveURL()` | Pro |
| **Smart Cloze** | `auto-v3-05-login-positive-negative` | Kịch Bản Login Positive & Negative | `auth-login-portal` | Kiểm thử form xác thực với email và password hợp lệ/không hợp lệ | Pro |
| **Smart Cloze** | `auto-v3-06-parameterized-boundary-matrix` | Parameterized Test với Ma Trận Dữ Liệu | `auth-login-portal` | Lặp test case trên ma trận inputs & expected | Pro |
| **Guided Code** | `auto-v3-07-rbac-navigation-matrix` | Phân Quyền RBAC: Standard, Subscriber & Admin | `auth-login-portal` | Đăng nhập theo Role và assert đúng URL dashboard | Pro |
| **Full Code** | `auto-v3-08-capstone-checkout-flow` | Capstone Luồng Đặt Hàng Thương Mại Điện Tử | `ecommerce-checkout-app` | Tìm sản phẩm, thêm giỏ, điền thông tin, assert tổng tiền và trạng thái | Pro |

---

## Chi Tiết Kịch Bản & Gold Sample Playwright Code

### Bài 1: Cấu Trúc Test Cơ Bản & Điều Hướng (`auto-v3-01-test-structure-goto`)
- **Interaction Mode**: `block_builder`
- **Fixture**: `order-investigation-app` (`initialRoute: '/orders'`)
- **Nhiệm vụ**: Sử dụng block `nav_goto` để điều hướng đến route `'/orders'` và block `assert_visible` để xác nhận tiêu đề danh sách đơn hàng xuất hiện.
- **Gold Playwright Spec**:
```ts
import { test, expect } from '@playwright/test';

test.describe('Order Management Inquiry', () => {
  test('navigate to orders inquiry and verify header visibility', async ({ page }) => {
    // 1. Arrange & Act: Điều hướng đến trang quản lý đơn hàng
    await page.goto('/orders');

    // 2. Assert: Đảm bảo tiêu đề bảng đơn hàng hiển thị
    await expect(page.getByRole('table')).toBeVisible();
  });
});
```

### Bài 2: Chọn Locator Bền Vững (`auto-v3-02-resilient-locators`)
- **Interaction Mode**: `block_builder`
- **Fixture**: `order-investigation-app`
- **Nhiệm vụ**: Nhấp vào nút "Failed Orders" bằng locator chuẩn trợ năng `getByRole('button', { name: 'Filter Failed' })`, sau đó kiểm tra phần tử thông tin lỗi hiển thị.
- **Gold Playwright Spec**:
```ts
import { test, expect } from '@playwright/test';

test.describe('Resilient Locators Strategy', () => {
  test('filter failed orders using accessible role locator', async ({ page }) => {
    await page.goto('/orders');
    await page.getByRole('button', { name: 'Filter Failed' }).click();
    await expect(page.getByRole('region', { name: 'Order Details' })).toBeVisible();
  });
});
```

### Bài 3: Tương Tác Form Điền Dữ Liệu (`auto-v3-03-form-interactions`)
- **Interaction Mode**: `block_builder`
- **Fixture**: `auth-login-portal` (`initialRoute: '/login'`)
- **Nhiệm vụ**: Điền email, mật khẩu, đánh dấu checkbox ghi nhớ và nhấn Sign In.
- **Gold Playwright Spec**:
```ts
import { test, expect } from '@playwright/test';

test.describe('Form Interactions', () => {
  test('fill credentials, check remember me and submit login', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email Address').fill('qa.learner@studyweb.dev');
    await page.getByLabel('Password').fill('SecurePass123!');
    await page.getByLabel('Remember me').check();
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL('/dashboard/user');
  });
});
```

### Bài 4: Web-First Assertions (`auto-v3-04-web-first-assertions`)
- **Interaction Mode**: `smart_cloze`
- **Fixture**: `order-investigation-app`
- **Gold Playwright Spec**:
```ts
import { test, expect } from '@playwright/test';

test.describe('Web-First Assertions', () => {
  test('verify payment retry status changes dynamically', async ({ page }) => {
    await page.goto('/orders');
    await page.getByRole('button', { name: 'Filter Failed' }).click();
    await page.getByRole('button', { name: 'Retry Payment' }).click();
    await expect(page.getByRole('status')).toHaveText('Processing');
  });
});
```

### Bài 5: Login Positive & Negative (`auto-v3-05-login-positive-negative`)
- **Interaction Mode**: `smart_cloze`
- **Fixture**: `auth-login-portal`
- **Gold Playwright Spec**:
```ts
import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {
  test('successful login redirects to learner dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email Address').fill('student@studyweb.dev');
    await page.getByLabel('Password').fill('ValidPassword123!');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL('/dashboard/user');
  });
});
```

### Bài 6: Parameterized Testing với Ma Trận Dữ Liệu (`auto-v3-06-parameterized-boundary-matrix`)
- **Interaction Mode**: `smart_cloze`
- **Fixture**: `auth-login-portal`
- **Gold Playwright Spec**:
```ts
import { test, expect } from '@playwright/test';

const testMatrix = [
  { role: 'standard', expectedRoute: '/dashboard/user' },
  { role: 'admin', expectedRoute: '/dashboard/admin' },
];

testMatrix.forEach(({ role, expectedRoute }) => {
  test(`verify role [${role}] routes to [${expectedRoute}]`, async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email Address').fill(`${role}@studyweb.dev`);
    await page.getByLabel('Password').fill('Password123!');
    await page.getByLabel('Select Role').selectOption(role);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(expectedRoute);
  });
});
```

### Bài 7: Phân Quyền RBAC Matrix (`auto-v3-07-rbac-navigation-matrix`)
- **Interaction Mode**: `guided_code`
- **Fixture**: `auth-login-portal`
- **Gold Playwright Spec**:
```ts
import { test, expect } from '@playwright/test';

test.describe('RBAC Access Control Matrix', () => {
  test('administrator logs in and verifies system status in admin center', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email Address').fill('admin@studyweb.dev');
    await page.getByLabel('Password').fill('AdminPass123!');
    await page.getByLabel('Select Role').selectOption('admin');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL('/dashboard/admin');
    await expect(page.getByRole('region', { name: 'Admin Tools' })).toBeVisible();
  });
});
```

### Bài 8: Capstone Checkout Flow (`auto-v3-08-capstone-checkout-flow`)
- **Interaction Mode**: `full_code`
- **Fixture**: `ecommerce-checkout-app` (`initialRoute: '/shop'`)
- **Gold Playwright Spec**:
```ts
import { test, expect } from '@playwright/test';

test.describe('E-Commerce End-to-End Checkout Flow', () => {
  test('add product to cart, fill shipping info, and confirm order', async ({ page }) => {
    // 1. Mua bàn phím cơ
    await page.goto('/shop');
    await page.getByRole('button', { name: 'Add Mechanical Keyboard to Cart' }).click();
    await expect(page.getByRole('status', { name: 'Cart items count' })).toHaveText('1 items');

    // 2. Chuyển sang thanh toán
    await page.goto('/checkout');
    await expect(page.getByText('$90.00')).toBeVisible();

    // 3. Nhập thông tin giao hàng
    await page.getByLabel('Recipient Name').fill('Nguyen Khanh Duy');
    await page.getByLabel('Shipping Address').fill('123 Vo Van Ngan, Thu Duc, TP.HCM');
    await page.getByRole('button', { name: 'Place Order Now' }).click();

    // 4. Xác nhận đơn hàng thành công
    await expect(page.getByRole('status')).toBeVisible();
    await expect(page.getByRole('status')).toHaveText(/Order Placed Successfully/i);
  });
});
```
