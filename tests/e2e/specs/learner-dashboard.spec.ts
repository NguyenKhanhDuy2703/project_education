import { test, expect } from '@playwright/test';

test.describe('Learner Dashboard E2E Suite (Task 6 / Subtask 6.3)', () => {
  const mockUser = {
    id: 'learner-test-01',
    name: 'Taylor Swift',
    email: 'taylor@example.com',
    role: 'user',
    isContributor: false,
  };

  const mockStats = {
    totalCompleted: 12,
    totalLabs: 20,
    streakDays: 4,
    seriesProgress: [
      {
        seriesId: 'series-playwright-01',
        seriesTitle: 'Playwright Automation Testing',
        completedLabs: 5,
        totalLabs: 8,
        percentComplete: 63,
      },
    ],
  };

  test.beforeEach(async ({ page }) => {
    // Seed authenticated learner session
    await page.addInitScript((user) => {
      localStorage.setItem('access_token', 'mock-learner-token-123');
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('study_locale', 'en');
    }, mockUser);

    // Mock dashboard stats API endpoint
    await page.route('**/labs/me/stats', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: mockStats,
        }),
      });
    });

    await page.route('**/users/me/dashboard-stats', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: mockStats,
        }),
      });
    });
  });

  test('1. Learner dashboard renders all 4 KPIs and accessible progress bars', async ({ page }) => {
    await page.goto('/user/dashboard');

    // Page title and heading
    await expect(page.locator('h1')).toContainText('Learner Dashboard');

    // Verify 4 KPI cards
    await expect(page.locator('text=Completed Labs')).toBeVisible();
    await expect(page.locator('text="12"').first()).toBeVisible();

    await expect(page.locator('text=Total Labs')).toBeVisible();
    await expect(page.locator('text="20"').first()).toBeVisible();

    await expect(page.locator('text=Day Streak')).toBeVisible();
    await expect(page.locator('text="4 days"')).toBeVisible();

    await expect(page.locator('text=Overall Progress')).toBeVisible();
    await expect(page.locator('text="60%"').first()).toBeVisible();

    // Verify accessible progress bars
    const progressBars = page.locator('[role="progressbar"]');
    await expect(progressBars.first()).toBeVisible();
    await expect(progressBars.first()).toHaveAttribute('aria-valuenow', '60');

    // Verify series progress section
    await expect(page.locator('text=Playwright Automation Testing')).toBeVisible();
    await expect(page.locator('text="5/8 labs (63%)"')).toBeVisible();
  });

  test('2. Mobile layout renders cleanly without horizontal overflow at 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/user/dashboard');

    await expect(page.locator('h1')).toBeVisible();

    // Verify no horizontal overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const innerWidth = await page.evaluate(() => window.innerWidth);
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth + 2);
  });

  test('3. Dashboard enforces full English UI consistently across views', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('study_locale', 'vi');
    });

    await page.goto('/user/dashboard');

    // Verify English headers remain enforced even if legacy locale was present
    await expect(page.locator('h1')).toContainText('Learner Dashboard');
    await expect(page.locator('text=Completed Labs')).toBeVisible();
    await expect(page.locator('text=Total Labs')).toBeVisible();
    await expect(page.locator('text=Day Streak')).toBeVisible();
    await expect(page.locator('text=Overall Progress')).toBeVisible();
    await expect(page.locator('text=Continue Learning')).toBeVisible();
    await expect(page.locator('text=Browse Catalog')).toBeVisible();
  });
});
