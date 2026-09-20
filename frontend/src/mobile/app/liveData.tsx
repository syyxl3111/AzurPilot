/**
 * 正式入口的数据源：把 `/api/v1/ws` 的真实数据映射到 `MobileData` 契约。
 *
 * 一件事刻意交给 `AppProvider` 做：连接、`instances.list`、`schema.get`、
 * 语言/主题、Toast。这些在 PC 端已经有了，手机端再写一遍只会两套行为不一致。
 * 这里只补手机端独有的几件事：**当前实例**的总览 / 日志 / 统计 / 配置。
 *
 * 写路径**不新造**：直接复用 PC 的 `config/EditQueue`（排队、去重、失败退避重试、
 * sessionStorage 草稿、断线恢复），所以手机端改的配置会走和 PC 完全一样的
 * `config.patch` 单飞串行队列；连「启动 / 运行前先等未保存修改排空」这道闸门
 * （`settled()`）也一并沿用。
 *
 * 三处真实数据的坑（都在注释里标了）：
 *   1. `resources[].label` 是后端 `configs.translate()` 的产物，查不到会退化成
 *      路径末段 —— 实测返回字符串 `"name"`。所以 label 一律由 `resourceLabel()` 算。
 *   2. `instance.server` 是配置里的**原始值**（实测是 `cn_android-29` 这种），
 *      不是 `cn`。显示要交给 schema 翻译 `Emulator.ServerName.*`，PC 也是这么做的。
 *   3. `overview.tasks` **只含已启用的任务**（`Scheduler.Enable` 为真或正在跑），
 *      所以「不在表里」= 没被调度器接管；任务页的启用徽标就靠这个判据。
 */
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react'
import { api } from '../../api/client'
import type { Config, LogEntry, Logs, Overview, Preview, Value } from '../../api/types'
import { useApp, useConnection } from '../../app/context'
import { editor, prepareValue } from '../../config/editors'
import type { Edit, EditQueue } from '../../config/EditQueue'
import {
  MobileDataContext, type InstanceOps, type MobileData, type QueueGroups,
  type StatsQuery, type StatsReport, type StatsState, type TaskSchedule,
} from '../data'
import { buildTaskConfig, lookupField } from '../taskConfig'
import { mergeLogs } from '../logs'
import { resourceLabel } from '../resourceLabel'
import type { MobileTranslator } from '../i18n'
import type { InstanceView } from '../components/InstanceCard'
import type { ResourceView } from '../components/ResourceCard'

const EMPTY_QUEUE: QueueGroups = {running: [], pending: [], waiting: []}
const EMPTY_EDITS: {edits: Record<string, Edit>; storageError: string} = {edits: {}, storageError: ''}
/** 空的订阅/快照：还没有实例时占位，避免条件式调用 hook。 */
const noopSubscribe = () => () => { /* 没有实例就没有队列可订 */ }
const emptySnapshot = () => EMPTY_EDITS

function currentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function useOverview(instance: string | null, ready: boolean, onError: (message: string | null) => void) {
  const [overview, setOverview] = useState<Overview | null>(null)
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    if (!ready || !instance) { setOverview(null); return }
    let active = true
    void api.request('overview.get', {instance})
      .then(value => { if (active) { setOverview(value); onError(null) } })
      .catch(error => { if (active) onError(error.message) })
    return () => { active = false }
  }, [ready, instance, onError, revision])
  useEffect(() => api.onEvent(event => {
    if (!instance || event.topic !== 'overview') return
    const payload = event.data as Overview
    if (payload.instance === instance) setOverview(payload)
  }), [instance])
  /* 页眉的「刷新」用它重拉一次；推送只覆盖变化，拉一次能补齐漏掉的帧 */
  const reload = useCallback(() => setRevision(value => value + 1), [])
  return [overview, reload] as const
}

/**
 * 日志：合并规则在 `../logs` 里，**与 PC 的 `LogPanel` 逐字一致** —— 它必须按 `id`
 * 去重再排序，否则 GET 与事件推送的重叠段会被重复追加（详见那个模块的注释）。
 */
function useLogs(instance: string | null, ready: boolean) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  /* 后端游标：`cursor` 比上一轮小说明 API 进程重启过（id 从 1 重算），
     此时「清空」留下的 floor 必须归零，否则日志永远是一片空白。 */
  const [cursor, setCursor] = useState(0)
  /* 历史：切实例重拉一次 */
  useEffect(() => {
    if (!ready || !instance) { setLogs([]); setCursor(0); return }
    let active = true
    void api.request('logs.get', {instance})
      .then(value => {
        if (!active) return
        setLogs(previous => mergeLogs(previous, value.entries, value.reset))
        setCursor(value.cursor)
      })
      .catch(() => { /* 日志拉不到不该拖垮其它屏 */ })
    return () => { active = false }
  }, [ready, instance])
  /* 增量：`reset` 表示后端裁剪过缓冲，此时以推送的整段为准 */
  useEffect(() => api.onEvent(event => {
    if (!instance || event.topic !== 'logs') return
    const payload = event.data as Logs
    if (payload.instance !== instance) return
    setLogs(previous => mergeLogs(previous, payload.entries, payload.reset))
    setCursor(payload.cursor)
  }), [instance])
  return {logs, cursor}
}

/**
 * 统计：唯一数据源就是 PC 也在用的 `statistics.report`。
 *
 * **不要退回 `statistics.resources`** —— 那个接口一次只能取一种资源（手机端原先写死
 * ActionPoint，于是 6 个类目画的都是同一条行动力曲线），而且它给不出 metrics / tables。
 * 查询条件与 PC 的统计页一一对应，参数名也一致。
 */
function useStats(instance: string | null, ready: boolean): StatsState {
  const [query, setQueryState] = useState<StatsQuery>(() => ({
    /* 分桶默认「每小时」而不是「每条记录」：手机画的是手写 SVG 折线，7 天全量原始点
       有几千个，窄屏既看不清也白费性能。PC 用 ECharts + dataZoom，默认值可以不同。 */
    category: 'resources', days: 7, month: currentMonth(), period: 'month', seriesKey: null, bucket: 60,
  }))
  const [report, setReport] = useState<StatsReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [revision, setRevision] = useState(0)
  const {category, days, month, period} = query
  useEffect(() => {
    if (!ready || !instance) { setReport(null); return }
    let active = true
    setLoading(true); setReport(null); setError(null)
    void api.request('statistics.report', {instance, category, days, month, period})
      .then(value => {
        if (!active) return
        setReport({
          category: value.category as StatsQuery['category'], month: value.month,
          metrics: value.metrics, series: value.series, tables: value.tables, notes: value.notes,
        })
      })
      .catch((failure: Error) => { if (active) setError(failure.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [ready, instance, category, days, month, period, revision])

  const setQuery = useCallback((patch: Partial<StatsQuery>) => {
    setQueryState(previous => {
      const next = {...previous, ...patch}
      /* 换类目就必须丢掉上一类的 seriesKey —— 键名在类目之间没有交集（oil vs ap） */
      if (patch.category && patch.category !== previous.category && patch.seriesKey === undefined) {
        next.seriesKey = null
      }
      return next
    })
  }, [])

  const refresh = useCallback(() => {
    if (!instance) return
    setRefreshing(true)
    /* 掉落明细是本地缓存的聚合结果，PC 的刷新会先让后端重算一次 */
    const prepared = category === 'loot'
      ? api.request('statistics.refreshLoot', {instance})
      : Promise.resolve()
    void prepared.catch((failure: Error) => setError(failure.message))
      .finally(() => { setRevision(value => value + 1); setRefreshing(false) })
  }, [instance, category])

  return useMemo(
    () => ({query, report, loading, error, refreshing, setQuery, refresh}),
    [query, report, loading, error, refreshing, setQuery, refresh])
}

/**
 * 配置写入队列。
 *
 * 队列实例**与 PC 共用同一把**（`editor('config:' + 实例)` 是模块级单例），
 * 所以手机端和电脑端打开同一个实例时，未确认的草稿落在同一个 sessionStorage 键上，
 * 提交也走同一套 `config.patch` 串行化 —— 不是各写一套然后行为不一致。
 */
function useConfigQueue(instance: string | null) {
  const queue = instance ? editor(`config:${instance}`) : null
  const snapshot = useSyncExternalStore(
    queue ? queue.subscribe : noopSubscribe,
    queue ? queue.getSnapshot : emptySnapshot,
  )
  return [queue, snapshot.edits] as const
}

/**
 * `config.get`，带回「在拉 / 拉失败」两个状态 —— 别把在拉画成「这个任务没有配置」。
 *
 * **必须照 PC 的 `pages/TaskConfig.tsx` 做 `reconcile`**：拉取前记下已确认（`saved`）
 * 的字段，拉取成功后把它们从队列里回收。少了这一步，`buildTaskConfig` 会永远优先
 * 那份已经作废的本地值 —— 编辑过的字段此后再也接受不到服务端推送（调度器改写的
 * `NextRun` 就看不到了），状态徽标也永久钉在「已保存」。
 */
function useConfig(instance: string | null, ready: boolean, task: string | null, queue: EditQueue | null) {
  const [config, setConfig] = useState<Config | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    /* 整份配置不小，只在真的要打开任务配置页时才拉 */
    if (!ready || !instance || !task) { setConfig(null); setError(null); return }
    let active = true
    const confirmed = queue?.confirmed() ?? {}
    setLoading(true); setError(null)
    void api.request('config.get', {instance})
      .then(value => {
        if (!active) return
        setConfig(value)
        queue?.reconcile(confirmed)
      })
      .catch((failure: Error) => { if (active) { setConfig(null); setError(failure.message) } })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [ready, instance, task, revision, queue])
  const reload = useCallback(() => setRevision(value => value + 1), [])
  return {config, loading, error, reload}
}

/** 把 overview.tasks 按后端给的 `state` 分三组 —— 前端不自己推断状态。 */
function groupQueue(overview: Overview | null, label: (task: string) => string): QueueGroups {
  if (!overview) return EMPTY_QUEUE
  const queue: QueueGroups = {running: [], pending: [], waiting: []}
  for (const task of overview.tasks) {
    queue[task.state].push({name: task.name, label: label(task.name), nextRun: task.nextRun})
  }
  return queue
}

/** 任务键 → 调度状态。**只含已启用的任务**，任务页据此标出启用情况。 */
function scheduleOf(overview: Overview | null): Record<string, TaskSchedule> {
  const result: Record<string, TaskSchedule> = {}
  for (const task of overview?.tasks ?? []) {
    result[task.name] = {state: task.state, nextRun: task.nextRun, pending: task.pending}
  }
  return result
}

export function useLiveData(
  instance: string | null, task: string | null, ui: MobileTranslator,
): MobileData {
  const {instances: rawInstances, schema, t} = useApp()
  const connection = useConnection()
  const ready = connection === 'ready'
  const [error, setError] = useState<string | null>(null)
  /**
   * 拉取失败的红条要能自己消失。
   *
   * 只在 `connection` 变化时清是不够的：连接一直是 ready，于是「总览失败一次」之后
   * 红条会永久挂在每一屏上，重试成功也消不掉。所以成功回调里也要清。
   */
  const onError = useMemo(() => (message: string | null) => setError(message), [])

  useEffect(() => {
    if (connection === 'ready') setError(null)
  }, [connection])

  /* 截图：与 PC 一致 —— 只有打开「截图」tab 才订 preview topic，收到帧就存下来。
     声明放在订阅之前：下面的 topics 要用 previewEnabled。 */
  const [previewEnabled, setPreviewEnabled] = useState(false)
  const [preview, setPreview] = useState<Preview | null>(null)
  useEffect(() => {
    setPreview(null)   /* 切实例必须清空，否则会留着上一个实例的图 */
  }, [instance])
  useEffect(() => api.onEvent(event => {
    if (!instance || event.topic !== 'preview') return
    const frame = event.data as Preview
    if (frame.instance === instance) setPreview(frame)
  }), [instance])

  /* 订阅：实例列表由 AppProvider 管，这里只订当前实例的推送 */
  useEffect(() => {
    if (!ready) return
    void api.request('events.subscribe', {
      instance,
      topics: instance
        ? (previewEnabled ? ['instances', 'overview', 'logs', 'preview'] : ['instances', 'overview', 'logs'])
        : ['instances'],
    }).catch(error => setError((error as Error).message))
  }, [ready, instance, previewEnabled])

  const [overview, reloadOverview] = useOverview(instance, ready, onError)
  const {logs, cursor: logsCursor} = useLogs(instance, ready)
  const stats = useStats(instance, ready)
  /* 队列要先于 useConfig 拿：拉完配置要用它回收已确认的草稿（reconcile） */
  const [queue, edits] = useConfigQueue(instance)
  const {config, loading: configLoading, error: configError, reload: reloadConfig} =
    useConfig(instance, ready, task, queue)

  /* 改一个配置项：数值的中间态保护（空串、负号、小数点）交给 PC 的 prepareValue，
     格式错误只留在本地、不进网络 —— 与 PC 的 TaskConfig 一模一样。 */
  const patchTaskConfig = useCallback((path: string, value: Value) => {
    if (!queue) return
    const field = lookupField(schema, path)
    const {payload, error: invalid} = field
      ? prepareValue(value, field)
      : {payload: value, error: undefined}
    queue.change(path, value, payload, invalid)
  }, [queue, schema])

  const retryTaskConfig = useCallback(() => queue?.retry(), [queue])

  /* 启停：后端要拉起/回收整个工作进程，快则一秒慢则十几秒，所以全程 starting=true。
     启动前必须等未保存的修改写完 —— 否则会带着半截配置把调度器拉起来（PC 同款闸门）。 */
  const [starting, setStarting] = useState(false)
  const toggleScheduler = useCallback(async (next: 'start' | 'stop') => {
    if (!instance) throw new Error(ui('mobile.app.noInstance'))
    setStarting(true)
    try {
      if (next === 'start') await queue?.settled()
      await api.request(next === 'start' ? 'scheduler.start' : 'scheduler.stop', {instance})
    } finally {
      setStarting(false)
    }
  }, [instance, queue, ui])

  /* 立即执行某个任务。后端 `tasks.run` 只是把任务交给调度器，不等它跑完。
     同样先等配置队列排空：PC 的「运行工具」按钮也是这个前置。 */
  const runTask = useCallback(async (taskName: string) => {
    if (!instance) throw new Error(ui('mobile.app.noInstance'))
    await queue?.settled()
    await api.request('tasks.run', {instance, task: taskName})
  }, [instance, queue, ui])

  const instances = useMemo<InstanceView[]>(
    () => rawInstances.map(item => ({
      name: item.name, status: item.status, serial: item.serial,
      server: item.server, currentTask: item.currentTask,
    })), [rawInstances])

  const resources = useMemo<ResourceView[]>(
    () => (overview?.resources ?? []).map(item => ({
      name: item.name,
      label: resourceLabel(item.name, ui),
      value: item.value ?? null,
      limit: item.limit ?? null,
      total: item.total ?? null,
      record: item.record ?? null,
    })), [overview, ui])

  const taskGroups = useMemo(
    () => Object.entries(schema?.menu ?? {}).map(([key, group]) => ({
      key, name: t(`Menu.${key}.name`), page: group.page, tasks: group.tasks,
    })), [schema, t])

  const taskLabel = useCallback((taskKey: string) => t(`Task.${taskKey}.name`), [t])

  const taskConfig = useMemo(
    () => buildTaskConfig(schema, config, task, t, edits), [schema, config, task, t, edits])

  const refresh = useCallback(() => { reloadOverview(); reloadConfig() }, [reloadOverview, reloadConfig])

  /* 实例级操作：与 PC 的 InstanceActions / CreateInstance 同一批接口。
     删除前必须先取 revision —— 后端用它做乐观并发校验。 */
  const {refresh: reloadInstances} = useApp()
  const [instanceBusy, setInstanceBusy] = useState(false)
  const instanceOps = useMemo<InstanceOps>(() => ({
    busy: instanceBusy,
    readStartup: async name => (await api.request('startup.get', {instance: name})).enabled,
    setStartup: async (name, enabled) => {
      setInstanceBusy(true)
      try { await api.request('startup.set', {instance: name, enabled}) } finally { setInstanceBusy(false) }
    },
    remove: async name => {
      setInstanceBusy(true)
      try {
        const current = await api.request('config.get', {instance: name})
        await api.request('instances.delete', {instance: name, revision: current.revision})
        await reloadInstances()
      } finally { setInstanceBusy(false) }
    },
    create: async (name, source) => {
      setInstanceBusy(true)
      try {
        await api.request('instances.create', {name, source: source || null})
        await reloadInstances()
      } finally { setInstanceBusy(false) }
    },
  }), [instanceBusy, reloadInstances])

  return {
    ready,
    error,
    instances,
    current: instance,
    status: overview?.status ?? 'stopped',
    statusKnown: Boolean(overview),
    queue: groupQueue(overview, taskLabel),
    schedule: scheduleOf(overview),
    resources,
    taskGroups,
    taskTotal: taskGroups.reduce((sum, group) => sum + group.tasks.length, 0),
    taskLabel,
    taskConfig,
    taskConfigLoading: configLoading,
    taskConfigError: configError,
    patchTaskConfig,
    retryTaskConfig,
    logs,
    logsCursor,
    preview,
    setPreviewEnabled,
    stats,
    starting,
    toggleScheduler,
    runTask,
    instanceOps,
    /** 页眉的 ⟳：重拉总览与当前任务的配置 */
    refresh,
    resourceLabel: key => resourceLabel(key, ui),
    t,
  }
}

export function LiveDataProvider({instance, task, ui, children}: {
  instance: string | null
  task: string | null
  ui: MobileTranslator
  children: ReactNode
}) {
  const data = useLiveData(instance, task, ui)
  return <MobileDataContext.Provider value={data}>{children}</MobileDataContext.Provider>
}
