import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

/** 多入口：PC 页面、手机端页面、手机端示意图（评审用，可单独删除）。 */
const entry = (name: string) => fileURLToPath(new URL(name, import.meta.url))

export default defineConfig(({mode}) => {
  const backend = mode === 'mock' ? `http://127.0.0.1:${process.env.AZURPILOT_MOCK_PORT ?? 22392}` : process.env.AZURPILOT_BACKEND ?? 'http://127.0.0.1:22267'
  return {
    // 相对构建：远程访问经前缀式反代（/<peer_id>/）加载时，绝对路径 /assets 会打到
    // 隧道服务端而 404/502；相对路径才能命中反代前缀。
    // 配套要求：deploy.yaml 的 RemoteAccessMode 必须为 ssh——P2P 模式下 <script src>
    // 不经过隧道页面的 fetch 接管，静态资源无论如何都拿不到。
    base: './',
    plugins: [react()],
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': { target: backend, ws: true },
        '/healthz': { target: backend },
      },
    },
    build: {
      sourcemap: false,
      rollupOptions: {
        input: {
          index: entry('index.html'),
          mobile: entry('mobile.html'),
          /* 评审用的示意图入口；评审结束后可连同 src/mobile/mockup 一起删除。 */
          mockup: entry('mobile-mockup.html'),
        },
      },
    },
  }
})
