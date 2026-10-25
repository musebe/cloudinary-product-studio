import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  workers: 2,
  forbidOnly: Boolean(process.env.CI),
  use: { baseURL: 'http://127.0.0.1:3104', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } },
  ],
  webServer: {
    command: 'pnpm exec nuxt dev --dotenv .env.local --port 3104',
    env: { PRODUCT_STUDIO_BUILD_DIR: '.nuxt-e2e' },
    url: 'http://127.0.0.1:3104/api/health',
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
