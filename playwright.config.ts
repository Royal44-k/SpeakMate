import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3100'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium-mobile',
      use: {
        ...devices['Pixel 7'],
        channel: process.platform === 'win32' ? 'msedge' : undefined,
        viewport: { width: 390, height: 844 },
      },
    },
    {
      name: 'webkit-iphone',
      use: { ...devices['iPhone 14'] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : {
    command: '.\\node_modules\\.bin\\next.CMD start -p 3100',
    url: baseURL,
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
