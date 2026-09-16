import { defineConfig } from '@playwright/test'

/**
 * 手机端**正式入口**的验证，打的是真实运行中的服务（默认 25548）。
 *
 * 与 playwright.mockup.config.ts 的区别：那份跑的是 vite preview 托管的示意图
 * （假数据），这份跑的是真后端 —— 所以要先把服务起来，并且提供访问密码。
 *
 *   $env:AZURPILOT_PASSWORD = '<config/deploy.yaml 里的 Webui.Password>'
 *   npx playwright test --config playwright.live.config.ts
 *
 * 密码走环境变量而不是写进仓库；没设就整组跳过。
 */
export default defineConfig({
  testDir: './e2e-mobile',
  testMatch: ['**/live.spec.ts'],
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: process.env.AZURPILOT_LIVE_URL ?? 'http://127.0.0.1:25548',
    headless: true,
    locale: 'zh-CN',
    viewport: {width: 412, height: 915},
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    hasTouch: true,
  },
})
