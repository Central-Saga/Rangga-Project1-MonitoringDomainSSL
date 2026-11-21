import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './playwright',
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: true,
  workers: process.env.CI ? 1 : 4,
  reporter: [['html'], ['list']],
  use: {
    baseURL: process.env.CI ? 'https://your-app-url.com' : 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'Chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'Firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'WebKit', use: { ...devices['Desktop Safari'] } },
  ],
});
