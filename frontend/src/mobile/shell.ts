/**
 * 手机端外壳的纯逻辑：Tab 模型、抽屉项、App 宿主判定、相对时间与数值文案。
 *
 * 刻意不引入 React 与 react-router —— 这样单测可以直接跑（vitest 没有 jsdom），
 * 组件只负责把这里的结果渲染出来。
 */
import type { MobileKey } from './i18n'

/** 底部 Tab（顺序即渲染顺序）。设置不在其中：它只从 App 宿主的 ⚙ 进入。 */
export const TAB_KEYS = ['overview', 'instance', 'tasks', 'stats', 'logs'] as const
export type TabKey = (typeof TAB_KEYS)[number]

export interface TabDescriptor {
  key: TabKey
  labelKey: MobileKey
  path: string
}

const TAB_LABELS: Record<TabKey, MobileKey> = {
  overview: 'mobile.tab.overview',
  instance: 'mobile.tab.instance',
  tasks: 'mobile.tab.tasks',
  stats: 'mobile.tab.stats',
  logs: 'mobile.tab.logs',
}

/**
 * 生成底部 Tab 模型。
 *
 * 注意「实例」这一项当前渲染的是调度队列（运行中 / 队列中 / 等待中），
 * 与 Tab 名并不对应 —— 这是产品上确认过的「只是改名，内容不动」。
 * 将来若把内容换成实例列表，只改这里与对应 screen 即可。
 */
export function tabModel(instance: string): TabDescriptor[] {
  return TAB_KEYS.map(key => ({key, labelKey: TAB_LABELS[key], path: `/i/${instance}/${key}`}))
}

/** 判断当前是否运行在 App 宿主内。 */
export function isAppHost(search: string, bridgeInjected: boolean): boolean {
  if (bridgeInjected) return true
  return /[?&]app=1(?:&|$)/.test(search)
}

/** ⟳ 与 ⚙ 只在 App 宿主内出现。 */
export function topBarActions(appHost: boolean): {refresh: boolean; settings: boolean} {
  return {refresh: appHost, settings: appHost}
}

export type DrawerKey = 'home' | 'search' | 'download' | 'appearance' | 'language' | 'gallery' | 'about'

/** 抽屉项顺序；「组件测试」只在开发者模式打开时出现。 */
export function drawerModel(devMode: boolean): DrawerKey[] {
  const keys: DrawerKey[] = ['home', 'search', 'download', 'appearance', 'language']
  if (devMode) keys.push('gallery')
  keys.push('about')
  return keys
}

/**
 * 从未采集的资源，配置里的哨兵时间。
 *
 * 只在本模块内用（`isNeverRecorded`）：外壳没有路由，所以这里也不需要
 * `routeGuard` 之类的守卫 —— 屏幕由 `MobileShell` 的 state 管，不经过 URL 匹配。
 */
const NEVER_RECORDED = '2020-01-01 00:00:00'

export function isNeverRecorded(record: string | null | undefined): boolean {
  if (!record) return true
  return record.replace('T', ' ').trim() === NEVER_RECORDED
}

/**
 * 相对时间；超过 7 天直接给日期。now 由调用方传入，便于测试。
 *
 * 文案**必须由调用方注入**（`ui`）：手机端支持 5 种语言，写死中文的话英文/日文界面上
 * 资源卡的采集时间会一直是「3 分钟前」。`ui` 收 `MobileKey`，键在 i18n.ts 里登记。
 */
export function relativeTime(
  record: string | null | undefined,
  now: Date,
  ui: (key: MobileKey, params?: {count: number}) => string,
): string {
  if (isNeverRecorded(record)) return ''
  const timestamp = new Date(String(record).replace(' ', 'T')).getTime()
  if (!Number.isFinite(timestamp)) return ''
  const seconds = Math.max(0, Math.round((now.getTime() - timestamp) / 1000))
  if (seconds < 60) return ui('mobile.time.justNow')
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return ui('mobile.time.minutesAgo', {count: minutes})
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return ui('mobile.time.hoursAgo', {count: hours})
  const days = Math.floor(hours / 24)
  if (days <= 7) return ui('mobile.time.daysAgo', {count: days})
  return String(record).replace('T', ' ').slice(0, 10)
}

export interface ResourceLike {
  value: number | null | undefined
  limit?: number | null
  total?: number | null
}

export interface ResourceText {
  /** 主数值 */
  main: string
  /** 「/ 上限」，没有上限时为空串 */
  limit: string
  /** 「（未开箱总行动力）」，没有总行动力时为空串 */
  total: string
}

function formatNumber(value: number, locale = 'zh-CN'): string {
  return value.toLocaleString(locale, {maximumFractionDigits: 0})
}

/**
 * 资源行的数值文案。
 *
 * 行动力走 `total`（未开箱总行动力）分支并显示成 `148（3,080）`，
 * 与「带上限的资源显示 值 / 上限」互斥 —— 后端只有 ActionPoint 同时可能给出两者中的 total。
 */
export function resourceValueText(resource: ResourceLike, locale = 'zh-CN'): ResourceText {
  const value = resource.value
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return {main: '—', limit: '', total: ''}
  }
  const main = formatNumber(value, locale)
  const total = resource.total
  if (typeof total === 'number' && Number.isFinite(total) && total > 0) {
    return {main, limit: '', total: `（${formatNumber(total, locale)}）`}
  }
  const limit = resource.limit
  if (typeof limit === 'number' && Number.isFinite(limit) && limit > 0) {
    return {main, limit: `/ ${formatNumber(limit, locale)}`, total: ''}
  }
  return {main, limit: '', total: ''}
}
