/**
 * 评审入口的数据源：把 `mockup/data.ts` 的假数据塞进 `MobileData` 契约。
 *
 * 这里只是**适配**，不产生任何新逻辑 —— 屏幕组件读的是同一份 `MobileData`，
 * 所以评审时看到的排版与真机一致。凡是「有逻辑」的部分一律调用真机那份实现：
 *
 *   · 配置页的字段摊平与可见性 → `../taskConfig` 的 `buildTaskConfig`（与正式入口同一个函数）；
 *   · 数值的中间态校验         → `../../config/editors` 的 `prepareValue`（PC 那份）；
 *   · 任务菜单与配置夹具       → `menuFixture.ts`（由真实 menu.json / args.json 生成）。
 *
 * 与真数据的三处差别，都在下方注释里标了：提交延时是本地 `setTimeout`、实例列表改在
 * 内存里、配置夹具只覆盖三个代表性任务（其余任务会显示「没有可配置项」——
 * 真机上它们是有配置的，这一点评审时要知道）。
 */
import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Config, Field, Schema, Value, Values } from '../../api/types'
import { prepareValue } from '../../config/editors'
import type { Edit } from '../../config/EditQueue'
import {
  MobileDataContext, type InstanceOps, type MobileData, type StatsQuery, type StatsState,
} from '../data'
import { buildTaskConfig } from '../taskConfig'
import {
  mockInstances, mockLogs, mockQueue, mockResources, mockSchedule, mockStatsReport, mockStatus,
} from './data'
import { MENU_GROUPS, MENU_TASK_LABELS, TASK_CONFIG_FIXTURES } from './menuFixture'

type Fixture = (typeof TASK_CONFIG_FIXTURES)[string]

/**
 * 示意图用的最小 t()：正式入口从 schema.translations 取，这里只覆盖用到的键。
 *
 * 导出是给 `mockApp.tsx` 的 AppContext 垫片用的 —— PC 的共用组件会通过 `useApp()`
 * 取 `t`，两处必须是同一份翻译，否则同一个任务名在页眉与列表里会不一样。
 *
 * 键名与真机一致 —— `instances.list` 的 `server` 是配置里的原始值（`cn_android-29`），
 * 翻译键就是 `Emulator.ServerName.cn_android-29`；写成 `Emulator.ServerName.cn`
 * 只会在示意图里成立，真机上根本命中不了。
 */
const SERVER_NAMES: Record<string, string> = {
  'Emulator.ServerName.cn_android-29': '[国服] 帷幕计划',
  'Emulator.ServerName.jp-0': '[日服] 寮',
  'Emulator.ServerName.en-0': '[美服] 白鹰',
  'Emulator.ServerName.tw-0': '[台服] 東煌',
}

/** 三个夹具的翻译表合并成一张 —— 键是 `Group.Arg.name`，任务之间不会撞。 */
const TRANSLATIONS: Record<string, string> = Object.assign(
  {}, ...Object.values(TASK_CONFIG_FIXTURES).map(fixture => fixture.translations))
const GROUP_LABELS: Record<string, string> = Object.assign(
  {}, ...Object.values(TASK_CONFIG_FIXTURES).map(fixture => fixture.groupLabels))

export function mockTranslate(key: string): string {
  if (TRANSLATIONS[key]) return TRANSLATIONS[key]
  if (key.endsWith('._info.name')) {
    const group = key.slice(0, -'._info.name'.length)
    if (GROUP_LABELS[group]) return GROUP_LABELS[group]
  }
  return SERVER_NAMES[key] ?? key.split('.').filter(part => part !== 'name' && part !== '_info').at(-1) ?? key
}

/** 从夹具拼出一份「和真机同形状」的 schema.args，喂给同一个 buildTaskConfig。 */
function fixtureSchema(fixture: Fixture | null): Schema | undefined {
  if (!fixture) return undefined
  return {menu: {}, args: {[fixture.task]: fixture.args}, translations: {}} as unknown as Schema
}

function fixtureValues(): Values {
  return Object.fromEntries(Object.entries(TASK_CONFIG_FIXTURES).map(([task, fixture]) => [task, fixture.values])) as Values
}

/** 从 `Task.Group.Argument` 反查夹具里的字段（与真机的 schema 查找同一形状）。 */
function fixtureField(path: string): Field | undefined {
  const [task, group, ...rest] = path.split('.')
  const args = TASK_CONFIG_FIXTURES[task]?.args as Record<string, Record<string, Field>> | undefined
  return args?.[group]?.[rest.join('.')]
}

/**
 * 示意图专用的占位帧。**故意做成一眼能看出是示意图的样子** —— 之前这里放的是
 * `/oil.webp`，正式入口接上真实数据后它变成了一张骗人的假截图。
 */
const MOCK_FRAME = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
    <rect width="640" height="360" fill="#101e2c"/>
    <text x="320" y="176" fill="#7f8fa4" font-size="26" font-family="sans-serif"
      text-anchor="middle">示意图占位帧</text>
    <text x="320" y="208" fill="#4d5f74" font-size="15" font-family="sans-serif"
      text-anchor="middle">真机上这里是运行器的实时截图</text>
  </svg>`)

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/** 当前打开的任务由 `MockupApp` 持有并传进来，与正式入口的 `?task=` 是同一个位置。 */
export function useMockData(task: string | null): MobileData {
  /* 评审入口的启停也要有真动作的样子：真的等一会儿、真的转圈、真的失效，
     否则「启动中转圈」这个交互在示意图上根本评审不到。 */
  const [status, setStatus] = useState(mockStatus)
  const [starting, setStarting] = useState(false)
  const toggleScheduler = useCallback(async (next: 'start' | 'stop') => {
    setStarting(true)
    await wait(1200)
    setStatus(next === 'start' ? 'running' : 'stopped')
    setStarting(false)
  }, [])
  /* 示意图里也要有真动作的样子：等一会儿、给结果，否则「立即执行」评不到反馈 */
  const runTask = useCallback(async () => { await wait(600) }, [])

  /* 配置改动：本地队列的**行为**照抄 PC 的 EditQueue —— 先落 queued，再 saving，
     最后 saved；格式错误（`prepareValue` 判定）直接落 error，不进「网络」。 */
  const [values, setValues] = useState<Values>(fixtureValues)
  const [edits, setEdits] = useState<Record<string, Edit>>({})
  const sequence = useRef(0)
  const patchTaskConfig = useCallback((path: string, value: Value) => {
    const [taskKey, group, ...rest] = path.split('.')
    const arg = rest.join('.')
    const field = fixtureField(path)
    const {payload, error} = field ? prepareValue(value, field) : {payload: value, error: undefined}
    const stamp = (sequence.current += 1)
    setEdits(previous => ({
      ...previous,
      [path]: {value, payload, sequence: stamp, status: error ? 'error' : 'queued', error},
    }))
    if (error) return
    void wait(400).then(() => {
      setEdits(previous => previous[path]?.sequence === stamp
        ? {...previous, [path]: {...previous[path], status: 'saved'}}
        : previous)
      setValues(previous => ({
        ...previous,
        [taskKey]: {...previous[taskKey], [group]: {...previous[taskKey]?.[group], [arg]: payload}},
      }))
    })
  }, [])
  const retryTaskConfig = useCallback(() => { /* 假数据没有真失败，重试无事可做 */ }, [])

  /* 统计：切换查询条件就换一份内容不同的假报表，好让「切类目真的换了数据」评得到 */
  const [query, setQueryState] = useState<StatsQuery>(() => ({
    category: 'resources', days: 7, month: new Date().toISOString().slice(0, 7),
    period: 'month', seriesKey: null, bucket: 60,
  }))
  const setQuery = useCallback((patch: Partial<StatsQuery>) => {
    setQueryState(previous => {
      const next = {...previous, ...patch}
      if (patch.category && patch.category !== previous.category && patch.seriesKey === undefined) {
        next.seriesKey = null
      }
      return next
    })
  }, [])
  const [refreshing, setRefreshing] = useState(false)
  const refreshStats = useCallback(() => {
    setRefreshing(true)
    void wait(600).then(() => setRefreshing(false))
  }, [])
  const stats = useMemo<StatsState>(() => ({
    query, report: mockStatsReport(query.category), loading: false, error: null,
    refreshing, setQuery, refresh: refreshStats,
  }), [query, refreshing, setQuery, refreshStats])

  /* 实例列表在内存里增删，好让「新建 / 删除」在评审时真的看得到结果 */
  const [instances, setInstances] = useState(mockInstances)
  const [instanceBusy, setInstanceBusy] = useState(false)
  const instanceOps = useMemo<InstanceOps>(() => ({
    busy: instanceBusy,
    readStartup: async name => name === mockInstances[0].name,
    setStartup: async () => { await wait(300) },
    remove: async name => {
      setInstanceBusy(true)
      await wait(500)
      setInstances(previous => previous.filter(item => item.name !== name))
      setInstanceBusy(false)
    },
    create: async (name, source) => {
      setInstanceBusy(true)
      await wait(500)
      setInstances(previous => [...previous, {
        name, status: 'stopped', serial: '自动检测',
        server: previous.find(item => item.name === source)?.server ?? 'cn',
      }])
      setInstanceBusy(false)
    },
  }), [instanceBusy])

  const refresh = useCallback(() => { /* 假数据不需要重拉 */ }, [])
  const fixture = task ? TASK_CONFIG_FIXTURES[task] ?? null : null
  const schema = useMemo(() => fixtureSchema(fixture), [fixture])

  return useMemo(() => {
    const config: Config = {instance: mockInstances[0].name, revision: 'mock', values}
    return {
      ready: true,
      error: null,
      instances,
      current: instances[0]?.name ?? mockInstances[0].name,
      status,
      statusKnown: true,
      queue: mockQueue,
      schedule: mockSchedule,
      resources: mockResources,
      /* 任务菜单不是手写的：夹具由 dev_tools/export_mobile_menu.mjs 从真实
         menu.json + i18n 生成，所以评审入口的分组与真机是同一份。 */
      taskGroups: MENU_GROUPS,
      taskTotal: MENU_GROUPS.reduce((sum, group) => sum + group.tasks.length, 0),
      taskLabel: (key: string) => MENU_TASK_LABELS[key] ?? key,
      taskConfig: buildTaskConfig(schema, config, fixture?.task ?? null, mockTranslate, edits),
      taskConfigLoading: false,
      taskConfigError: null,
      patchTaskConfig,
      retryTaskConfig,
      starting,
      toggleScheduler,
      runTask,
      logs: mockLogs,
      /* 假数据没有真游标；给个不会触发 floor 归零的正数即可 */
      logsCursor: mockLogs.at(-1)?.id ?? 0,
      /* 评审入口给一张**明确标注是示意图**的占位帧，只为能评到截图区的排版。
         正式入口不这样：那边渲染后端推来的真实帧，没帧就显示等待态。 */
      preview: {image: MOCK_FRAME, capturedAt: new Date().toISOString()},
      setPreviewEnabled: () => { /* 假数据没有订阅，什么都不用做 */ },
      stats,
      instanceOps,
      refresh,
      /* 假数据的 label 是自己写好的中文，直接查表 */
      resourceLabel: key => mockResources.find(item => item.name === key)?.label ?? key,
      t: mockTranslate,
    }
  }, [
    values, edits, patchTaskConfig, retryTaskConfig, stats, instances, instanceOps, schema, fixture,
    status, starting, toggleScheduler, runTask, refresh,
  ])
}

export function MockupDataProvider({task, children}: {task: string | null; children: ReactNode}) {
  const data = useMockData(task)
  return <MobileDataContext.Provider value={data}>{children}</MobileDataContext.Provider>
}
