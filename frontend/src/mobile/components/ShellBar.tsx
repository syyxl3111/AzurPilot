/**
 * 页眉：与 PC `.topbar` 同款毛玻璃（透明底 + 一层 .glass-material + 玻璃描边），
 * 左侧菜单键 + 大号页名，右侧按条件出现刷新与设置。
 *
 * 三处刻意的设计：
 *   1. 页名左对齐并占 20px/700 —— 手机上没有侧边栏，页名是用户唯一能确认
 *      「我在哪」的文字；居中小标题做不到这一点。
 *   2. ⟳ 与 ⚙ 只由 appHost 决定，且判定收在组件内部（topBarActions）。调用方
 *      即使把 onRefresh / onSettings 传进来，浏览器里也不会渲染 —— 这条产品规则
 *      「浏览器用户进不了设置页」不能靠每个调用点自觉。
 *   3. 页眉是 position:fixed，高度由 --m-bar-h + 安全区决定，骨架 .m-shell 负责
 *      让出同位高度。返回键走真正的历史返回（见 backGuard），不用 replace，
 *      否则 Android 的返回手势会直接退出应用。
 */
import { ChevronLeft, Menu, RefreshCw, Settings } from 'lucide-react'
import type { ReactNode } from 'react'
import { topBarActions } from '../shell'
import type { MobileTranslator } from '../i18n'

interface Props {
  title: string
  /** 子页面标题下面的次要行，例如任务键 EventA */
  subtitle?: string
  /** 传入则左侧显示返回箭头，否则显示菜单键 */
  onBack?: () => void
  onMenu?: () => void
  /** 是否运行在 App 宿主内（isAppHost 的结果）。决定 ⟳ 与 ⚙ 是否出现。 */
  appHost?: boolean
  onRefresh?: () => void
  onSettings?: () => void
  refreshing?: boolean
  /** 页名右侧的附加内容，例如统计页的类目说明 */
  extra?: ReactNode
  /** 交互文案。四个图标按钮**只有无障碍名**，必须跟着界面语言走（手机端支持 5 种语言）。 */
  ui: MobileTranslator
}

function BarButton({label, accent, onClick, children}: {
  label: string
  accent?: boolean
  onClick?: () => void
  children: ReactNode
}) {
  return <button type="button" aria-label={label} title={label} onClick={onClick}
    className={accent ? 'm-bar-button m-bar-button-accent' : 'm-bar-button'}>{children}</button>
}

export function ShellBar({
  title, subtitle, onBack, onMenu, appHost, onRefresh, onSettings, refreshing, extra, ui,
}: Props) {
  const actions = topBarActions(Boolean(appHost))
  return <header className="m-bar">
    {/* 毛玻璃层：PC 的类，自带 --theme-glass 与 backdrop-filter */}
    <div className="glass-material" aria-hidden="true" />
    <div className="m-bar-inner">
      {onBack
        ? <BarButton label={ui('mobile.bar.back')} accent onClick={onBack}><ChevronLeft size={24} /></BarButton>
        : <BarButton label={ui('mobile.bar.menu')} onClick={onMenu}><Menu size={24} /></BarButton>}
      <div className="m-bar-heading">
        <h1 className="m-bar-title">{title}</h1>
        {subtitle ? <div className="m-bar-subtitle">{subtitle}</div> : null}
      </div>
      {extra}
      {actions.refresh && onRefresh
        ? <BarButton label={ui('mobile.bar.refresh')} accent onClick={onRefresh}>
            <RefreshCw size={21} className={refreshing ? 'spin' : undefined} />
          </BarButton>
        : null}
      {actions.settings && onSettings
        ? <BarButton label={ui('mobile.bar.settings')} accent onClick={onSettings}><Settings size={21} /></BarButton>
        : null}
    </div>
  </header>
}
