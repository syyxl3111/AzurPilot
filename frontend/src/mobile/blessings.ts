/**
 * 首页祝福语词库。
 *
 * 三类各 8 条起步，随时可加。**固定简体中文、不进 i18n** —— 诗词与猫娘是中文
 * 语料，翻译过去就不是那个味了。
 *
 * 抽取规则（按产品确认）：**每次加载页面时抽一句**，抽定后缓存到本页生命周期，
 * 切换 Tab 不会变、刷新页面才换；没有手动重抽。本机记上一句，避免连续两次相同。
 */

export type BlessingCategory = 'poem' | 'plain' | 'catgirl'

export const blessings: Record<BlessingCategory, string[]> = {
  poem: [
    '长风破浪会有时，直挂云帆济沧海。',
    '潮平两岸阔，风正一帆悬。',
    '海上生明月，天涯共此时。',
    '会当凌绝顶，一览众山小。',
    '星垂平野阔，月涌大江流。',
    '云开远见汉阳城，犹是孤帆一日程。',
    '一帆风顺，满载而归。',
    '天接云涛连晓雾，星河欲转千帆舞。',
  ],
  plain: [
    '今天也顺利出航。',
    '愿你今天诸事顺遂。',
    '一路顺风，早点收工。',
    '祝你把把 S 评价。',
    '愿你今天不卡关。',
    '一切顺利，平安返航。',
    '祝你今天收获满满。',
    '愿你的舰队永远满编。',
  ],
  catgirl: [
    '今天也要加油喵~',
    '指挥官，出航顺利喵~',
    '愿你今天诸事顺遂喵~',
    '石油满满，心情好好喵~',
    '祝你今天大丰收喵~',
    '记得好好休息喵~',
    '一切都会顺利的喵~',
    '指挥官今天也很努力喵~',
  ],
}

/** 分类顺序即抽签顺序（诗句 → 白话 → 猫娘）。 */
const BLESSING_CATEGORIES: BlessingCategory[] = ['poem', 'plain', 'catgirl']

const LAST_KEY = 'azurpilot.mobile.blessing.last'

/** 全部条目，按分类顺序展开。 */
function allBlessings(): string[] {
  return BLESSING_CATEGORIES.flatMap(category => blessings[category])
}

/**
 * 随机抽一句。
 *
 * `random` 可注入，便于测试；`last` 用于避开上一句（词库只有 1 条时直接返回它）。
 * 抽不到任何条目时返回空串，由调用方回落到 PC 的 home.subtitle。
 */
export function pickBlessing(random: () => number = Math.random, last?: string): string {
  const pool = allBlessings()
  if (!pool.length) return ''
  const candidates = pool.length > 1 && last ? pool.filter(item => item !== last) : pool
  return candidates[Math.floor(random() * candidates.length)] ?? pool[0]
}

/**
 * 取本页的祝福语：首次调用时抽定并缓存，之后每次返回同一句。
 *
 * 这就是「每次加载页面刷新一句」的落点 —— 模块级的 memo 与页面生命周期同寿，
 * 刷新页面才会重新抽。
 */
let cached: string | undefined

export function currentBlessing(random: () => number = Math.random): string {
  if (cached !== undefined) return cached
  let last: string | undefined
  try {
    last = window.localStorage.getItem(LAST_KEY) ?? undefined
  } catch { /* 隐私模式等禁用存储时忽略，只是可能连续两次相同。 */ }
  cached = pickBlessing(random, last)
  try {
    if (cached) window.localStorage.setItem(LAST_KEY, cached)
  } catch { /* 同上。 */ }
  return cached
}
