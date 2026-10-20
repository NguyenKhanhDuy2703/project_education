import { test, expect } from '@playwright/test';
import { roleNavigationScenarios, localeThemeScenarios } from '../fixtures/scenarios';

test.describe('Scenario-Driven Playwright Parameterized Suite (Task 4 / Subtask 4.5)', () => {
  // Shared setup hook stays outside the parameter loop
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  // 1. Parameterized Role Navigation Scenarios
  roleNavigationScenarios.forEach(({ caseId, title, targetPath, expectedHeading, storageSeed }) => {
    test(`[${caseId}] ${title}`, async ({ page }) => {
      if (storageSeed) {
        await page.addInitScript((seed) => {
          localStorage.setItem('access_token', seed.token);
          localStorage.setItem('user', JSON.stringify(seed.user));
        }, storageSeed);
      }

      await page.goto(targetPath);

      // Verify that navigation succeeds and page renders expected heading or text
      const heading = page.locator('h1, h2, h3, [data-slot="card-title"]').first();
      await expect(heading).toBeVisible({ timeout: 10000 });
      await expect(page.locator('body')).toContainText(expectedHeading);
    });
  });

  // 2. Parameterized Theme and Locale Scenarios
  localeThemeScenarios.forEach(({ caseId, title, themeAction, expectedDarkClass, localeAction, expectedLang }) => {
    test(`[${caseId}] ${title}`, async ({ page }) => {
      // Seed initial preference directly in localStorage
      await page.addInitScript(
        ({ theme, locale }) => {
          localStorage.setItem('study_theme', theme);
          localStorage.setItem('study_locale', locale);
        },
        { theme: themeAction, locale: localeAction }
      );

      await page.goto('/');

      // Check document class and lang attribute
      if (expectedDarkClass) {
        await expect(page.locator('html')).toHaveClass(/dark/);
      } else {
        const htmlClasses = await page.locator('html').getAttribute('class');
        expect(htmlClasses || '').not.toContain('dark');
      }

      await expect(page.locator('html')).toHaveAttribute('lang', expectedLang);
    });
  });
});
