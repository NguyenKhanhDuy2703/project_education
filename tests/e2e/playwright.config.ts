import { defineConfig, devices } from '@playwright/test';

const isStaging = Boolean(process.env.STAGING_URL);
const baseURL = process.env.STAGING_URL || 'http://127.0.0.1:4173';

export default defineConfig({
  testDir: './specs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
      },
    },
  ],
  webServer: isStaging
    ? undefined
    : {
        command: 'npm run preview -- --port 4173 --host 127.0.0.1',
        cwd: '../../MODULE_FE',
        url: 'http://127.0.0.1:4173',
        reuseExistingServer: true,
        timeout: 30000,
      },
});
