/**
 * 手机端正式入口（mobile.html）。
 *
 * 样式分两层，与电脑端同源：
 *   1. **主题皮肤**（classic / minimal / legacy，见 `app/theme.ts`）—— 由
 *      `applyTheme()` 在运行时把当前皮肤注入 `<style data-azurpilot-skin>`，带来
 *      tokens / components / forms / insights / theme-system 与 `--theme-*` 语义变量。
 *      **必须在渲染之前完成**：上游已把主题从「入口静态 import」改成「运行时按偏好
 *      加载」，入口再静态引那几份子集只会拿到一半变量 —— 深色下 `--bg` 仍是亮色、
 *      `--theme-*` 全空，于是整屏没有颜色。
 *   2. **mobile.css** —— 只负责 PC 没有的东西：固定页眉与底部 Tab 栏、安全区、
 *      整屏自适应布局、长列表虚拟化。它的规则要么是手机端独有的 `.m-*` 类名，要么带
 *      `[data-shell='mobile']` 作用域，所以皮肤晚一步注入也盖不掉它。
 *
 * 仍不加载任何第三方脚本与统计（Clarity 只存在于 PC 入口）、不请求外部字体
 * （MiSans / JetBrainsMono 都在 public/ 里自托管），除同源外零网络请求。
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'antd-mobile/es/global'
import './mobile.css'
import { applyTheme, getThemePreference } from '../app/theme'
import { installImperativeRenderer } from './renderRoot'
import { AppProvider } from '../app/context'
import { MobileApp } from './app/MobileApp'

/* 先按偏好把主题皮肤挂上再渲染，避免首帧没有颜色（与 PC 入口同一套顺序）。 */
void applyTheme(getThemePreference()).then(() => {
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
}).catch(() => {
  document.getElementById('root')!.textContent = '主题加载失败，请刷新页面重试。'
})
