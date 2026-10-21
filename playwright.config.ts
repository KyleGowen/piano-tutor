import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  timeout: 30000,
  use: {
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:5173',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        viewport: { width: 1440, height: 1000 },
      },
    },
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 7'], defaultBrowserType: 'chromium', channel: 'chrome' },
    },
    { name: 'mobile-webkit', use: { ...devices['iPhone 13'], browserName: 'webkit' } },
  ],
});
