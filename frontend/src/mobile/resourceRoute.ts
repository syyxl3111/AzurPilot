/**
 * 资源 → 统计类目的分流。
 *
 * 为什么需要分流：总览有 12 种资源，但后端 `statistics.report(category='resources')`
 * 只吐 9 条 series —— `module/api/statistics_service.py` 的 resource_items 明确排除了
 * ActionPoint / YellowCoin / PurpleCoin。这三种在 PC 上属于「大世界趋势」
 * （category='action'，按月份，数据源是 opsi_month 的快照表而不是资源快照表）。
 *
 * 所以点「行动力」卡片不能落到资源趋势，否则是一个空图。
 */
import type { UiKey } from '../i18n'

export type StatsCategory = 'resources' | 'action' | 'opsi' | 'commission' | 'ships' | 'loot'

export interface ResourceRoute {
  category: StatsCategory
  /** 目标类目里要预选的 series key（后端给的键名，不是资源名）。 */
  seriesKey: string
}

/** 次级 Tab 栏的类目顺序与文案，与 PC 的统计页一致。 */
export const STATS_CATEGORIES: Array<{key: StatsCategory; labelKey: UiKey}> = [
  {key: 'resources', labelKey: 'stats.category.resources'},
  {key: 'action', labelKey: 'stats.category.action'},
  {key: 'opsi', labelKey: 'stats.category.opsi'},
  {key: 'commission', labelKey: 'stats.category.commission'},
  {key: 'ships', labelKey: 'stats.category.ships'},
  {key: 'loot', labelKey: 'stats.category.loot'},
]

/** 资源快照表里的列名即 resources 类目的 series key。 */
const RESOURCE_SNAPSHOT_ROUTES: Record<string, ResourceRoute> = {
  Oil: {category: 'resources', seriesKey: 'oil'},
  Coin: {category: 'resources', seriesKey: 'coin'},
  Gem: {category: 'resources', seriesKey: 'gem'},
  Pt: {category: 'resources', seriesKey: 'pt'},
  Cube: {category: 'resources', seriesKey: 'cube'},
  Core: {category: 'resources', seriesKey: 'core'},
  Medal: {category: 'resources', seriesKey: 'medal'},
  Merit: {category: 'resources', seriesKey: 'merit'},
  GuildCoin: {category: 'resources', seriesKey: 'guild_coin'},
}

/** 大世界类目的 series key：ap / asset / distance / yellow_coins / purple_coins。 */
const OPSI_ROUTES: Record<string, ResourceRoute> = {
  ActionPoint: {category: 'action', seriesKey: 'ap'},
  YellowCoin: {category: 'action', seriesKey: 'yellow_coins'},
  PurpleCoin: {category: 'action', seriesKey: 'purple_coins'},
}

const ROUTES: Record<string, ResourceRoute> = {...RESOURCE_SNAPSHOT_ROUTES, ...OPSI_ROUTES}

/** 返回该资源的统计落点；未知资源返回 null（调用方回落到资源趋势首项）。 */
export function resourceRoute(resourceName: string): ResourceRoute | null {
  return ROUTES[resourceName] ?? null
}
