/**
 * 实例卡：与 PC 首页的 `.instance-card` 同构 —— 头部（图标 + 状态徽标）/ 名称 /
 * 设备行 / 页脚（当前任务 + 箭头）。组件测试第 8 区那张预览卡用的是同一套类名，
 * 所以这里的改动会同时反映到那边。
 *
 * 两点手机端特有的处理：
 *   1. `.panel` 本身**没有内边距**（components.css 只给了背景、边框、圆角、阴影），
 *      PC 是靠 `.instance-card {padding: 26px}` 撑开的。那批规则在 home.css 里，
 *      而 home.css 不在手机端的样式栈里 —— 缺了它就会退化成「文字贴着边框」。
 *      补齐的规则在 mobile.css 的「实例卡」一节。
 *   2. `⋯` 是操作菜单入口。PC 首页的卡上没有它（实例操作在实例页里），
 *      手机端目前只有这一处入口，所以放在卡片右上角、绝对定位：
 *      这样整张卡可以是一个 `<a>`（内容模型合法、可键盘激活、长按能新开标签），
 *      而不必把按钮嵌在按钮里。
 */
import { ArrowRight, MoreHorizontal, Server } from 'lucide-react'
import type { Status } from '../../api/types'
import type { MobileTranslator } from '../i18n'

export interface InstanceView {
  name: string
  status: Status
  serial: string
  server: string
  currentTask?: string | null
}

interface Props {
  instance: InstanceView
  ui: MobileTranslator
  t: (key: string) => string
  /** 是否是当前选中的实例（外壳选中的那个）。多实例时点卡片会切换过去。 */
  current?: boolean
  onOpen: (instance: InstanceView) => void
  onMore: (instance: InstanceView) => void
}

/** 卡片链接指向实例总览这一屏；带上当前 URL 的其它参数（如 App 宿主的 app=1）。 */
function overviewHref(): string {
  const url = new URL(window.location.href)
  url.searchParams.set('screen', 'overview')
  return `${url.pathname}${url.search}`
}

export function InstanceCard({instance, ui, t, current, onOpen, onMore}: Props) {
  const statusText = {
    running: ui('status.running'),
    stopped: ui('status.stopped'),
    error: ui('status.error'),
    updating: ui('status.updating'),
  }[instance.status]
  const footer = instance.status === 'running'
    ? instance.currentTask ? t(`Task.${instance.currentTask}.name`) : ui('home.waitingSchedule')
    : instance.status === 'error' ? ui('status.error')
      : instance.status === 'updating' ? ui('status.updating') : ui('home.notRunning')
  return <div className="instance-card panel m-instance-card" data-current={current ? 'on' : undefined}>
    <a className="m-instance-open" href={overviewHref()}
      onClick={event => { event.preventDefault(); onOpen(instance) }}>
      <div className="instance-card-heading">
        <span className="home-instance-icon" aria-hidden="true"><Server size={22} /></span>
        <span className={`status ${instance.status}`}><i />{statusText}</span>
      </div>
      <h3>{instance.name}</h3>
      <div className="instance-device">
        {instance.server !== 'disabled'
          ? <span>{t(`Emulator.ServerName.${instance.server}`)}</span> : null}
        <span>{instance.serial}</span>
      </div>
      <div className="instance-card-footer">
        <span>{footer}</span>
        <ArrowRight size={17} aria-hidden="true" />
      </div>
    </a>
    <button type="button" className="icon-button m-instance-more"
      aria-label={ui('mobile.instance.more', {name: instance.name})}
      onClick={() => onMore(instance)}><MoreHorizontal size={18} /></button>
  </div>
}
