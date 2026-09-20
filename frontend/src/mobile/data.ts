/**
 * 手机端的数据契约。
 *
 * 屏幕组件只认这个接口，**不认数据来源**：评审入口（mobile-mockup.html）喂假数据，
 * 正式入口（mobile.html）喂 `/api/v1/ws` 的真实数据。两边共用同一批屏幕组件，
 * 所以「评审时看到的」和「真机上跑的」是同一套 UI 代码 —— 不会各画一套然后慢慢漂移。
 *
 * 形状是照着真实接口定的（对 25548 实测过）：
 *   · `instances.list`            → MobileData.instances
 *   · `overview.get`              → MobileData.status / queue / schedule / resources
 *   · `logs.get` + `logs` 事件    → MobileData.logs
 *   · `statistics.report`         → MobileData.stats
 *   · `schema.get` 的 menu        → MobileData.taskGroups / taskTotal
 *   · `config.get`                → MobileData.taskConfig
 *   · `config.patch`              → MobileData.patchTaskConfig
 * 三处**必须注意**的真实字段陷阱见各自的注释。
 */
import { createContext, useContext } from 'react'
import type { LogEntry, Scalar, Status, Value } from '../api/types'
import type { InstanceView } from './components/InstanceCard'
import type { ResourceView } from './components/ResourceCard'
import type { StatsCategory } from './resourceRoute'

/** 调度队列里的一条任务。`state` 与后端 `overview.get` 的取值一致。 */
export interface QueueTask {
  name: string
  label: string
  nextRun?: string
}

/** 队列按 `state` 分好的三组。后端直接给 `state`，不需要前端再推断。 */
export interface QueueGroups {
  running: QueueTask[]
  pending: QueueTask[]
  waiting: QueueTask[]
}

/**
 * 某个任务的调度状态。
 *
 * 后端的 `overview.tasks` **只包含已启用的任务**（`<Task>.Scheduler.Enable` 为真，
 * 或者此刻正在跑那一个），所以「不在表里」就等于「这个任务没被调度器接管」。
 * 手机端的任务页据此标出启用状态与下次运行时间 —— 否则对着一长串 menu 任务干瞪眼，
 * 根本看不出到底哪几个真的会被跑，任务页与调度器就像两个互不相干的世界。
 */
export interface TaskSchedule {
  state: 'running' | 'pending' | 'waiting'
  /** 后端给的原始 `NextRun`（本地时间字符串，可能是空串）。 */
  nextRun: string
  /** 下一次运行时间是否已经到点。 */
  pending: boolean
}

/** 任务配置页的一个字段，带编辑所需的全部元信息。 */
export interface TaskConfigField {
  /** 完整配置路径 `<Task>.<Group>.<Argument>`，提交时按它写回。 */
  path: string
  label: string
  help?: string
  /** schema 给的原生值类型：checkbox / select / input / textarea / datetime / … */
  type: string
  mode?: string
  /** select / multiselect 的可选项。 */
  options?: Value[]
  /** 当前值（含本地未确认的草稿）。 */
  value: Value
  /** 只读：`display` 受限，或类型本身就是运行期产物（storage/state/lock）。 */
  readonly: boolean
  /** 本地提交状态，用于行内回显；没有改动时为 undefined。 */
  edit?: ConfigEdit
}

/** 一个配置项的本地提交状态（与 PC `config/EditQueue` 的 Edit 对齐）。 */
export interface ConfigEdit {
  status: 'queued' | 'saving' | 'saved' | 'error'
  /** 失败原因（后端返回的原文），显示在行内，让人知道为什么没存上。 */
  error?: string
}

export interface TaskConfigGroup {
  /** menu.json 里的分组键，同时也是配置路径的第二段。 */
  key: string
  title: string
  fields: TaskConfigField[]
}

/** 任务分组。`key` 是 menu.json 里的分组键（进 URL、做 identity），`name` 是显示名。 */
export interface TaskGroup {
  key: string
  name: string
  /** menu 的 `page`：`tool` 表示这组是工具页（没有 `Scheduler.Enable`，要手动运行）。 */
  page: string
  tasks: string[]
}

export type StatsPeriod = 'day' | 'week' | 'month'

/** 统计报表里的一条曲线；`source` 是后端的采集来源，可能为空。 */
export interface StatsSeries {
  key: string
  label: string
  points: Array<{time: string; value: number; source?: string}>
}

/** 统计报表里的一张明细表。行是「标量数组」，列名另给。 */
export interface StatsTable {
  title: string
  columns: string[]
  rows: Scalar[][]
  note?: string
}

/** `statistics.report` 的结果，去掉 instance 字段（那是外壳的事）。 */
export interface StatsReport {
  category: StatsCategory
  /** 后端回填的月份，用于导出文件名。 */
  month: string
  metrics: Array<{label: string; value: number | null; unit: string}>
  series: StatsSeries[]
  tables: StatsTable[]
  notes: string[]
}

/** 统计页的查询条件。**与 PC 的统计页一一对应**，不是手机端自己发明的参数。 */
export interface StatsQuery {
  category: StatsCategory
  /** resources 类目的回溯天数（PC 是 1 / 7 / 30 / 90 / 365）。 */
  days: number
  /** action / opsi / commission 类目的月份（YYYY-MM）。 */
  month: string
  period: StatsPeriod
  /** 当前选中的曲线 key；null = 自动取第一条有数据的。 */
  seriesKey: string | null
  /** 图表分桶（分钟）：0 = 每条记录，5 / 60 / 1440 由 `aggregatePoints` 聚合。 */
  bucket: number
}
export interface StatsState {
  query: StatsQuery
  report: StatsReport | null
  /** 首次/切类目时的加载态（页面显示骨架）。 */
  loading: boolean
  error: string | null
  /** 「刷新」按钮自己的忙碌态，与 loading 分开，按钮文案才不会闪。 */
  refreshing: boolean
  setQuery: (patch: Partial<StatsQuery>) => void
  /** 重新拉取。loot 类目会先让后端重算缓存（`statistics.refreshLoot`），与 PC 一致。 */
  refresh: () => void
}

/** 实例的新建 / 删除 / 开机自启。清一色是真接口，不是占位提示。 */
export interface InstanceOps {
  /** 实例操作进行中（删除 / 新建），调用方据此禁用按钮。 */
  busy: boolean
  /** 读某个实例的「开机自动运行」（`startup.get`）。 */
  readStartup: (name: string) => Promise<boolean>
  /** 写「开机自动运行」（`startup.set`）。 */
  setStartup: (name: string, enabled: boolean) => Promise<void>
  /**
   * 删除实例。
   *
   * 必须先 `config.get` 取 `revision` —— 后端拿它做乐观并发校验（`config_service.py`
   * 的 `instances.delete` 分支），PC 的 `InstanceActions` 也是这么走的。
   */
  remove: (name: string) => Promise<void>
  /** 新建实例（`instances.create`），`source` 为空表示用默认配置。 */
  create: (name: string, source: string) => Promise<void>
}

export interface MobileData {
  /** 首次数据是否就绪。真实数据要等一轮拉取，假数据恒为 true。 */
  ready: boolean
  /** 拉取失败的原因；由外壳决定怎么展示，屏幕组件不管。 */
  error: string | null
  instances: InstanceView[]
  /** 当前选中的实例名。单实例时就是唯一那个。 */
  current: string | null
  status: Status
  /**
   * `status` 是否来自真实的总览。
   *
   * 首帧 / 拉取失败时 `overview` 还是空的，此时**不能**按 `'stopped'` 渲染 ——
   * 那会让运行中的实例显示成「已停止」，点下去吃一个 `INSTANCE_RUNNING` 报错。
   */
  statusKnown: boolean
  queue: QueueGroups
  /** 任务键 → 调度状态；**只含已启用的任务**（见 `TaskSchedule`）。 */
  schedule: Record<string, TaskSchedule>
  resources: ResourceView[]
  taskGroups: TaskGroup[]
  taskTotal: number
  /** 任务键 → 显示文案。真实数据走 schema 翻译，假数据查本地表。 */
  taskLabel: (task: string) => string
  /** 任务配置页当前任务的分组字段。 */
  taskConfig: TaskConfigGroup[]
  /** `config.get` 还没回来（真数据是异步的，别把「在拉」画成「没有配置」）。 */
  taskConfigLoading: boolean
  taskConfigError: string | null
  /**
   * 改一个配置项并写回后端（`config.patch`）。
   *
   * 刻意**不返回 Promise**：提交走 PC 那套 `config/EditQueue`（排队、去重、失败退避重试、
   * 草稿持久化），状态通过 `TaskConfigField.edit` 回显。调用方只管发起，不负责重试。
   */
  patchTaskConfig: (path: string, value: Value) => void
  /** 重试所有失败的提交。 */
  retryTaskConfig: () => void
  /**
   * 调度器是否正在启停。
   *
   * 启停是**长动作**（后端要拉起/回收整个工作进程），期间按钮要转圈并失效 ——
   * 不失效的话用户会连点，后端那边是加锁的，第二次只会吃一个报错。
   */
  starting: boolean
  /** 启停调度器。失败时抛错，由调用方决定怎么提示（手机端统一走 Toast）。 */
  toggleScheduler: (next: 'start' | 'stop') => Promise<void>
  /** 立即执行某个任务（后端 `tasks.run`）。失败时抛错，调用方负责提示。 */
  runTask: (task: string) => Promise<void>
  logs: LogEntry[]
  /**
   * 后端日志游标（`logs` 事件里的 `cursor`）。
   *
   * 它比上一轮小 = API 进程重启过、`id` 从 1 重算 —— 此时「清空」留下的 floor
   * 必须归零，否则日志永远是一片空白。PC 的 `LogPanel` 就是这个判据。
   */
  logsCursor: number
  /**
   * 后端推来的**最新一帧**截图。
   *
   * 与 PC 同一套逻辑：打开「截图」tab 时把 `preview` 加进 `events.subscribe` 的 topics，
   * 之后靠推送更新。手机端**不主动抓图** —— 后端 `runtime_service.capture()` 的注释
   * 就是「只返回运行器已产生的最新帧，绝不主动截图」，否则会给正在跑的任务凭空加一次截图。
   */
  preview: {image: string | null; capturedAt: string | null} | null
  /** 「截图」tab 打开时置 true，决定要不要订阅 preview topic。 */
  setPreviewEnabled: (enabled: boolean) => void
  /** 统计：`statistics.report` 的查询条件 + 结果。 */
  stats: StatsState
  /**
   * 实例级操作。**与 PC 走同一批接口**（`components/InstanceActions.tsx` 与
   * `app/App.tsx` 的 CreateInstance），手机端不再用 Toast 假装做完。
   */
  instanceOps: InstanceOps
  /**
   * 页眉的 ⟳：重拉当前实例的总览与已打开任务的配置。
   *
   * 平时数据靠推送更新，但推送只覆盖「有变化」的帧；拉一次能补齐漏掉的。
   */
  refresh: () => void
  /**
   * 资源名 → 显示文案。
   *
   * **不要用接口返回的 `resources[].label`** —— 那是后端 `configs.translate('X._info.name')`
   * 的结果，查不到就退化成路径末段（实测会返回字符串 `"name"`）。PC 也是这么绕开的：
   * 它有一张 `resourceLabels` 表把 `Oil` 映射到 i18n key，这里沿用同一张表。
   */
  resourceLabel: (key: string) => string
  /** schema 文案翻译。分组名 / 任务名 / 服务器名（`Emulator.ServerName.*`）都走它。 */
  t: (key: string) => string
}

export const MobileDataContext = createContext<MobileData | null>(null)

export function useMobileData(): MobileData {
  const data = useContext(MobileDataContext)
  if (!data) throw new Error('useMobileData 必须在 MobileDataContext.Provider 内使用')
  return data
}
