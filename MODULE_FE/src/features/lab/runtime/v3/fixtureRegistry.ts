/**
 * fixtureRegistry.ts
 *
 * In-browser sandboxed fixture registry for Playwright Automation Labs V3.
 * Runs completely on client RAM/CPU without accessing any external websites.
 * Banned: fetch, XHR, WebSocket, external URLs, dynamic imports.
 */

export interface MiniAppRouteDefinition {
  route: string;
  title: string;
  html: string;
  initialState?: Record<string, unknown>;
  metadata?: {
    roles?: string[];
    elements?: Array<{
      selector: string;
      role?: string;
      label?: string;
      text?: string;
      testId?: string;
      tag: string;
    }>;
  };
}

export interface AutomationFixture {
  fixtureId: string;
  fixtureVersion: string;
  name: string;
  description: string;
  defaultRoute: string;
  routes: Record<string, MiniAppRouteDefinition>;
  allowedOriginOnly?: boolean;
}

class FixtureRegistry {
  private fixtures = new Map<string, AutomationFixture>();

  constructor() {
    this.registerBuiltinFixtures();
  }

  public register(fixture: AutomationFixture): void {
    if (!fixture.fixtureId || !fixture.fixtureVersion) {
      throw new Error('Fixture registration requires fixtureId and fixtureVersion.');
    }
    this.fixtures.set(fixture.fixtureId, fixture);
  }

  public get(fixtureId: string): AutomationFixture | undefined {
    return this.fixtures.get(fixtureId);
  }

  public getAll(): AutomationFixture[] {
    return Array.from(this.fixtures.values());
  }

  public validateRoute(fixtureId: string, targetRoute: string): boolean {
    // Strictly disallow external URLs, protocols, javascript schemes
    if (
      targetRoute.startsWith('http://') ||
      targetRoute.startsWith('https://') ||
      targetRoute.startsWith('//') ||
      targetRoute.startsWith('javascript:') ||
      targetRoute.startsWith('data:')
    ) {
      return false;
    }

    const fixture = this.fixtures.get(fixtureId);
    if (!fixture) return false;

    const normalized = targetRoute.split('?')[0].split('#')[0];
    return Boolean(fixture.routes[normalized]);
  }

  private registerBuiltinFixtures(): void {
    // 1. Order Investigation Fixture (Lab 01)
    this.register({
      fixtureId: 'order-investigation-app',
      fixtureVersion: '1.0.0',
      name: 'E-commerce Order Management Portal',
      description: 'Internal admin portal for investigating failed transactions and customer order logs',
      defaultRoute: '/orders',
      routes: {
        '/orders': {
          route: '/orders',
          title: 'Order Status Inquiry',
          html: `
            <div class="mini-app-container p-4 font-sans">
              <header class="border-b pb-2 mb-4">
                <h1 class="text-lg font-bold text-slate-800">Order Management System</h1>
                <p class="text-xs text-slate-500">Investigate failed payment and order transactions</p>
              </header>
              <div class="filter-bar flex gap-2 mb-4">
                <input id="order-search" type="text" placeholder="Search order ID..." aria-label="Order ID Search" class="border px-2 py-1 rounded text-xs" />
                <button id="btn-search" role="button" aria-label="Search Orders" class="bg-blue-600 text-white px-3 py-1 rounded text-xs">Search</button>
                <button id="btn-filter-failed" role="button" aria-label="Filter Failed" class="bg-red-50 text-red-700 border border-red-200 px-3 py-1 rounded text-xs">Failed Orders</button>
              </div>
              <table class="w-full text-xs text-left border" role="table">
                <thead class="bg-slate-100">
                  <tr>
                    <th class="p-2 border">Order ID</th>
                    <th class="p-2 border">Customer</th>
                    <th class="p-2 border">Amount</th>
                    <th class="p-2 border">Status</th>
                    <th class="p-2 border">Action</th>
                  </tr>
                </thead>
                <tbody id="orders-tbody">
                  <tr data-testid="order-row-101">
                    <td class="p-2 border font-mono">ORD-9021</td>
                    <td class="p-2 border">Nguyen Van An</td>
                    <td class="p-2 border">$120.00</td>
                    <td class="p-2 border"><span role="status" class="px-2 py-0.5 rounded text-[10px] bg-red-100 text-red-700">Failed</span></td>
                    <td class="p-2 border"><button role="button" aria-label="View Details" class="text-blue-600 underline">View</button></td>
                  </tr>
                  <tr data-testid="order-row-102">
                    <td class="p-2 border font-mono">ORD-9022</td>
                    <td class="p-2 border">Tran Thi Binh</td>
                    <td class="p-2 border">$45.50</td>
                    <td class="p-2 border"><span role="status" class="px-2 py-0.5 rounded text-[10px] bg-green-100 text-green-700">Completed</span></td>
                    <td class="p-2 border"><button role="button" aria-label="View Details" class="text-blue-600 underline">View</button></td>
                  </tr>
                </tbody>
              </table>
              <div id="order-detail-card" role="region" aria-label="Order Details" class="mt-4 p-3 bg-slate-50 border rounded hidden">
                <h2 class="font-bold text-xs text-slate-700 mb-1">Details for ORD-9021</h2>
                <p class="text-xs text-slate-600">Error: Payment gateway timeout (Error 504)</p>
                <button id="btn-retry-payment" role="button" aria-label="Retry Payment" class="mt-2 bg-emerald-600 text-white px-3 py-1 rounded text-xs">Retry Payment</button>
              </div>
            </div>
          `,
          metadata: {
            elements: [
              { selector: 'button[aria-label="Search Orders"]', role: 'button', label: 'Search Orders', tag: 'button' },
              { selector: 'button[aria-label="Filter Failed"]', role: 'button', label: 'Filter Failed', tag: 'button' },
              { selector: 'button[aria-label="Retry Payment"]', role: 'button', label: 'Retry Payment', tag: 'button' },
              { selector: 'span[role="status"]', role: 'status', text: 'Failed', tag: 'span' },
            ],
          },
        },
      },
    });

    // 2. Authentication Login Portal (Lab 02, 05, 07)
    this.register({
      fixtureId: 'auth-login-portal',
      fixtureVersion: '1.0.0',
      name: 'Secure QA Authentication & RBAC Portal',
      description: 'Simulates login, role-based dashboard redirection and form validation',
      defaultRoute: '/login',
      routes: {
        '/login': {
          route: '/login',
          title: 'Sign In to Portal',
          html: `
            <div class="mini-app-container p-6 max-w-sm mx-auto font-sans">
              <h1 class="text-base font-bold text-slate-800 mb-2">Member Login</h1>
              <form id="login-form" class="space-y-3" onsubmit="return false;">
                <div>
                  <label for="email" class="block text-xs font-medium text-slate-700">Email Address</label>
                  <input id="email" type="email" placeholder="name@example.com" aria-label="Email Address" required class="w-full border px-2 py-1.5 rounded text-xs mt-1" />
                </div>
                <div>
                  <label for="password" class="block text-xs font-medium text-slate-700">Password</label>
                  <input id="password" type="password" placeholder="••••••••" aria-label="Password" required class="w-full border px-2 py-1.5 rounded text-xs mt-1" />
                </div>
                <div class="flex items-center gap-2">
                  <input id="remember-me" type="checkbox" aria-label="Remember me" class="rounded" />
                  <label for="remember-me" class="text-xs text-slate-600">Remember me for 30 days</label>
                </div>
                <div>
                  <label for="user-role" class="block text-xs font-medium text-slate-700">Role Selection</label>
                  <select id="user-role" aria-label="Select Role" class="w-full border px-2 py-1.5 rounded text-xs mt-1 bg-white">
                    <option value="standard">Standard User</option>
                    <option value="subscriber">Subscriber</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div id="login-feedback" role="alert" class="text-xs hidden p-2 rounded"></div>
                <button id="btn-submit-login" type="submit" role="button" aria-label="Sign In" class="w-full bg-blue-600 text-white font-medium py-1.5 rounded text-xs hover:bg-blue-700">Sign In</button>
              </form>
            </div>
          `,
        },
        '/dashboard/admin': {
          route: '/dashboard/admin',
          title: 'Admin Control Center',
          html: `
            <div class="p-4 font-sans">
              <h1 class="text-base font-bold text-slate-900">Admin Control Center</h1>
              <p class="text-xs text-slate-600">Access Granted: Full administrative privileges</p>
              <div role="region" aria-label="Admin Tools" class="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded">
                <span class="text-xs font-semibold text-emerald-800">System Status: Operational</span>
              </div>
            </div>
          `,
        },
        '/dashboard/user': {
          route: '/dashboard/user',
          title: 'Learner Dashboard',
          html: `
            <div class="p-4 font-sans">
              <h1 class="text-base font-bold text-slate-900">User Dashboard</h1>
              <p class="text-xs text-slate-600">Standard user access profile</p>
            </div>
          `,
        },
      },
    });

    // 3. E-commerce Checkout Capstone Fixture (Lab 08)
    this.register({
      fixtureId: 'ecommerce-checkout-app',
      fixtureVersion: '1.0.0',
      name: 'Capstone E-commerce Cart & Checkout',
      description: 'End-to-end flow: catalog search, add to cart, order review, payment confirmation',
      defaultRoute: '/shop',
      routes: {
        '/shop': {
          route: '/shop',
          title: 'Product Catalog',
          html: `
            <div class="p-4 font-sans">
              <header class="flex justify-between items-center mb-4 border-b pb-2">
                <h1 class="text-base font-bold">TechStore Mini</h1>
                <div class="flex items-center gap-2">
                  <span id="cart-badge" role="status" aria-label="Cart items count" class="text-xs bg-slate-200 px-2 py-0.5 rounded-full font-mono">0 items</span>
                  <button id="btn-view-cart" role="button" aria-label="Open Cart" class="text-xs bg-slate-800 text-white px-3 py-1 rounded">Cart</button>
                </div>
              </header>
              <div class="grid grid-cols-2 gap-3" id="products-list">
                <div class="border p-2 rounded text-xs" data-testid="product-1">
                  <div class="font-bold text-slate-800">Mechanical Keyboard</div>
                  <div class="text-slate-500 mb-2">$85.00</div>
                  <button role="button" aria-label="Add Mechanical Keyboard to Cart" class="btn-add-cart bg-blue-600 text-white px-2 py-1 rounded w-full">Add to Cart</button>
                </div>
                <div class="border p-2 rounded text-xs" data-testid="product-2">
                  <div class="font-bold text-slate-800">Wireless Mouse</div>
                  <div class="text-slate-500 mb-2">$45.00</div>
                  <button role="button" aria-label="Add Wireless Mouse to Cart" class="btn-add-cart bg-blue-600 text-white px-2 py-1 rounded w-full">Add to Cart</button>
                </div>
              </div>
            </div>
          `,
        },
        '/checkout': {
          route: '/checkout',
          title: 'Checkout Confirmation',
          html: `
            <div class="p-4 font-sans max-w-sm mx-auto">
              <h1 class="text-base font-bold mb-3">Order Checkout</h1>
              <div class="border p-3 rounded bg-slate-50 mb-3 text-xs space-y-1">
                <div class="flex justify-between"><span>Items subtotal:</span> <span id="summary-subtotal">$85.00</span></div>
                <div class="flex justify-between"><span>Shipping fee:</span> <span id="summary-shipping">$5.00</span></div>
                <div class="flex justify-between font-bold border-t pt-1"><span>Total Amount:</span> <span id="summary-total">$90.00</span></div>
              </div>
              <form id="checkout-form" class="space-y-2 text-xs" onsubmit="return false;">
                <div>
                  <label for="shipping-name" class="block font-medium">Full Name</label>
                  <input id="shipping-name" type="text" aria-label="Recipient Name" required class="w-full border px-2 py-1 rounded mt-0.5" />
                </div>
                <div>
                  <label for="shipping-address" class="block font-medium">Delivery Address</label>
                  <input id="shipping-address" type="text" aria-label="Shipping Address" required class="w-full border px-2 py-1 rounded mt-0.5" />
                </div>
                <button id="btn-place-order" role="button" aria-label="Place Order Now" class="w-full bg-emerald-600 text-white py-1.5 rounded font-medium mt-2">Place Order Now</button>
              </form>
              <div id="order-success-banner" role="status" class="hidden mt-3 p-2 bg-emerald-100 text-emerald-800 rounded text-xs text-center font-bold">
                Order Placed Successfully! (Status: Confirmed)
              </div>
            </div>
          `,
        },
      },
    });
  }
}

export const fixtureRegistry = new FixtureRegistry();
