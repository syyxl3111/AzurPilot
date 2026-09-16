/**
 * 手机端正式入口（mobile.html）。
 *
 * 样式分两层，加载顺序即层叠顺序，mobile.css 必须最后：
 *   1. **PC 的设计系统**（tokens / components / apple / forms / theme-system）——
 *      手机端与电脑端共用同一套令牌、组件类与观感，所以页面里的卡片、按钮、
 *      状态、空态、表单字段直接用 PC 的类名（.panel / .button / .status /
 *      .empty / .field-row…），不需要在手机端另画一套。
 *   2. **mobile.css** —— 只负责 PC 没有的东西：固定页眉与底部 Tab 栏、安全区、
 *      整屏自适应布局、长列表虚拟化。这些规则靠后加载覆盖 PC 的默认值。
 *
 * 刻意**不引** layout.css / home.css：那是 PC 的侧栏外壳与首页专用样式，手机端一件都
 * 用不到，引进来只是白白多背 30 多 kB。**insights.css 要引** —— 卡片管理用的还是 PC 的
 * `.resource-settings` / `.resource-editor-*` / `.resource-picker*` 那一套类名。
 *
 * 仍不加载任何第三方脚本与统计（Clarity 只存在于 PC 入口），不请求外部字体，
 * 也不请求 PC 首页那张 api.yppp.net 背景图 —— 除同源外零网络请求。
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'antd-mobile/es/global'
import '../styles/tokens.css'
import '../styles/components.css'
import '../styles/apple.css'
import '../styles/forms.css'
import '../styles/insights.css'
import '../styles/theme-system.css'
import './mobile.css'
import { installImperativeRenderer } from './renderRoot'
import { AppProvider } from '../app/context'
import { MobileApp } from './app/MobileApp'

/* 必须在渲染之前装：否则 Dialog/Toast/ActionSheet/ImageViewer 的命令式 API 会静默失效。 */
installImperativeRenderer()

/* 样式作用域挂 <html>，所有手机端覆盖规则都限定在这个属性下。 */
document.documentElement.dataset.shell = 'mobile'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* AppProvider 负责连接、实例列表、schema、语言/主题与 Toast —— 与 PC 同一份 */}
    <AppProvider>
      <MobileApp />
    </AppProvider>
  </StrictMode>,
)
