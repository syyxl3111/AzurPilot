import { defineConfig } from '@playwright/test'

/**
 * 手机端（Android UA）的布局回归配置。
 *
 * 与 playwright.config.ts 分开：那份跑的是 PC 端（需要 Python 后端，端口 22391），
 * 这份跑的是静态产物 —— vite preview 起 dist 里的 mobile-mockup.html，
 * 用 412×915 视口 + Android UA + 触摸，复现真机上的排版。
 * 手机端用例单独放 e2e-mobile/（不在 PC 的 testDir 里），
 * 免得 PC 那份 `npm run test:e2e` 把需要真后端/真密码的用例也捎上。
 *
 * 注意：Windows PowerShell 5.1 的 Get-Content / Set-Content 默认按 GBK 处理无 BOM 的
 * UTF-8 文件，用它改这个文件会把中文注释读坏（三字节字符的尾字节还会吃掉换行）。
 * 要改就用带 UTF-8 的编辑器。
 */
export default defineConfig({
  testDir: './e2e-mobile',
  testMatch: ['**/mockup.spec.ts'],
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:4174',
    headless: true,
    locale: 'zh-CN',
    viewport: {width: 412, height: 915},
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    hasTouch: true,
  },
  webServer: {
    command: 'npm run preview -- --port 4174 --strictPort',
    url: 'http://127.0.0.1:4174/mobile-mockup.html',
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
})
