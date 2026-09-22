/**
 * 手机端示意图入口（评审用）。
 *
 * 用真实 antd-mobile 组件 + PC 的主题皮肤 + 假数据渲染手机端各个页面，
 * 不调用任何后端接口，供真机上确认观感与交互。
 * 评审结束后本入口可整体删除（连同 mobile-mockup.html 与 vite 配置里的一项）。
 *
 * 样式栈与正式入口（main.tsx）逐字一致，两层结构见那边的注释：主题皮肤由
 * `applyTheme()` 运行时注入，mobile.css 只补布局。两份入口必须保持一致，
 * 否则评审入口量到的颜色与间距在真机上对不上。
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'antd-mobile/es/global'
import '../mobile.css'
import { applyTheme, getThemePreference } from '../../app/theme'
import { installImperativeRenderer } from '../renderRoot'
import { MockupApp } from './MockupApp'

void applyTheme(getThemePreference()).then(() => {
  /* 必须在渲染之前装：否则 Dialog/Toast/ActionSheet/ImageViewer 的命令式 API 会静默失效。 */
  installImperativeRenderer()

  /* 与正式入口一致的挂载约定：样式作用域挂在 <html> 上。 */
  document.documentElement.dataset.shell = 'mobile'

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <MockupApp />
    </StrictMode>,
  )
}).catch(() => {
  document.getElementById('root')!.textContent = '主题加载失败，请刷新页面重试。'
})
