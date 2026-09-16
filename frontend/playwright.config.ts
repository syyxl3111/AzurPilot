import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  /* mock.spec.ts 走 mock 服务，mockup.spec.ts 走纯前端示意图，各有独立 config。 */
  testIgnore: ['**/mock.spec.ts', '**/mockup.spec.ts'],
  fullyParallel: false,
  workers: 1,
  use: {baseURL: 'http://127.0.0.1:22391', headless: true, locale: 'zh-CN', viewport: {width: 1440, height: 1100}},
  webServer: {
    command: 'uv run python -m tests.serve_frontend',
    cwd: '..',
    url: 'http://127.0.0.1:22391/healthz',
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
})
