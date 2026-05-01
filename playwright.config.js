import { defineConfig, devices } from '@playwright/test'

const CI = Boolean(process.env.CI)

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  reporter: CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  globalSetup: './playwright.global-setup.js',
  webServer: [
    {
      command: 'npm --prefix five_college_connect/server run start',
      url: 'http://127.0.0.1:4000/health',
      reuseExistingServer: !CI,
      timeout: 120_000,
      env: {
        CLIENT_URL: 'http://127.0.0.1:3000',
        EMAIL_VERIFICATION_BASE_URL:
          'http://127.0.0.1:3000/verify-email',
      },
    },
    {
      command:
        'npm --prefix five_college_connect/client run build && npm --prefix five_college_connect/client run preview -- --host 127.0.0.1 --port 3000 --strictPort',
      url: 'http://127.0.0.1:3000',
      reuseExistingServer: !CI,
      timeout: 120_000,
      env: {
        VITE_API_URL: 'http://127.0.0.1:4000',
      },
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
})
