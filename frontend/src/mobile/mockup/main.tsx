/**
 * 手机端示意图入口（评审用）。
 *
 * 用真实 antd-mobile 组件 + PC 的设计系统 + 假数据渲染手机端各个页面，
 * 不调用任何后端接口，供真机上确认观感与交互。
 * 评审结束后本入口可整体删除（连同 mobile-mockup.html 与 vite 配置里的一项）。
 *
 * 样式栈与正式入口（main.tsx）逐字一致，两层结构见那边的注释。
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'antd-mobile/es/global'
import '../../styles/tokens.css'
import '../../styles/components.css'
import '../../styles/apple.css'
import '../../styles/forms.css'
import '../../styles/insights.css'
import '../../styles/theme-system.css'
import '../mobile.css'
import { installImperativeRenderer } from '../renderRoot'
import { MockupApp } from './MockupApp'

/* 必须在渲染之前装：否则 Dialog/Toast/ActionSheet/ImageViewer 的命令式 API 会静默失效。 */
installImperativeRenderer()

/* 与正式入口一致的挂载约定：样式作用域挂在 <html> 上。 */
document.documentElement.dataset.shell = 'mobile'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MockupApp />
  </StrictMode>,
)
