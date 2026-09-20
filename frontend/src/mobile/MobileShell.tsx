/**
 * 手机端的外壳与全部屏幕 —— **正式入口与评审入口共用这一份**。
 *
 * 数据不在这里取，而是从 `MobileDataContext` 读（见 `data.ts`）：评审入口喂假数据、
 * 正式入口喂 `/api/v1/ws`。所以「评审时看到的」和「真机上跑的」是同一套 UI 代码，
 * 不会各画一套然后慢慢漂移。
 *
 * 组件全是真实的：antd-mobile + PC 的共享组件（ShellBar / MobileTabBar / MenuDrawer /
 * ResourceCard / InstanceCard / StartStopFab / LineChart / LogLine）。
 *
 * 屏幕切换靠 useState + `?screen=` 同步；返回键交给 backGuard，不重造路由。
 *
 * 三条硬规则（都踩过）：
 *   1. **首帧一律容错**。真数据是异步的，`taskGroups[0]`、`resources[0]` 在第一帧
 *      都是 undefined，直接取下标会白屏。
 *   2. **不写死任何数据**。任务/统计/配置/队列全部来自 `useMobileData()`；
 *      要展示的东西先看契约里有没有，没有再往数据源加，绝不在屏幕里造。
 *   3. **有写路径的功能就必须真的写**。开关、删除、新建、刷新，宁可少一个入口，
 *      也不要留一个只弹 Toast 的假按钮。
 */
import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActionSheet, Dialog, ImageViewer, SearchBar, Switch, Toast,
} from 'antd-mobile'
import {
  ChartNoAxesCombined, ChevronRight, Download, ListTodo, LoaderCircle, Pencil, Play, Plus,
  RefreshCw, Server, Trash2, Zap,
} from 'lucide-react'
import type { Value } from '../api/types'
import { writeDevMode } from '../app/devMode'
import { aggregatePoints, downloadCsv } from '../components/statisticsData'
import { CardManager, CardManagerSheet, DEFAULT_RESOURCE_KEYS } from './components/CardManager'
import { createMobileTranslator, type MobileTranslator } from './i18n'
import { currentBlessing } from './blessings'
import { goBack } from './backGuard'
import type { TabKey } from './shell'
import { useVirtualRows } from './virtual'
import type { QueueTask, TaskSchedule } from './data'
import { SegmentedControl } from '../components/SegmentedControl'
import { LogLine } from '../components/LogPanel'
import { ShellBar } from './components/ShellBar'
import { MobileTabBar } from './components/MobileTabBar'
import { ResourceCard, type ResourceView } from './components/ResourceCard'
import { InstanceCard, type InstanceView } from './components/InstanceCard'
import { StartStopFab } from './components/StartStopFab'
import { LineChart } from './components/LineChart'
import { ConfigField } from './components/ConfigField'
import { StatsTable } from './components/StatsTable'
import {
  AboutModal, APPEARANCE_OPTIONS, LANGUAGE_OPTIONS, MenuDrawer, OptionPicker, type Appearance,
} from './components/MenuDrawer'
import type { MobileKey } from './i18n'
import type { Language } from '../i18n'
import { STATS_CATEGORIES, resourceRoute } from './resourceRoute'
import { useMobileData } from './data'

type Screen = 'home' | 'overview' | 'instance' | 'tasks' | 'taskGroup' | 'taskConfig' | 'stats' | 'logs' | 'gallery'

/** 日志行高。必须与 mobile.css 里 `.m-logscroll` 的 line-height 一致，否则偏移会算错。 */
const LOG_ROW_HEIGHT = 18

/**
 * 组件测试页整页按需加载。
 *
 * 它自带 PC 的 dev.css 与 CodeMirror（YAML 字段），两者加起来比手机端主包还大；
 * 而它只有在开发者模式下才会被打开，所以没有理由让每个用户都下载。
 */
const DevPlayground = lazy(() => import('./dev/DevPlayground').then(module => ({default: module.DevPlayground})))

const KNOWN_SCREENS: Screen[] = [
  'home', 'overview', 'instance', 'tasks', 'taskGroup', 'taskConfig', 'stats', 'logs', 'gallery',
]

/** 屏幕从 ?screen= 读，未知值一律回首页。 */
function screenFromUrl(): Screen {
  const value = new URLSearchParams(window.location.search).get('screen')
  return KNOWN_SCREENS.includes(value as Screen) ? (value as Screen) : 'home'
}

/**
 * 外观与语言要记住。
 *
 * 正式入口也会这么做（设置页的「清空本地缓存」明说了会清掉外观偏好），所以示意图
 * 跟着持久化 —— 否则一切到深色再点任何链接就弹回浅色，深色根本没评审过。
 *
 * **同时写 PC 的键**：正式入口外面套着 PC 的 `AppProvider`，它自己也维护一套
 * `azurpilot.theme` 并往 `documentElement.dataset.theme` 上写。只写手机端的键，
 * AppProvider 挂载时那次 effect 会把手机端刚设好的深色盖回浅色（子组件 effect
 * 先跑、父组件后跑），于是「深色偏好」在下一次打开时才生效 —— 这类只在
 * 真机上偶发一次的错位最难查，所以两个键一起写。
 */
const APPEARANCE_KEY = 'azurpilot.mobile.appearance'
const LANGUAGE_KEY = 'azurpilot.mobile.language'
const PC_THEME_KEY = 'azurpilot.theme'
/** 语言也要写 PC 的键：数据层（AppProvider 的 `t()`）读的是它，见 `initialLanguage`。 */
const PC_LANGUAGE_KEY = 'azurpilot.language'

function remembered<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const value = window.localStorage.getItem(key)
    return allowed.includes(value as T) ? (value as T) : fallback
  } catch {
    /* 隐私模式下 localStorage 会抛异常，退回默认值即可 */
    return fallback
  }
}

function remember(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    /* 同上：存不下就算了，不影响本次会话 */
  }
}

/* 默认卡片沿用 PC 的 defaultResourceKeys；行动力仍在可选列表里，需要时手动加。 */
const DEFAULT_CARDS = DEFAULT_RESOURCE_KEYS

/**
 * 卡片搭配的持久化。
 *
 * **存储键与数据形状与 PC 的 `pages/Overview.tsx` 完全一致**（`azurpilot.resources.<实例>`
 * + 字符串数组的 JSON），所以在电脑端调好的搭配，手机打开就是同一套，反之亦然。
 * 读不动（没权限、内容损坏）就退回默认四张。
 */
function resourcesKey(instance: string): string {
  return `azurpilot.resources.${instance}`
}

function loadResourceSelection(instance: string): string[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(resourcesKey(instance)) ?? 'null')
    if (Array.isArray(saved) && saved.every(item => typeof item === 'string')) {
      return [...new Set(saved as string[])]
    }
  } catch { /* 损坏的偏好使用默认搭配。 */ }
  return [...DEFAULT_CARDS]
}

function saveResourceSelection(instance: string, keys: string[]): void {
  try {
    localStorage.setItem(resourcesKey(instance), JSON.stringify(keys))
  } catch { /* 无存储权限时仅当前会话生效。 */ }
}

function useGreeting(ui: MobileTranslator): string {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return ui('home.greetingMorning')
  if (hour >= 12 && hour < 18) return ui('home.greetingAfternoon')
  return ui('home.greetingEvening')
}

/**
 * 「N 分钟前」这类相对时间必须自己走。
 *
 * 原来 `now` 是 `useMemo(..., [])`，整个会话冻结在挂载那一刻 —— 开着页面十分钟，
 * 资源卡上的采集时间永远显示「3 分钟前」，看起来像数据没更新。这里每分钟推一格。
 */
function useNow(): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(timer)
  }, [])
  return now
}

/** 一栏一栏的卡片容器。
 *  `trailing` 贴在标题同一行右侧；`action` 单独占一行、落在标题**下方** ——
 *  首页的「新建实例」用后者：跟标题同行时，按钮的上沿会和上面那排统计
 *  （「需要处理 0」）挤在一起。 */
function Section({title, trailing, action, children}: {
  title?: string
  trailing?: React.ReactNode
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return <section style={{marginBottom: 14}}>
    {title ? <div style={{
      display: 'flex', alignItems: 'center', gap: 8, margin: '0 4px 8px',
      fontSize: 13, color: 'var(--muted)',
    }}><span>{title}</span>{trailing}</div> : null}
    {action ? <div className="m-section-action">{action}</div> : null}
    <div className="m-stack">{children}</div>
  </section>
}

/**
 * 任务行右侧的调度状态徽标。
 *
 * 它回答的是「这个任务到底会不会被跑」：后端的 `overview.tasks` 只含**已启用**的任务，
 * 所以 `schedule` 里查不到就是「未启用」。原来看不出这件事，任务页与调度器像两个
 * 互不相干的世界 —— 在任务页翻完整个任务树，也不知道哪个任务真的在队列里。
 */
function ScheduleChip({schedule, ui}: {schedule: TaskSchedule | undefined; ui: MobileTranslator}) {
  const label = !schedule ? ui('mobile.tasks.disabled')
    : schedule.state === 'running' ? ui('scheduler.running')
      : schedule.state === 'pending' ? ui('scheduler.pending') : ui('scheduler.waiting')
  return <span className={`m-schedule-chip ${schedule ? `is-${schedule.state}` : 'is-off'}`}>{label}</span>
}

/** 队列那三组的计数 + 调度器状态。总览页与任务页共用，与 PC 的右栏同义。 */
function SchedulerCard({ui, status, schedule, statusKnown}: {
  ui: MobileTranslator
  status: InstanceView['status']
  schedule: Record<string, TaskSchedule>
  statusKnown: boolean
}) {
  const counts = useMemo(() => {
    const result = {running: 0, pending: 0, waiting: 0}
    for (const task of Object.values(schedule)) result[task.state] += 1
    return result
  }, [schedule])
  const state = !statusKnown ? ui('common.loading') : status === 'running' ? ui('status.running')
    : status === 'error' ? ui('scheduler.abnormal') : ui('scheduler.stopped')
  return <div className="m-scheduler-card">
    <div className="m-scheduler-head">
      <span className="m-scheduler-eyebrow">{ui('scheduler.title')}</span>
      <span className={`m-scheduler-state is-${statusKnown ? status : 'unknown'}`}>{state}</span>
    </div>
    <div className="m-scheduler-counts">
      {(['running', 'pending', 'waiting'] as const).map(key =>
        <span key={key}><em>{ui(`scheduler.${key}` as MobileKey)}</em><b>{counts[key]}</b></span>)}
    </div>
    {!Object.keys(schedule).length && statusKnown
      ? <p className="m-scheduler-empty">{ui('scheduler.noEnabled')}</p>
      : null}
  </div>
}

/** 队列里每条任务的「下次运行」文案；正在跑的和 PC 一样只说「正在执行」。 */
function nextRunOf(task: QueueTask, ui: MobileTranslator): string {
  if (!task.nextRun) return ui('scheduler.executing')
  return task.nextRun.replace('T', ' ').trim()
}

/**
 * 外壳。数据来自 `MobileDataContext`，由调用方决定喂真数据还是假数据。
 *
 * `onLanguageChange` 是给正式入口用的：那边 schema 是按语言拉的，切换界面语言
 * 必须同步告诉 `AppProvider`，否则 `t()` 出来的任务名会是旧语言。
 * `onInstanceChange` 同理 —— 实例是 URL 与本地记忆的一部分，外壳不自己存。
 */
export function MobileShell({onLanguageChange, onTaskChange, onInstanceChange, initialTask, initialLanguage}: {
  onLanguageChange?: (language: Language) => void
  /** 正式入口用它知道当前打开的任务，好按需拉那份配置；评审入口不传。 */
  onTaskChange?: (task: string | null) => void
  /** 切换实例（首页点实例卡）。评审入口不传。 */
  onInstanceChange?: (instance: string) => void
  initialTask?: string | null
  /**
   * 外壳语言的兜底值。
   *
   * 正式入口传 AppProvider 当前的语言：`t()`（schema 翻译，资源名/任务名走它）用的是
   * AppProvider 的语言，外壳若另起一套默认值，就会一边日文一边中文。
   * 用户在本机选过的偏好（`LANGUAGE_KEY`）优先于它。
   */
  initialLanguage?: Language
} = {}) {
  const data = useMobileData()
  const {t, taskLabel, taskGroups, instances, resources, status, statusKnown, starting, stats} = data
  const {toggleScheduler: runScheduler, runTask, patchTaskConfig, retryTaskConfig, instanceOps, refresh} = data
  const [screen, setScreen] = useState<Screen>(screenFromUrl)
  const [appearance, setAppearance] = useState<Appearance>(
    () => remembered(APPEARANCE_KEY, APPEARANCE_OPTIONS.map(item => item.value), 'light'))
  const [language, setLanguageState] = useState<Language>(
    () => remembered(LANGUAGE_KEY, LANGUAGE_OPTIONS.map(item => item.value), initialLanguage ?? 'zh-CN'))
  /* 正式入口的 schema 是按语言拉的，切界面语言要同步告诉 AppProvider（onLanguageChange），
     否则 t() 出来的任务名 / 分组名还是旧语言。评审入口不传这个回调。 */
  const setLanguage = (next: Language) => {
    setLanguageState(next)
    /* 两个键一起写：外壳读手机端的键，AppProvider（数据层）读 PC 的键 */
    remember(PC_LANGUAGE_KEY, next)
    onLanguageChange?.(next)
  }
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [devModalOpen, setDevModalOpen] = useState(false)
  /* 当前打开的任务分组（三级导航的中间一层）。同时也进 URL，便于深链与返回。
     正式入口的 schema 是异步拉的，首帧 taskGroups 还是空的 —— 所以这里必须容忍空数组，
     否则 taskGroups[0].key 会在登录后第一帧直接抛错、整页白屏（踩过）。 */
  const [openGroup, setOpenGroup] = useState(() =>
    new URLSearchParams(window.location.search).get('group') ?? taskGroups[0]?.key ?? '')
  /* 当前打开的任务：URL 里带 `?task=` 就用它，否则退到第一个分组的第一个任务。
     原来这里写死 `'EventA'`，深链到配置页会打开一个跟 URL 无关的任务。 */
  const [openTask, setOpenTask] = useState(initialTask ?? '')
  /* 任务配置页有**两个来路**：任务页（分组那一层）和实例页的队列。
     返回时不能一律当成从分组来的 —— 那样从实例页进去、返回会落到「任务分组」而不是实例页。 */
  const taskConfigFrom = useRef<Screen>('tasks')
  const [picker, setPicker] = useState<'appearance' | 'language' | null>(null)
  const [cardsOpen, setCardsOpen] = useState(false)
  /* `data.current` 是外壳选中的实例；卡片管理按它读/写 PC 的 localStorage 键。
     正式入口在实例列表到达前会先渲染连接态，所以这里正常情况下不会为空 —— 仍然兜一下。 */
  const instance = data.current ? instances.find(item => item.name === data.current) ?? instances[0] : instances[0]
  const [cardNames, setCardNames] = useState<string[]>(
    () => loadResourceSelection(instance?.name ?? ''))
  const [logTab, setLogTab] = useState<'logs' | 'preview'>('logs')
  const ui = useMemo(() => createMobileTranslator(language), [language])
  const now = useNow()
  const blessing = useMemo(() => currentBlessing(), [])
  const greeting = useGreeting(ui)
  /* 示意图里用 ?app=1 模拟 App 宿主，好把 ⟳ 与 ⚙ 也评审到 */
  const appHost = useMemo(() => new URLSearchParams(window.location.search).has('app'), [])

  useEffect(() => {
    remember(LANGUAGE_KEY, language)
    remember(PC_LANGUAGE_KEY, language)
  }, [language])

  /* 三级导航：任务页 → 分组任务列表 → 任务配置 */
  const openedGroup = taskGroups.find(group => group.key === openGroup) ?? taskGroups[0] ?? null
  /* 没指定任务时（深链 ?screen=taskConfig）退到当前分组的第一个任务 */
  const activeTask = openTask || openedGroup?.tasks[0] || ''
  /* 工具类任务（menu 的 page=tool）没有 Scheduler.Enable，不进队列，只能手动运行 */
  const taskIsTool = taskGroups.some(group => group.page === 'tool' && group.tasks.includes(activeTask))

  /* 只在真的停在任务配置页时才报当前任务 —— 正式入口据此决定要不要拉配置
     （整份配置不小，不该在首页就拉下来）。 */
  useEffect(() => {
    onTaskChange?.(screen === 'taskConfig' ? activeTask || null : null)
  }, [screen, activeTask, onTaskChange])

  /**
   * 切屏 = pushState + setScreen。
   *
   * 屏幕进 URL 有两个实际好处：评审时可以直接把 ?screen=stats 丢给模拟器打开，
   * 以及 Android 的返回手势真的能退回上一屏（之前只改 state，按返回会直接退出）。
   */
  const navigate = useMemo(() => (next: Screen, replace = false) => {
    const url = new URL(window.location.href)
    url.searchParams.set('screen', next)
    window.history[replace ? 'replaceState' : 'pushState']({screen: next}, '', url)
    setScreen(next)
  }, [])

  /* 载入时把当前屏写进 history.state，让它和后续 push 的条目结构一致 */
  useEffect(() => {
    window.history.replaceState({...window.history.state, screen: screenFromUrl()}, '')
    const onPop = (event: PopStateEvent) => {
      setScreen((event.state as {screen?: Screen} | null)?.screen ?? screenFromUrl())
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useEffect(() => {
    remember(APPEARANCE_KEY, appearance)
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const next = appearance === 'dark' || (appearance === 'system' && media.matches)
      document.documentElement.dataset.theme = next ? 'dark' : 'light'
      document.documentElement.dataset.prefersColorScheme = next ? 'dark' : 'light'
      /* 同步 PC 的键，避免 AppProvider 挂载时把深色盖回去（理由见 PC_THEME_KEY 注释） */
      remember(PC_THEME_KEY, next ? 'dark' : 'light')
    }
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [appearance])

  /* 分组列表页仍是「任务」段下的一层列表，所以保留底部 Tab 栏；
     任务配置才是叶子页，全屏推入、盖住 Tab 栏。 */
  const tabOf: Record<Screen, TabKey | null> = {
    home: null, overview: 'overview', instance: 'instance',
    tasks: 'tasks', taskGroup: 'tasks', taskConfig: null, stats: 'stats', logs: 'logs', gallery: null,
  }
  const activeTab = tabOf[screen]
  const titleOf: Record<Screen, MobileKey> = {
    home: 'mobile.drawer.home',
    overview: 'mobile.tab.overview',
    instance: 'mobile.tab.instance',
    tasks: 'mobile.tab.tasks',
    /* 分组页的页眉显示的是分组名（见下面 ShellBar），这里只是类型占位 */
    taskGroup: 'mobile.tab.tasks',
    taskConfig: 'mobile.tab.tasks',
    stats: 'mobile.tab.stats',
    logs: 'mobile.tab.logs',
    gallery: 'mobile.gallery.title',
  }

  function openResource(resource: ResourceView) {
    const route = resourceRoute(resource.name)
    /* 类目与曲线 key 一起带过去：只切类目的话，点「石油」进统计页看到的还是
       类目里的第一条曲线（原来是写死的一条行动力曲线，张冠李戴）。 */
    stats.setQuery({category: route?.category ?? 'resources', seriesKey: route?.seriesKey ?? null})
    navigate('stats')
  }

  /* 按用户排定的顺序出卡。
     不能写成 resources.filter(...) —— 那是按**资源表的固定顺序**过滤，
     卡片管理里拖动改的顺序就完全体现不出来（拖动看着生效、总览纹丝不动）。
     PC 的 ResourceCards 也是 selected.map(key => resources.find(...))。 */
  const visibleCards = cardNames
    .map(name => resources.find(item => item.name === name))
    .filter((item): item is ResourceView => Boolean(item))

  /* 立即执行：后端只是把任务交给调度器，所以这一步很快；失败给错误 Toast */
  const runNow = async (task: string) => {
    try {
      await runTask(task)
      Toast.show({content: ui('mobile.tasks.runQueued'), icon: 'success'})
    } catch (error) {
      Toast.show({content: (error as Error).message, icon: 'fail'})
    }
  }

  /* 启停调度器：总览与实例两屏共用这一个入口。
     停止是危险动作，先确认；启动直接走。两者都给轻提示（Toast），
     期间 FAB 由 data.starting 驱动转圈 + 失效。 */
  const toggleScheduler = () => {
    const next = status === 'running' ? 'stop' : 'start'
    const fire = async () => {
      try {
        await runScheduler(next)
        Toast.show({
          content: next === 'start' ? ui('scheduler.started') : ui('scheduler.stoppedNotice'),
          icon: 'success',
        })
      } catch (error) {
        Toast.show({content: (error as Error).message, icon: 'fail'})
      }
    }
    if (next === 'stop') {
      Dialog.confirm({content: ui('mobile.instance.stopConfirm'), onConfirm: () => void fire()})
      return
    }
    void fire()
  }

  /** 首页实例卡的「⋯」：开机自启与删除，都是真接口。 */
  const openInstanceActions = (item: InstanceView) => {
    const running = item.status === 'running' || item.status === 'updating'
    ActionSheet.show({
      closeOnAction: true,
      actions: [
        {text: ui('instance.autoRun'), key: 'startup'},
        {text: ui('mobile.instance.delete'), key: 'delete', danger: true, disabled: running},
      ],
      onAction: action => {
        if (action.key === 'startup') {
          void (async () => {
            try {
              const enabled = await instanceOps.readStartup(item.name)
              await instanceOps.setStartup(item.name, !enabled)
              Toast.show({content: enabled ? ui('mobile.instance.startupOff') : ui('mobile.instance.startupOn'), icon: 'success'})
            } catch (error) { Toast.show({content: (error as Error).message, icon: 'fail'}) }
          })()
          return
        }
        if (action.key === 'delete') {
          void Dialog.confirm({
            content: ui('mobile.instance.deleteConfirm', {name: item.name}),
            onConfirm: async () => {
              try {
                await instanceOps.remove(item.name)
                Toast.show({content: ui('mobile.instance.deleteDone', {name: item.name}), icon: 'success'})
              } catch (error) { Toast.show({content: (error as Error).message, icon: 'fail'}) }
            },
          })
        }
      },
    })
  }

  return <div className="m-shell" data-tabs={activeTab ? 'on' : 'off'}
    data-fixed={screen === 'logs' ? 'on' : undefined}>
    <ShellBar
      ui={ui}
      title={screen === 'taskConfig' ? taskLabel(activeTask)
        : screen === 'taskGroup' ? openedGroup?.name ?? '' : ui(titleOf[screen])}
      subtitle={screen === 'taskConfig' ? activeTask : undefined}
      /* 返回走真正的历史返回：栈里没有上一页时才逐层兜底退到上一层 */
      onBack={screen === 'taskConfig' || screen === 'taskGroup'
        ? () => goBack(() => navigate(screen === 'taskConfig' ? taskConfigFrom.current : 'tasks'))
        : undefined}
      onMenu={() => setDrawerOpen(true)}
      appHost={appHost}
      /* 页眉的 ⟳ 是真刷新：重拉总览与当前任务的配置（原来只弹一个 Toast） */
      onRefresh={refresh}
      onSettings={() => { Toast.show(ui('mobile.settings.appHostOnly')) }}
    />

    {/* 统计页的次级类目条：紧贴页眉、吸顶不滚走，单行 PC 滑块样式 */}
    {screen === 'stats' && <div className="m-segmented-bar">
      <SegmentedControl label={ui('stats.categoryLabel')} value={stats.query.category}
        onChange={category => stats.setQuery({category})}
        options={STATS_CATEGORIES.map(item => ({value: item.key, label: ui(item.labelKey)}))} />
    </div>}

    {/* 拉取失败不再静默：原来 error 只被 set、没有任何屏幕渲染，
        于是失败时总览只剩标题和一个齿轮，看起来像「这个实例本来就没有资源」。 */}
    {data.error ? <div className="m-error-banner" role="alert">
      <strong>{ui('mobile.error.title')}</strong>
      <span>{data.error}</span>
      <button type="button" className="text-button" onClick={refresh}>{ui('common.retry')}</button>
    </div> : null}

    <div className="m-main">
      {screen === 'home' && <HomeScreen ui={ui} t={t} greeting={greeting} blessing={blessing}
        current={data.current}
        onOpen={item => {
          /* 点哪张卡就切到哪个实例 —— 原来丢掉了点的是谁，永远进当前实例 */
          onInstanceChange?.(item.name)
          navigate('overview')
        }}
        onMore={openInstanceActions}
        onCreate={() => setCreateOpen(true)} />}

      {screen === 'overview' && <OverviewScreen ui={ui} now={now} cards={visibleCards}
        name={instance?.name ?? ''} status={status} statusKnown={statusKnown} schedule={data.schedule}
        onOpenResource={openResource}
        onManage={() => setCardsOpen(true)}
        onOpenQueue={() => navigate('instance')}
        onToggle={toggleScheduler}
        busy={starting} />}

      {screen === 'instance' && <InstanceScreen ui={ui}
        onRun={task => { Dialog.confirm({
          content: ui('mobile.tasks.runConfirm', {task: task.label}),
          onConfirm: () => { void runNow(task.name) },
        }) }}
        onOpenTask={task => { setOpenTask(task); taskConfigFrom.current = 'instance'; navigate('taskConfig') }}
        onToggle={toggleScheduler}
        busy={starting}
        status={status}
        statusKnown={statusKnown}
        schedule={data.schedule} />}

      {screen === 'tasks' && <TasksScreen ui={ui} status={status} statusKnown={statusKnown}
        onOpenTask={task => { setOpenTask(task); taskConfigFrom.current = 'tasks'; navigate('taskConfig') }}
        onOpenGroup={group => {
          /* 分组名进 URL，返回手势与深链都能用 */
          setOpenGroup(group)
          const url = new URL(window.location.href)
          url.searchParams.set('screen', 'taskGroup')
          url.searchParams.set('group', group)
          window.history.pushState({screen: 'taskGroup', group}, '', url)
          setScreen('taskGroup')
        }} />}

      {/* 中间一层：该分组的任务列表。点任务才进配置页 —— 之前是点分组直接进
          「活动A图」的配置页，跳过了「这个组里有哪些任务」这一步。 */}
      {screen === 'taskGroup' && openedGroup && <TaskGroupScreen ui={ui} group={openedGroup}
        onOpenTask={task => { setOpenTask(task); taskConfigFrom.current = 'taskGroup'; navigate('taskConfig') }} />}

      {screen === 'taskConfig' && <TaskConfigScreen ui={ui} t={t} isTool={taskIsTool}
        onPatch={patchTaskConfig} onRetry={retryTaskConfig}
        onRun={() => { void runNow(activeTask) }} />}

      {screen === 'stats' && <StatsScreen ui={ui} />}

      {screen === 'logs' && <LogsScreen ui={ui} tab={logTab} onTab={setLogTab} instance={instance?.name ?? ''} />}

      {screen === 'gallery' && <Suspense fallback={<div className="loading" role="status">
        <LoaderCircle className="spin" size={22} />{ui('common.loading')}
      </div>}>
        {/* 整页按需加载：它自己的样式（PC 的 dev.css）与 CodeMirror 都切进独立
            chunk，手机端主包不受影响。 */}
        <DevPlayground ui={ui}
          onExit={() => { writeDevMode(false); navigate('home') }}
          onModal={() => setDevModalOpen(true)} />
      </Suspense>}
    </div>

    {activeTab && <MobileTabBar instance={instance?.name ?? ''} active={activeTab} ui={ui}
      onSelect={tab => navigate(tab as Screen)} />}

    <MenuDrawer
      visible={drawerOpen} onClose={() => setDrawerOpen(false)} ui={ui}
      appearance={appearance}
      appearanceLabel={ui(APPEARANCE_OPTIONS.find(item => item.value === appearance)!.labelKey)}
      languageLabel={LANGUAGE_OPTIONS.find(item => item.value === language)!.label}
      onAppearance={() => setPicker('appearance')}
      onLanguage={() => setPicker('language')}
      onNavigate={key => {
        setDrawerOpen(false)
        if (key === 'home') navigate('home')
        if (key === 'gallery') navigate('gallery')
        /* 「搜索」跳到任务页 —— 真正的搜索框在那页顶部，能搜分组名也能搜组内任务。
           不自动聚焦：跳一次页就弹键盘太突然。 */
        if (key === 'search') navigate('tasks')
        /* 「App 下载」还没有落地页。给一句实话，而不是点了完全没反应（死入口）。 */
        if (key === 'download') Toast.show(ui('mobile.drawer.downloadHint'))
      }}
      onOpenAbout={() => { setDrawerOpen(false); setAboutOpen(true) }}
      onDevModeEnabled={() => { Toast.show(ui('developer.enabled')) }}
    />

    <OptionPicker visible={picker === 'appearance'} title={ui('mobile.drawer.appearance')}
      options={APPEARANCE_OPTIONS.map(item => ({value: item.value, label: ui(item.labelKey)}))}
      value={appearance} onPick={setAppearance} onClose={() => setPicker(null)} />
    <OptionPicker visible={picker === 'language'} title={ui('mobile.drawer.language')}
      options={LANGUAGE_OPTIONS}
      value={language} onPick={setLanguage} onClose={() => setPicker(null)} />
    <AboutModal visible={aboutOpen} onClose={() => setAboutOpen(false)} ui={ui} version="1.0.0" />

    <CardManagerSheet visible={cardsOpen} onClose={() => setCardsOpen(false)} ui={ui}>
      <CardManager ui={ui}
        resources={resources.map(item => ({name: item.name, label: item.label}))}
        selected={cardNames}
        onChange={keys => { setCardNames(keys); if (instance) saveResourceSelection(instance.name, keys) }}
        onClose={() => setCardsOpen(false)} />
    </CardManagerSheet>

    <CreateInstanceDialog visible={createOpen} onClose={() => setCreateOpen(false)} ui={ui}
      sources={instances.map(item => item.name)} busy={instanceOps.busy}
      onSubmit={async (name, source) => {
        try {
          await instanceOps.create(name, source)
          setCreateOpen(false)
          Toast.show({content: ui('instance.created'), icon: 'success'})
        } catch (error) {
          Toast.show({content: (error as Error).message, icon: 'fail'})
          throw error
        }
      }} />

    {/* 组件测试页里「打开 Modal」的预览：与 PC 一样用真实弹窗 + 真实表单/按钮样式 */}
    <Dialog visible={devModalOpen} title={ui('developer.modalPreview')} closeOnAction
      onAction={() => setDevModalOpen(false)}
      content={<div className="form-stack">
        <p className="muted">{ui('developer.modalHint')}</p>
        <label className="m-dev-modal-field">
          {ui('developer.sampleInput')}
          <input defaultValue="AzurPilot Dev Mode" />
        </label>
      </div>}
      actions={[[
        {key: 'cancel', text: ui('common.cancel'), onClick: () => setDevModalOpen(false)},
        {key: 'ok', text: ui('common.confirm'), bold: true, onClick: () => setDevModalOpen(false)},
      ]]} />
  </div>
}

/* ── 新建实例 ────────────────────────────────────────────────────────── */

/**
 * 新建实例。
 *
 * 参数与 PC 的 `CreateInstance` 一致（`instances.create {name, source}`），
 * 名字的字符集也用 PC 的正则：后端按这个名字建配置文件与进程，放开会出乱子。
 */
function CreateInstanceDialog({visible, onClose, ui, sources, busy, onSubmit}: {
  visible: boolean
  onClose: () => void
  ui: MobileTranslator
  sources: string[]
  busy: boolean
  onSubmit: (name: string, source: string) => Promise<void>
}) {
  const [name, setName] = useState('')
  const [source, setSource] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  return <Dialog visible={visible} title={ui('instance.createTitle')} closeOnMaskClick
    content={<div className="form-stack">
      <p className="muted">{ui('instance.createHint')}</p>
      <label className="m-dev-modal-field">
        {ui('instance.name')}
        <input value={name} maxLength={64} placeholder={ui('instance.namePlaceholder')}
          onChange={event => setName(event.target.value)} />
      </label>
      <label className="m-dev-modal-field">
        {ui('instance.initialConfig')}
        <button type="button" className="m-config-pick" onClick={() => setPickerOpen(true)}>
          <span>{source || ui('instance.defaultConfig')}</span><span aria-hidden="true">›</span>
        </button>
      </label>
      <OptionPicker visible={pickerOpen} title={ui('instance.initialConfig')}
        value={source} onClose={() => setPickerOpen(false)}
        options={[{value: '', label: ui('instance.defaultConfig')},
          ...sources.map(item => ({value: item, label: item}))]}
        onPick={next => { setSource(next); setPickerOpen(false) }} />
    </div>}
    actions={[[
      {key: 'cancel', text: ui('common.cancel'), onClick: onClose},
      {key: 'ok', text: busy ? ui('instance.creating') : ui('instance.create'), bold: true,
        disabled: busy || !/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(name),
        onClick: () => { void onSubmit(name, source).catch(() => { /* 失败已用 Toast 提示，弹窗留着让用户改 */ }) }},
    ]]} />
}

/* ── 首页 ───────────────────────────────────────────────────────────── */

function HomeScreen({ui, t, greeting, blessing, current, onOpen, onMore, onCreate}: {
  ui: MobileTranslator
  t: (key: string) => string
  greeting: string
  blessing: string
  current: string | null
  onOpen: (item: InstanceView) => void
  onMore: (item: InstanceView) => void
  onCreate: () => void
}) {
  const {instances} = useMobileData()
  const running = instances.filter(item => item.status === 'running').length
  const error = instances.filter(item => item.status === 'error').length
  return <>
    <div style={{padding: '4px 4px 0'}}>
      <p style={{margin: 0, color: 'var(--accent)', fontSize: 13, fontWeight: 600}}>{ui('home.commandCenter')}</p>
      <h2 style={{margin: '10px 0 0', fontSize: 26, fontWeight: 700}}>{greeting}</h2>
      <p style={{margin: '8px 0 0', fontSize: 14, color: 'var(--muted)'}}>{blessing}</p>
      <hr style={{border: 0, borderTop: '1px solid var(--border)', margin: '14px 0'}} />
      <div style={{display: 'flex', gap: 22, fontSize: 13}}>
        {[[<ListTodo size={16} key="a" />, ui('home.allInstances'), instances.length],
          [<ChartNoAxesCombined size={16} key="b" />, ui('status.running'), running],
          [<Server size={16} key="c" />, ui('status.error'), error]].map(([icon, label, value]) => (
          <span key={String(label)} style={{display: 'inline-flex', alignItems: 'center', gap: 6}}>
            <span style={{color: 'var(--accent)'}}>{icon}</span>
            <span>{label}</span><strong style={{fontSize: 16}}>{value}</strong>
          </span>
        ))}
      </div>
    </div>

    <Section title={`${ui('home.instances')} (${instances.length})`}
      action={<button type="button" className="button primary m-home-new" onClick={onCreate}>
        <Plus size={14} aria-hidden="true" />{ui('home.newInstance')}
      </button>}>
      {instances.map(item => <InstanceCard key={item.name} instance={item} ui={ui} t={t}
        current={item.name === current} onOpen={onOpen} onMore={onMore} />)}
    </Section>
  </>
}

/* ── 总览 ───────────────────────────────────────────────────────────── */

function OverviewScreen({ui, now, cards, name, status, statusKnown, schedule, onOpenResource, onManage, onOpenQueue, onToggle, busy}: {
  ui: MobileTranslator
  now: Date
  cards: ResourceView[]
  name: string
  status: InstanceView['status']
  statusKnown: boolean
  schedule: Record<string, TaskSchedule>
  onOpenResource: (item: ResourceView) => void
  onManage: () => void
  onOpenQueue: () => void
  onToggle: () => void
  busy: boolean
}) {
  return <>
    <div style={{display: 'flex', alignItems: 'center', margin: '0 4px 12px'}}>
      {/* 标题是实例名（原来写死 `alas`，多实例时会指错） */}
      <h2 style={{margin: 0, fontSize: 26, fontWeight: 700, flex: 1}}>{name || ui('common.loading')}</h2>
      <button type="button" aria-label={ui('mobile.overview.cards')} onClick={onManage}
        style={{width: 'var(--m-tap-min)', height: 'var(--m-tap-min)', borderRadius: '50%',
          border: '1px solid var(--border)', background: 'var(--surface)',
          display: 'grid', placeItems: 'center', cursor: 'pointer'}}><Pencil size={17} /></button>
    </div>
    <SchedulerCard ui={ui} status={status} statusKnown={statusKnown} schedule={schedule} />
    <div className="m-stack">
      {cards.map(item => <ResourceCard key={item.name} resource={item} now={now} ui={ui}
        onClick={onOpenResource} />)}
    </div>
    <button type="button" className="text-button m-overview-more" onClick={onOpenQueue}>
      {ui('scheduler.plan')}<ChevronRight size={14} aria-hidden="true"/>
    </button>
    {/* 给 FAB 留出让位空间。
        悬浮按钮固定在视口右下、距底 84px、高 56px，占的是「内容区底部往上
        84–140px」那一条带。留白必须超过 84px —— 否则内容不够长时页面滚不动，
        最后一张卡的数值会被永久压在按钮下面（PC 的默认只有四张卡，很容易触发）。 */}
    <div style={{height: 150}} aria-hidden="true" />
    <StartStopFab status={status} busy={busy} enabled={statusKnown} onToggle={onToggle} ui={ui} />
  </>
}

/* ── 实例（调度队列） ─────────────────────────────────────────────────── */

/**
 * 实例页：调度队列分三组（运行中 / 待执行 / 等待中），行内是「文字 + 闪电」。
 *
 * **点行进该任务自己的配置页**（不是笼统跳任务页）；**点闪电立即执行**这个任务。
 * 两个动作都按**任务键**走，行内的中文名只用于显示。
 */
function InstanceScreen({ui, onRun, onOpenTask, onToggle, busy, status, statusKnown, schedule}: {
  ui: MobileTranslator
  onRun: (task: QueueTask) => void
  onOpenTask: (task: string) => void
  onToggle: () => void
  busy: boolean
  status: InstanceView['status']
  statusKnown: boolean
  schedule: Record<string, TaskSchedule>
}) {
  const {queue} = useMobileData()
  const groups = [
    {key: 'running', title: ui('scheduler.running'), empty: ui('scheduler.noRunning'),
      hint: ui('mobile.tasks.noRunningHint'), items: queue.running},
    {key: 'pending', title: ui('scheduler.pending'), empty: ui('scheduler.noPending'),
      hint: ui('mobile.tasks.noPendingHint'), items: queue.pending},
    {key: 'waiting', title: ui('scheduler.waiting'), empty: ui('scheduler.noWaiting'),
      hint: ui('mobile.tasks.noWaitingHint'), items: queue.waiting},
  ] as const
  return <>
    <SchedulerCard ui={ui} status={status} statusKnown={statusKnown} schedule={schedule} />
    {groups.map(group => <div className="m-list-group" key={group.key}>
      <div className="m-section-title">
        <span>{group.title}</span>
        <span className="m-count-badge">{group.items.length}</span>
      </div>
      <div className="m-list">
        {group.items.length
          ? group.items.map(task => <div key={task.name} className="m-list-row">
            <button type="button" className="m-list-body m-list-row-button"
              onClick={() => onOpenTask(task.name)}>
              <span className="m-list-label">{task.label}</span>
              {/* 运行中就说「正在执行」，不再用「nextRun 为空」去猜 —— 后端给的是 state */}
              <span className="m-list-sub">{nextRunOf(task, ui)}</span>
            </button>
            {/* 已经在跑的任务没有再执行一次的意义，置灰 */}
            <button type="button" className="m-list-action"
              disabled={group.key === 'running'}
              aria-label={ui('mobile.tasks.run')} title={ui('mobile.tasks.run')}
              onClick={() => onRun(task)}>
              <Zap size={20} />
            </button>
          </div>)
          : <div className="m-empty-card">
            <strong>{group.empty}</strong>
            <span>{group.hint}</span>
          </div>}
      </div>
    </div>)}
    {/* 与总览同一套 FAB 让位：留白必须超过「距底 84px + 按钮 56px」那一条带 */}
    <div style={{height: 150}} aria-hidden="true" />
    <StartStopFab status={status} busy={busy} enabled={statusKnown} onToggle={onToggle} ui={ui} />
  </>
}

/* ── 任务树（三级：分组 → 分组内任务 → 任务配置） ──────────────────── */

/**
 * 任务分组列表 + 搜索。
 *
 * 行内只有「左边文字 + 右边箭头」，**不放中间的数量** —— 三样东西摊在一条行上
 * 会把数量顶到正中间，既占宽度又不好读。**已启用的任务数**紧贴箭头放在右侧，
 * 这是「任务与调度器同步」最要紧的一条：看不出分组里有没有任务真的在跑，
 * 任务页就只是个目录。
 *
 * 搜索**同时命中分组名与组内任务**：有查询时列成两段 —— 命中的分组、命中的任务
 * （带所属分组与调度状态），点任务直接进它的配置页。
 */
function TasksScreen({ui, status, statusKnown, onOpenGroup, onOpenTask}: {
  ui: MobileTranslator
  status: InstanceView['status']
  statusKnown: boolean
  onOpenGroup: (group: string) => void
  onOpenTask: (task: string) => void
}) {
  const {taskGroups, taskLabel, taskTotal, schedule} = useMobileData()
  const [search, setSearch] = useState('')
  const [scope, setScope] = useState<'all' | 'count'>('all')
  const query = search.trim().toLowerCase()
  const searching = query.length > 0
  const matchedGroups = taskGroups.filter(group =>
    !searching || group.name.toLowerCase().includes(query))
  const matchedTasks = searching
    ? taskGroups.flatMap(group => group.tasks
      .filter(task => task.toLowerCase().includes(query)
        || taskLabel(task).toLowerCase().includes(query))
      .map(task => ({task, group: group.key, groupName: group.name})))
    : []
  const nothing = searching && !matchedGroups.length && !matchedTasks.length

  return <>
    <div className="m-search-bar">
      <SearchBar placeholder={ui('nav.searchTaskPlaceholder')} value={search} onChange={setSearch} />
    </div>
    {/* 搜索时让位给结果，平时才显示总览 / 共 N 项 */}
    {!searching && <div style={{marginBottom: 16}}>
      <SegmentedControl label={ui('mobile.tasks.overview')} value={scope} onChange={setScope}
        options={[{label: ui('mobile.tasks.overview'), value: 'all'},
          {label: ui('mobile.tasks.count', {count: taskTotal}), value: 'count'}]} />
    </div>}

    {!searching && <SchedulerCard ui={ui} status={status} statusKnown={statusKnown} schedule={schedule} />}

    {nothing && <div className="panel m-empty-card">
      <strong>{ui('mobile.search.empty')}</strong>
    </div>}

    {matchedGroups.length > 0 && <div className="m-list-group">
      {searching && <div className="m-section-title">
        <span>{ui('mobile.search.groups')}</span>
        <span className="m-count-badge">{matchedGroups.length}</span>
      </div>}
      <div className="m-stack">
        {/* 分组行保持「左文字 + 右箭头」两样东西：中间塞计数会把行撑高、也不好读。
            调度状态全部落在**任务行**上（见下一层与搜索结果），分组这一层只做导航。 */}
        {matchedGroups.map(group => <button type="button" key={group.key}
          className="panel m-entry-card m-nav-row" onClick={() => onOpenGroup(group.key)}>
          <span className="m-list-label">{group.name}</span>
          <ChevronRight size={16} className="m-list-chevron" />
        </button>)}
      </div>
    </div>}

    {matchedTasks.length > 0 && <div className="m-list-group">
      <div className="m-section-title">
        <span>{ui('mobile.search.tasks')}</span>
        <span className="m-count-badge">{matchedTasks.length}</span>
      </div>
      <div className="m-stack">
        {matchedTasks.map(item => <button type="button" key={`${item.group}/${item.task}`}
          className="panel m-entry-card m-nav-row" onClick={() => onOpenTask(item.task)}>
          <span className="m-list-body">
            <span className="m-list-label">{taskLabel(item.task)}</span>
            <span className="m-list-sub">{item.groupName} · {item.task}</span>
          </span>
          <span className="m-list-trailing">
            <ScheduleChip schedule={schedule[item.task]} ui={ui} />
            <ChevronRight size={16} className="m-list-chevron" />
          </span>
        </button>)}
      </div>
    </div>}
  </>
}

/**
 * 分组内的任务列表 —— 三级导航的中间一层。
 *
 * 之前点分组会直接进「活动A图」的配置页，跳过了「这个组里有哪些任务」；
 * 现在这一层先把该组的任务列出来，点具体任务才进配置页。
 * 与上一层同一套行样式（一行一张卡、无图标），多一行任务键。
 *
 * 第二行显示**下次运行时间**（启用中）或任务键（未启用），右侧是状态徽标 ——
 * 「这个任务启没启用、什么时候跑」在这一层就能看全，不用点进配置页。
 */
function TaskGroupScreen({ui, group, onOpenTask}: {
  ui: MobileTranslator
  group: {name: string; tasks: string[]}
  onOpenTask: (task: string) => void
}) {
  const {taskLabel, schedule} = useMobileData()
  const enabled = group.tasks.filter(task => schedule[task]).length
  return <>
    <div className="m-section-title">
      <span>{ui('mobile.tasks.count', {count: group.tasks.length})}</span>
      <span className="m-count-badge">{ui('mobile.tasks.enabledCount', {count: enabled})}</span>
    </div>
    <div className="m-stack">
      {group.tasks.map(task => {
        const state = schedule[task]
        return <button type="button" key={task}
          className="panel m-entry-card m-nav-row" onClick={() => onOpenTask(task)}>
          <span className="m-list-body">
            <span className="m-list-label">{taskLabel(task)}</span>
            <span className="m-list-sub">
              {state ? nextRunOf({name: task, label: taskLabel(task), nextRun: state.nextRun}, ui) : task}
            </span>
          </span>
          <span className="m-list-trailing">
            <ScheduleChip schedule={state} ui={ui} />
            <ChevronRight size={16} className="m-list-chevron" />
          </span>
        </button>
      })}
    </div>
  </>
}

/* ── 任务配置 ───────────────────────────────────────────────────────── */

/**
 * 任务配置页：**可读也可写**。
 *
 * 写路径是 PC 那条：`patchTaskConfig` → `config/EditQueue` → `config.patch`。
 * 所以「启用该功能」（`<Task>.Scheduler.Enable`）真的会把任务加进调度器队列，
 * 「下一次运行时间」真的能改 —— 改完实例页的队列立刻跟着变（`overview` 是订阅的）。
 * 之前这里是只读的：Switch 只有 `defaultChecked`、其余是纯文本加一个箭头，
 * 点了什么都不发生。
 *
 * 顶部有搜索（PC 的配置页也有）与分组锚点；字段按 `schema.args[task]` 的分组分段，
 * 隐藏字段由 `buildTaskConfig` 里的 `isFieldVisible` 过滤掉。
 */
function TaskConfigScreen({ui, t, isTool, onPatch, onRetry, onRun}: {
  ui: MobileTranslator
  t: (key: string) => string
  isTool: boolean
  onPatch: (path: string, value: Value) => void
  onRetry: () => void
  onRun: () => void
}) {
  const {taskConfig, taskConfigLoading, taskConfigError, refresh} = useMobileData()
  const [search, setSearch] = useState('')
  const query = search.trim().toLowerCase()
  const groups = taskConfig
    .map(group => ({
      ...group,
      fields: query
        ? group.fields.filter(field => `${field.label} ${field.path}`.toLowerCase().includes(query))
        : group.fields,
    }))
    .filter(group => group.fields.length)
  const total = taskConfig.reduce((sum, group) => sum + group.fields.length, 0)
  /* 工具类任务没有 `Scheduler.Enable`，不进调度队列，只能手动运行。
     它**必须也出现在「没有可配置项」的分支里** —— 工具本来就可能一个可调字段都没有
     （比如舰队扫描只有一块空的存储空间），此时把运行按钮一起吞掉就没法运行了。 */
  const runButton = isTool
    ? <button type="button" className="button primary m-home-new m-config-run" onClick={onRun}>
      <Play size={14} aria-hidden="true"/>{ui('task.runTool')}
    </button>
    : null

  if (taskConfigLoading && !total) {
    return <div className="loading" role="status"><LoaderCircle className="spin" size={22} />{ui('common.loading')}</div>
  }
  if (taskConfigError) {
    return <div className="m-empty-card">
      <strong>{ui('mobile.config.error')}</strong>
      <span>{taskConfigError}</span>
      <button type="button" className="button secondary m-home-new" onClick={refresh}>
        <RefreshCw size={14} aria-hidden="true"/>{ui('common.retry')}
      </button>
    </div>
  }
  if (!total) {
    return <>
      <div className="m-empty-card">
        <strong>{ui('task.noConfig')}</strong>
        <span>{ui('task.viewRelated')}</span>
      </div>
      {runButton}
    </>
  }

  return <>
    <div className="m-search-bar">
      <SearchBar placeholder={ui('task.searchConfigPlaceholder')} value={search} onChange={setSearch} />
    </div>
    {/* 分组锚点：配置动辄二十来个字段，没有它只能一路盲滚（PC 用左侧分组导航） */}
    {!query && <div className="m-group-nav">
      {groups.map(group => <button type="button" key={group.key} className="m-chip"
        onClick={() => document.getElementById(`cfg-${group.key}`)?.scrollIntoView({behavior: 'smooth', block: 'start'})}>
        {group.title}
      </button>)}
    </div>}

    {groups.map(group => <Section key={group.key} title={group.title}>
      <div className="panel m-config-card" id={`cfg-${group.key}`}>
        {group.fields.map(field => <ConfigField key={field.path} field={field} ui={ui}
          translateOption={option => t(`${group.key}.${field.path.split('.').slice(2).join('.')}.${String(option)}`)}
          onPatch={onPatch} onRetry={onRetry} />)}
      </div>
    </Section>)}

    {runButton}

    <p className="m-config-hint">{ui('mobile.config.hint')}</p>
  </>
}

/* ── 统计 ───────────────────────────────────────────────────────────── */

/**
 * 统计页。
 *
 * 数据来自**唯一一个真接口** `statistics.report`（PC 的统计页也只用它）：
 * 指标 / 曲线 / 明细表三块，六个类目各自的形状由后端决定。
 *
 * 之前这里画的是一条写死 `resource: 'ActionPoint'` 的曲线，切类目只动滑块不换数据 ——
 * 于是六个类目长得一模一样，点「石油」卡进来看到的还是行动力。
 *
 * 手机端与 PC 的取舍：曲线一次画一条（窄屏画九条没法看），用一排系列 chip 切换；
 * 分桶复用 PC 的 `aggregatePoints`；明细表复用 PC 的 25 行分页与 CSV 导出。
 */
function StatsScreen({ui}: {ui: MobileTranslator}) {
  const {stats} = useMobileData()
  const {query, setQuery, report, loading, error, refreshing, refresh} = stats
  const series = report?.series ?? []
  /* 默认挑第一条真有数据的曲线（与 PC 的 StatisticsChart 同一判据） */
  const current = series.find(item => item.key === query.seriesKey)
    ?? series.find(item => item.points.length)
    ?? series[0]
  /* 分桶交给 PC 的 aggregatePoints：按真实时间分桶，不是按下标取模抽稀。
     它给的是 OHLC 桶（开盘 / 收盘 / 最低 / 最高），折线取桶的**收盘值** —— 与 PC 的
     `StatisticsChart` 取 `item.close` 完全一致。 */
  const points = useMemo(
    () => (current ? aggregatePoints(current.points, query.bucket).map(bucket => ({time: bucket.time, value: bucket.close})) : []),
    [current, query.bucket])
  const values = points.map(point => point.value)
  const latest = values.at(-1) ?? null
  const change = values.length > 1 ? values.at(-1)! - values[0] : null
  const maximum = values.length ? Math.max(...values) : null
  const minimum = values.length ? Math.min(...values) : null
  const category = STATS_CATEGORIES.find(item => item.key === query.category)
  const number = (value: number | null) => value === null ? '—'
    : value.toLocaleString('zh-CN', {maximumFractionDigits: 2})

  function exportCategory() {
    if (!report) return
    downloadCsv(`stats-${report.category}-${report.month}`, [
      [ui('stats.metric'), ui('stats.value'), ui('stats.unit')],
      ...report.metrics.map(item => [item.label, item.value, item.unit]),
      ...report.tables.flatMap(table => [[table.title], table.columns, ...table.rows, []]),
      ...report.series.flatMap(item => [[item.label], [ui('stats.time'), ui('stats.value'), ui('stats.source')],
        ...item.points.map(point => [point.time, point.value, point.source ?? '']), []]),
      ...(report.notes.length ? [[ui('stats.notes')], ...report.notes.map(note => [note])] : []),
    ])
  }

  return <>
    <div className="m-stat-toolbar">
      <span className="m-stat-category">{category ? ui(category.labelKey) : ''}</span>
      <button type="button" className="text-button" disabled={refreshing} onClick={refresh}>
        <RefreshCw size={14} aria-hidden="true"/>{refreshing ? ui('stats.refreshing') : ui('stats.refresh')}
      </button>
      <button type="button" className="text-button" disabled={!report} onClick={exportCategory}>
        <Download size={14} aria-hidden="true"/>{ui('mobile.stats.export')}
      </button>
    </div>

    {error ? <div className="m-empty-card">
      <strong>{ui('mobile.error.title')}</strong>
      <span>{error}</span>
      <button type="button" className="button secondary m-home-new" onClick={refresh}>
        <RefreshCw size={14} aria-hidden="true"/>{ui('common.retry')}
      </button>
    </div> : null}

    {loading && !report ? <div className="loading" role="status">
      <LoaderCircle className="spin" size={22} />{ui('common.loading')}
    </div> : null}

    {/* **整页只有一个面板**，靠发丝线分段（这也是 PC 统计页的结构）。
        查询条件、指标、趋势、明细表都是这个面板里的一段 —— 各占一个盒子的话，
        一屏会叠四五个边框，视觉噪音很大。 */}
    {report ? <section className="panel m-stat-panel">
      {/* 查询条件：与 PC 的统计页逐项对应（resources 给天数，其余给月份，commission 多一个周期） */}
      <div className="m-stat-section m-stats-controls">
        {query.category === 'resources' && <label>
          <span>{ui('stats.range')}</span>
          <select aria-label={ui('stats.days')} value={query.days}
            onChange={event => setQuery({days: Number(event.target.value)})}>
            {[1, 7, 30, 90, 365].map(value =>
              <option key={value} value={value}>{ui('stats.recentDays', {days: value})}</option>)}
          </select>
        </label>}
        {['action', 'opsi', 'commission'].includes(query.category) && <label>
          <span>{ui('stats.month')}</span>
          <input type="month" aria-label={ui('stats.month')} min="2020-01" max="9998-12" value={query.month}
            disabled={query.category === 'commission' && query.period !== 'month'}
            onChange={event => { if (event.target.value) setQuery({month: event.target.value}) }}/>
        </label>}
        {query.category === 'commission' && <label>
          <span>{ui('stats.period')}</span>
          <select aria-label={ui('stats.commissionPeriod')} value={query.period}
            onChange={event => setQuery({period: event.target.value as typeof query.period})}>
            <option value="day">{ui('stats.today')}</option>
            <option value="week">{ui('stats.thisWeek')}</option>
            <option value="month">{ui('stats.selectedMonth')}</option>
          </select>
        </label>}
        {query.category === 'ships' && <p className="m-stat-note">{ui('stats.shipHint')}</p>}
        {query.category === 'loot' && <p className="m-stat-note">{ui('stats.lootHint')}</p>}
      </div>

      {report.metrics.length > 0 ? <div className="m-stat-section">
        <div className="m-stat-section-head"><span>{ui('mobile.stats.metrics')}</span></div>
        <div className="m-stat-metrics m-stat-metrics-wrap">
          {report.metrics.map(item => <span key={item.label}>
            <em>{item.label}</em><b>{number(item.value)}</b><small>{item.unit}</small>
          </span>)}
        </div>
      </div> : null}

      {series.length > 0 ? <div className="m-stat-section">
        <div className="m-stat-section-head">
          <span>{ui('stats.trendDetails')}</span>
          <span className="m-stat-section-note">{ui('stats.rawCount')} {current?.points.length ?? 0}</span>
        </div>
        {/* 系列选择：手机一次只画一条，窄屏画九条曲线谁也看不清。
            PC 用下拉选指标（`stats.metric`），这里用一排 chip，语义相同。 */}
        <div className="m-config-chips m-stat-series" role="group" aria-label={ui('stats.metric')}>
          {series.map(item => <button type="button" key={item.key}
            className={`m-chip ${item.key === current?.key ? 'is-on' : ''}`}
            aria-pressed={item.key === current?.key}
            onClick={() => setQuery({seriesKey: item.key})}>
            {item.label}
            {item.points.length ? '' : ` · ${ui('stats.noSeriesRecord')}`}
          </button>)}
        </div>
        <div className="m-stat-bucket">
          <SegmentedControl label={ui('stats.bucket')} value={String(query.bucket)}
            onChange={value => setQuery({bucket: Number(value)})}
            options={[{label: ui('stats.eachRecord'), value: '0'},
              {label: ui('stats.fiveMinutes'), value: '5'},
              {label: ui('stats.hourly'), value: '60'},
              {label: ui('stats.daily'), value: '1440'}]} />
        </div>
        {points.length ? <>
          <div className="m-stat-head">
            <span className="m-stat-title">{current?.label ?? ''}</span>
            <span className="m-stat-value">{number(latest)}</span>
            {change !== null ? <span className="m-stat-delta">
              {ui('stats.change')} {change >= 0 ? '+' : ''}{number(change)}
            </span> : null}
          </div>
          <div className="m-stat-metrics">
            <span><em>{ui('stats.maximum')}</em><b>{number(maximum)}</b></span>
            <span><em>{ui('stats.minimum')}</em><b>{number(minimum)}</b></span>
            <span><em>{ui('stats.rawCount')}</em><b>{points.length}</b></span>
          </div>
          <LineChart points={points} label={ui('stats.chartAria', {label: current?.label ?? ''})}
            hint={current && current.points.length !== points.length
              ? ui('stats.chartHint') : undefined} />
        </> : <div className="m-empty-card">
          <strong>{ui('mobile.stats.noRecord')}</strong>
          <span>{ui('mobile.stats.noRecordHint')}</span>
        </div>}
      </div> : null}

      {report.tables.map(table => <div className="m-stat-section" key={table.title}>
        <StatsTable data={table} ui={ui} />
      </div>)}

      {!series.length && !report.tables.length && !report.metrics.length
        ? <div className="m-stat-section"><div className="m-empty-card">
          <strong>{ui('mobile.stats.noRecord')}</strong>
          <span>{ui('mobile.stats.noRecordHint')}</span>
        </div></div>
        : null}
    </section> : null}
  </>
}

/* ── 日志 / 截图 ────────────────────────────────────────────────────── */

/**
 * 日志页是**整屏自适应**的：页面本身不滚，日志在自己的区域里滚。页眉与 Tab 栏之间
 * 是一个纵向 flex：分段条固定、日志卡撑满剩余高度、工具行固定、`.m-logscroll` 自己滚。
 *
 * **日志一行一条、不折行，横竖都能拖**：纵向是虚拟化滚动，横向靠
 * `overflow: auto` + 内容 `width: max-content`。但**行高不再写死 18px** ——
 * rich 会把超宽正文 fold 成多行，回溯信息本身就是多行，`logger.hr` 的分割线行
 * 还带外边距；按定高渲染这些行会溢出并与下一行叠字。现在高度按内容行数算，
 * 虚拟化走 `useVirtualRows`（前缀和二分）。
 *
 * **自动滚动默认开**：新行进来就贴到最新一行。**用户往上拖则自动关闭** ——
 * 判据只看纵向（`scrollTop` 变小），因为横向拖动同样会触发 scroll 事件。
 *
 * 工具栏与 PC 的 `LogPanel` 对齐：级别过滤、关键字搜索（命中会高亮）、
 * 导出当前视图为 txt、清空当前视图（本地 floor，后端没有清空接口）。
 */
function LogsScreen({ui, tab, onTab, instance}: {
  ui: MobileTranslator
  tab: 'logs' | 'preview'
  onTab: (tab: 'logs' | 'preview') => void
  instance: string
}) {
  const {logs, logsCursor, preview, setPreviewEnabled, current} = useMobileData()
  const [auto, setAuto] = useState(true)
  /* 「清空」清的是当前视图（PC 的 floor 语义），不删服务端日志 —— 后端没有清空接口 */
  const [floor, setFloor] = useState(0)
  const [level, setLevel] = useState('ALL')
  const [search, setSearch] = useState('')
  /* 后端游标回退 = API 进程重启、`id` 从 1 重算，此时 floor 必须归零，
     否则新日志的 id 永远小于 floor，页面是一片空白（PC 的同款自愈）。 */
  useEffect(() => {
    setFloor(previous => (logsCursor < previous ? 0 : previous))
  }, [logsCursor])
  const visible = useMemo(() => logs.filter(entry =>
    entry.id > floor
    && (level === 'ALL' || entry.level === level)
    && entry.text.toLowerCase().includes(search.trim().toLowerCase())), [logs, floor, level, search])
  /* 行高 = 内容行数 × 18px；多行条目（回溯 / rich 折行）再加 4px，因为 PC 给
     分割线行留了上下外边距，压到 18px 会贴在一起。 */
  const heights = useMemo(() => visible.map(entry => {
    const lines = entry.text.replace(/[\r\n]+$/, '').split('\n').length
    return lines * LOG_ROW_HEIGHT + (lines > 1 ? 4 : 0)
  }), [visible])
  const {ref, window: vw} = useVirtualRows(heights, {overscan: 12, mode: 'container'})
  const rows = visible.slice(vw.start, vw.end).map((entry, index) => ({entry, height: heights[vw.start + index]}))
  const programmatic = useRef(false)
  const lastTop = useRef(0)
  /* 自动跟随要盯的是「最后一条是谁」，不是「一共有几条」：日志到 400 上限之后长度恒定，
     若用长度做依赖，新行持续进来时再也不会贴底（而变高行进出还会改变总高度）。 */
  const lastId = visible.at(-1)?.id ?? 0

  /* 打开截图 tab = 让外壳把 preview 加进订阅；离开时关掉（对应 PC 的 cleanup） */
  useEffect(() => {
    setPreviewEnabled(tab === 'preview')
  }, [tab, setPreviewEnabled])
  useEffect(() => () => setPreviewEnabled(false), [setPreviewEnabled])

  /* 自动跟随：新行进来就贴到最新一行 */
  useEffect(() => {
    if (!auto) return
    const node = ref.current
    if (!node) return
    const bottom = node.scrollHeight - node.clientHeight
    /* 已经在底部时不赋值：赋值不会派发 scroll 事件，programmatic 标记会残留下来，
       把用户接下来的第一次上滑吞掉（自动滚动就关不掉了）。 */
    if (Math.abs(node.scrollTop - bottom) < 1) return
    programmatic.current = true
    node.scrollTop = bottom
    lastTop.current = node.scrollTop
  }, [auto, lastId, ref])

  /** 往上拖 = `scrollTop` 变小。横向拖动不会改变 `scrollTop`，所以不会被误判。 */
  function onScroll() {
    const node = ref.current
    if (!node) return
    if (programmatic.current) {
      programmatic.current = false
      lastTop.current = node.scrollTop
      return
    }
    if (node.scrollTop < lastTop.current - 1) setAuto(false)
    lastTop.current = node.scrollTop
  }

  /* 导出当前过滤后可见的日志，与 PC 的 LogPanel 一样是纯文本 */
  function download() {
    const url = URL.createObjectURL(new Blob([visible.map(entry => entry.text).join('\n')],
      {type: 'text/plain;charset=utf-8'}))
    const link = document.createElement('a')
    link.href = url
    link.download = `${instance || 'instance'}-logs.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  return <div className="panel m-logcard">
    <div className="m-logs-tabs">
      <SegmentedControl label={ui('mobile.logs.tab.logs')} value={tab} onChange={onTab}
        options={[{label: ui('mobile.logs.tab.logs'), value: 'logs'},
          {label: ui('mobile.logs.tab.preview'), value: 'preview'}]} />
    </div>
    {tab === 'logs' ? <>
      {/* 视图工具行：**不换行**。360dp 上「自动滚动 + 开关 + 级别 + 导出 + 清空」
          一行放得下，前提是导出/清空用图标而不是文字 —— 文字版会被挤成竖排的
          「导 / 出」两行，整个工具行高得离谱（真机上量过）。 */}
      <div className="m-logtoolbar">
        <span className="m-log-toggle-label">{ui('mobile.logs.autoScroll')}</span>
        <Switch checked={auto} onChange={setAuto} aria-label={ui('mobile.logs.autoScroll')} />
        <select className="m-log-level" aria-label={ui('log.level')} value={level}
          onChange={event => setLevel(event.target.value)}>
          {['ALL', 'DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'].map(item =>
            <option key={item} value={item}>{item === 'ALL' ? ui('log.allLevels') : item}</option>)}
        </select>
        <button type="button" className="m-log-action" onClick={download} disabled={!visible.length}
          aria-label={ui('log.export')} title={ui('log.export')}>
          <Download size={18} aria-hidden="true"/>
        </button>
        <button type="button" className="m-log-action"
          onClick={() => setFloor(logs.at(-1)?.id ?? 0)}
          aria-label={ui('mobile.logs.clear')} title={ui('mobile.logs.clear')}>
          <Trash2 size={18} aria-hidden="true"/>
        </button>
      </div>
      <div className="m-logtoolbar">
        <SearchBar placeholder={ui('log.searchPlaceholder')} value={search} onChange={setSearch} />
        <span className="m-log-count">{ui('log.recent', {count: visible.length})}</span>
      </div>
      {/* ref 挂在滚动容器上（container 模式），虚拟列表在其内部撑开真实高度 */}
      {visible.length
        ? <div ref={ref} className="m-logscroll" onScroll={onScroll} aria-label={ui('log.content')}>
          <div className="m-virtual" style={{height: vw.totalHeight}}>
            <div className="m-virtual-window" style={{transform: `translateY(${vw.offsetY}px)`}}>
              {rows.map(({entry, height}) => (
                <div key={entry.id} className="m-virtual-row" style={{height}}>
                  {/* 直接挂 PC 的 LogLine：级别 → 时间 → │ → 正文，配色也走 PC 的 .lvl-* */}
                  <LogLine entry={entry} search={search}/>
                </div>
              ))}
            </div>
          </div>
        </div>
        : <div ref={ref} className="m-logscroll"><div className="panel m-empty-card">
          <strong>{logs.length ? ui('log.noMatch') : ui('mobile.logs.empty')}</strong>
          <span>{logs.length ? ui('log.adjustFilter') : ui('log.waiting')}</span>
        </div></div>}
    </> : <div className="m-logpreview">
      {preview?.image ? <>
        <img src={preview.image} alt={ui('monitor.screenshotAlt')}
          style={{cursor: 'zoom-in'}}
          onClick={() => { ImageViewer.show({image: preview.image!}) }} />
        {/* 真正的保存：原来那个按钮只弹了个 Toast，什么都没存 */}
        <a className="button primary" download={`${current ?? 'instance'}-screenshot.jpg`}
          href={preview.image}>{ui('monitor.saveScreenshot')}</a>
      </> : <div className="m-empty-card">
        <strong>{ui('monitor.waitingScreenshot')}</strong>
        <span>{ui('monitor.screenshotHint')}</span>
      </div>}
    </div>}
  </div>
}
