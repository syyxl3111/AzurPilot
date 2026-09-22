/**
 * 日志缓冲的合并规则（**与 PC 的 `LogPanel` 同一套**）。
 *
 * 单独成模块，一是因为它有明确的正确性要求（去重、排序、上限、reset 语义），
 * 二是因为正式入口与 PC 都依赖它 —— 放在组件里就没人能单独测。
 *
 * 为什么必须去重：`logs.get` 与 2 秒一次的事件推送会给出**重叠**的一段。直接
 * `[...previous, ...entries]` 会把同一批日志重复追加（切到截图 tab 会重订阅，
 * 于是再重复一次）；后端裁剪缓冲的那一次还会让区间回退，结果就是整段乱序。
 */
import type { LogEntry } from '../api/types'

/**
 * 日志保留上限：**与后端对齐的 400 行**，不是随便挑的数。
 *
 * 后端每实例只留最近 400 条（`runtime_service.logs` 里的 `cache['entries'][-400:]`，
 * `process_manager` 的 `renderables` 上限同为 400），`logs.get` 单次最多也就给 400 条。
 * 客户端留更多只会让刷新前后条数对不上。
 */
export const LOG_CAP = 400

/** 合并一段增量：`reset` 表示后端裁剪过缓冲，此时以推送的整段为准。 */
export function mergeLogs(previous: LogEntry[], incoming: LogEntry[], reset: boolean): LogEntry[] {
  if (reset) return incoming.slice(-LOG_CAP)
  const byId = new Map(previous.map(entry => [entry.id, entry]))
  incoming.forEach(entry => byId.set(entry.id, entry))
  return [...byId.values()].sort((a, b) => a.id - b.id).slice(-LOG_CAP)
}
