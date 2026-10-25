import { test, expect } from '@playwright/test';

const viewports = [
  { width: 375, height: 667 },
  { width: 768, height: 900 },
  { width: 1024, height: 900 },
  { width: 1440, height: 1000 },
];

test.describe('Responsive learner footer', () => {
  test('stays usable without overflow at supported widths', async ({ page }) => {
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('/');

      const footer = page.locator('footer');
      await expect(footer).toBeVisible();
      await expect(footer).toContainText('StudyIT.dev');

      const hasHorizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      );
      expect(hasHorizontalOverflow, `overflow at ${viewport.width}px`).toBe(false);

      const controls = footer.locator('a, button');
      const controlCount = await controls.count();
      expect(controlCount).toBeGreaterThan(0);

      for (let index = 0; index < controlCount; index += 1) {
        const control = controls.nth(index);
        const box = await control.boundingBox();
        expect(box, `footer control ${index} at ${viewport.width}px`).not.toBeNull();
        expect(box!.height, `touch height for control ${index} at ${viewport.width}px`).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('keeps focusable controls in visual order and excludes the lab shell', async ({ page }) => {
    await page.goto('/');

    const footerControls = page.locator('footer a, footer button');
    const controlCount = await footerControls.count();
    const topPositions: number[] = [];

    for (let index = 0; index < controlCount; index += 1) {
      const control = footerControls.nth(index);
      await control.focus();
      await expect(control).toBeFocused();
      const box = await control.boundingBox();
      if (box) topPositions.push(box.y);
    }

    expect(topPositions.length).toBe(controlCount);

    await page.goto('/labs/footer-layout-check');
    await expect(page.locator('footer')).toHaveCount(0);
  });
});
