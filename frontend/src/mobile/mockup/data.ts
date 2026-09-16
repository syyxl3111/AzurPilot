/** 示意图用的假数据。全部本地生成，不请求后端。 */
import type { LogEntry } from '../../api/types'
import type { QueueTask, TaskSchedule, StatsReport } from '../data'
import type { InstanceView } from '../components/InstanceCard'
import type { ResourceView } from '../components/ResourceCard'
import type { StatsCategory } from '../resourceRoute'

const minutesAgo = (minutes: number) => {
  const date = new Date(Date.now() - minutes * 60_000)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

/**
 * 两个实例，服务器与序列号都照**真机的原始值**写：`instances.list` 给的是配置里的
 * 原样取值（实测 `cn_android-29` 这种），不是 `cn`。写成 `cn` 会让评审入口显示一个
 * 真机上不可能出现的服务器名，而 `Emulator.ServerName.cn_android-N` 才是 schema 里
 * 真正存在的翻译键（见 `module/config/i18n/zh-CN.json`）。
 */
export const mockInstances: InstanceView[] = [
  {name: 'alas', status: 'stopped', serial: '127.0.0.1:16384', server: 'cn_android-29'},
  {name: 'alas2', status: 'running', serial: 'emulator-5556', server: 'jp-0', currentTask: 'OpsiScheduling'},
]

/** 12 种资源，值与 config/template.json 的 Dashboard 顺序一致。 */
export const mockResources: ResourceView[] = [
  {name: 'Oil', label: '石油', value: 4844, limit: 12200, record: minutesAgo(3)},
  {name: 'Coin', label: '物资', value: 30317, limit: 74700, record: minutesAgo(3)},
  {name: 'Gem', label: '钻石', value: 131, record: minutesAgo(4)},
  {name: 'Pt', label: '活动PT', value: 30690, record: minutesAgo(240)},
  {name: 'Cube', label: '心智魔方', value: 133, record: minutesAgo(4)},
  {name: 'ActionPoint', label: '行动力', value: 148, total: 3080, record: minutesAgo(1)},
  {name: 'YellowCoin', label: '作战补给凭证', value: 186360, record: minutesAgo(240)},
  {name: 'PurpleCoin', label: '特别兑换凭证', value: 2452, record: minutesAgo(240)},
  {name: 'Core', label: '核心数据', value: 0, record: '2020-01-01 00:00:00'},
  {name: 'Medal', label: '荣誉勋章', value: 117581, record: minutesAgo(30)},
  {name: 'Merit', label: '功勋', value: 1174, record: minutesAgo(30)},
  {name: 'GuildCoin', label: '舰队币', value: 3300, record: minutesAgo(30)},
]

/** 第二个实例在跑，第一个停着 —— 两种状态在首页上都能评到。 */
export const mockStatus = mockInstances[0].status

export const mockQueue: {running: QueueTask[]; pending: QueueTask[]; waiting: QueueTask[]} = {
  running: [{name: 'OpsiScheduling', label: '智能调度Plus', nextRun: ''}],
  pending: [
    {name: 'Commission', label: '委托', nextRun: '09-09 00:00'},
    {name: 'Guild', label: '大舰队', nextRun: '03:39'},
  ],
  waiting: [
    {name: 'Reward', label: '收获', nextRun: '06:00'},
    {name: 'Tactical', label: '战术学院', nextRun: '06:00'},
    {name: 'Exercise', label: '演习', nextRun: '07:37'},
    {name: 'Dorm', label: '宿舍', nextRun: '08:10'},
  ],
}

/**
 * 任务键 → 调度状态，**由队列反推**（真数据的 `overview.tasks` 也只含已启用的任务）。
 *
 * 状态值与原样照抄真机回包：`running | pending | waiting`。有了它，
 * 评审入口的任务页才能把「启用 / 未启用 / 下次运行」这几种徽标都评到。
 */
export const mockSchedule: Record<string, TaskSchedule> = Object.fromEntries(
  ([['running', mockQueue.running], ['pending', mockQueue.pending], ['waiting', mockQueue.waiting]] as const)
    .flatMap(([state, tasks]) => tasks.map(task => [task.name, {
      state, nextRun: task.nextRun ?? '', pending: state === 'pending',
    }])))

/**
 * 任务树：分组 → 任务，形状与 PC 的 schema.menu 一致。
 *
 * 刻意按真实的量级铺：module/config/argument/menu.json 有 10 个顶层分组、
 * args.json 里有 96 个任务。评审时如果只放 6 个分组，就看不出「分组一层其实不长、
 * 真正长的是日志和任务配置」这件事，虚拟化的取舍也就无从判断。
 *
 * 任务键 → 显示名、以及配置页的字段定义，都**不在这个文件里手写**：
 * 它们由 `menuFixture.ts` 从真实 menu.json / args.json / i18n 生成，见
 * `dev_tools/export_mobile_menu.mjs`。手写过一次，结果是评审入口漏掉了
 * `display: hide` 的内部字段，真机上多出的四行配置在评审时根本看不见。
 */

/**
 * 日志缓冲区：真实上限是 400 行（`runtime_service.logs` 的 `entries[-400:]`）。
 *
 * 这里就铺满 400 行 —— 只放 5 行的话，「长列表要不要虚拟化」在评审时根本
 * 看不出来，滚动会不会掉帧也无从验证。
 */
const LOG_TEMPLATES: Array<(index: number) => string> = [
  index => `[设备] 点击 (${420 + (index % 180)}, ${300 + (index % 220)})`,
  index => `[UI] → ${['page_main', 'page_event', 'page_os', 'page_reward', 'page_commission'][index % 5]}`,
  index => `[战斗] 舰队 ${(index % 2) + 1} 移动至 ${'ABCDEFG'[index % 7]}${(index % 8) + 1}`,
  index => `当前石油: ${4844 - (index % 400)} / 12200`,
  index => `[OCR] Digit ${(index % 90) + 10} 识别耗时 ${(index % 40) + 8}ms`,
  index => `<<< ${['UI确保索引', 'UI确保主页', 'UI回到主页', '等待战斗结束'][index % 4]} >>>`,
  index => `[任务] ${['Research', 'Commission', 'Tactical', 'Dorm', 'Guild', 'Reward'][index % 6]} 已排入队列`,
  () => `[通知] onepush 推送成功`,
  index => `模板匹配相似度偏低: ${(0.6 + (index % 30) / 100).toFixed(2)}`,
  index => `[调度] 下一个任务 ${(index % 24).toString().padStart(2, '0')}:00`,
]

/**
 * 400 行日志，**结构照搬 PC 的 `LogEntry`**（`{id, level, text}`），
 * `text` 用 PC 的真实行格式：`LEVEL  时间 │ 正文` —— 也就是
 * `components/LogPanel.tsx` 里 `LOG_LINE_RE` 认的那一种。
 *
 * 这样手机端可以直接把 PC 的 `LogLine` 组件挂上去渲染：级别 → 时间 → │ → 正文
 * 的顺序、`.lvl-info` / `.lvl-error` 那套配色、以及 DOM 结构全都与 PC 一致，
 * 不必在手机端重画一遍（重画就会慢慢漂移）。`data.test.ts` 拿 `LOG_LINE_RE`
 * 逐行验证，保证假数据不会跑出 PC 的格式。
 */
const LOG_LEVELS: Array<[number, string]> = [
  [97, 'CRITICAL'],
  [41, 'ERROR'],
  [17, 'WARNING'],
  [11, 'DEBUG'],
]

function logLevel(index: number): string {
  for (const [step, name] of LOG_LEVELS) {
    if (index % step === 0 && index > 0) return name
  }
  return 'INFO'
}

/* 400 条 = 与后端对齐的上限：后端每实例只留最近 400 条，客户端留更多没有意义。 */
export const mockLogs: LogEntry[] = Array.from({length: 400}, (_, index) => {
  const seconds = 37 + index
  const time = `${String(3 + Math.floor(seconds / 3600)).padStart(2, '0')}:${String(Math.floor(seconds / 60) % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}.${String((index * 137) % 1000).padStart(3, '0')}`
  const level = logLevel(index)
  /* 级别与时间之间、时间与「│」之间都用空格，跟 PC 的原始日志行完全一致。
     每 40 行插一条 `logger.hr` 的分割线行、每 97 行插一段多行回溯 —— 真机上这两类
     都会出现，而定高虚拟化就是被它们撑破的，评审时必须在场。 */
  const body = index % 40 === 39
    ? '═'.repeat(24)
    : index % 97 === 96
      ? `${LOG_TEMPLATES[index % LOG_TEMPLATES.length](index)}\nTraceback (most recent call last):\n  File "alas.py", line 412, in run\n    self.device.screenshot()\nRuntimeError: 模拟器截图超时`
      : LOG_TEMPLATES[index % LOG_TEMPLATES.length](index)
  return {id: index + 1, level, text: `${level}  ${time} │ ${body}`}
})

/**
 * 统计报表的假数据 —— **形状逐字段照抄 `statistics.report` 的真回包**
 * （`module/api/statistics_service.py`）：指标、曲线、明细表三块，六个类目各自的
 * 字段数量也对齐（resources 9 条曲线没有表格；opsi 只有指标和表格没有曲线）。
 *
 * 六个类目都给不同的内容，是为了让「切换类目」在评审时真的看得出数据变了 ——
 * 之前六个类目画的都是同一条写死的行动力曲线，评审时以为切了，其实没有。
 */
function mockSeries(key: string, label: string, base: number, amplitude: number, drift: number) {
  const hours = 168
  const points = Array.from({length: hours}, (_, index) => {
    const time = new Date(Date.now() - (hours - 1 - index) * 3_600_000)
    const pad = (value: number) => String(value).padStart(2, '0')
    const wave = Math.sin(index / 9) * amplitude + Math.sin(index / 3.5) * (amplitude / 3)
    return {
      time: `${time.getFullYear()}-${pad(time.getMonth() + 1)}-${pad(time.getDate())} ${pad(time.getHours())}:00:00`,
      value: Math.max(0, Math.round(base + wave + index * drift)),
      /* 来源字段真数据是 `scheduler` / `task` 这类采集来源，明细表要显示它 */
      source: index % 5 === 0 ? 'scheduler' : 'task',
    }
  })
  return {key, label, points}
}

const RESOURCE_SERIES: Array<[string, string, number, number, number]> = [
  ['oil', '石油', 4200, 420, 4], ['coin', '物资', 24000, 2600, 30], ['gem', '钻石', 120, 18, 0.05],
  ['pt', '活动 PT', 28000, 3200, 20], ['cube', '心智魔方', 130, 12, 0.02], ['core', '核心数据', 2400, 260, 3],
  ['medal', '荣誉勋章', 110000, 9000, 60], ['merit', '功勋', 1100, 90, 0.6], ['guild_coin', '舰队币', 3200, 240, 1],
]

const OPSI_SERIES: Array<[string, string, number, number, number]> = [
  ['ap', '行动力', 1800, 420, 6], ['asset', '行动力资产', 92000, 5200, 60],
  ['distance', '海里数', 640, 90, 0.8], ['yellow_coins', '作战补给凭证', 186000, 4200, 40],
  ['purple_coins', '特别兑换凭证', 2400, 180, 0.6],
]

/** 逐类目返回一份报表；键与真数据的 `category` 参数一一对应。 */
export function mockStatsReport(category: StatsCategory): StatsReport {
  const month = minutesAgo(0).slice(0, 7)
  if (category === 'resources') {
    return {
      category, month, metrics: [], tables: [], notes: [],
      series: RESOURCE_SERIES.map(([key, label, base, amplitude, drift]) => mockSeries(key, label, base, amplitude, drift)),
    }
  }
  if (category === 'action') {
    return {
      category, month, metrics: [], tables: [], notes: [],
      series: OPSI_SERIES.map(([key, label, base, amplitude, drift]) => mockSeries(key, label, base, amplitude, drift)),
    }
  }
  if (category === 'opsi') {
    return {
      category, month,
      metrics: [
        {label: '战斗次数', value: 812, unit: '场'}, {label: '出击轮数', value: 406, unit: '轮'},
        {label: '出击消耗', value: 2030, unit: '行动力'}, {label: '明石遭遇', value: 47, unit: '次'},
        {label: '明石遭遇率', value: 11.58, unit: '%'}, {label: '塞壬研究装置', value: 63, unit: '个'},
        {label: '装置获取率', value: 15.52, unit: '%'}, {label: '购买行动力', value: 2400, unit: ''},
        {label: '平均每次购买', value: 51.06, unit: ''}, {label: '净行动力', value: 370, unit: ''},
        {label: '循环效率', value: 18.23, unit: '%'},
      ],
      series: [], notes: [],
      tables: [{
        title: '短猫运行统计',
        columns: ['侵蚀等级', '战斗次数', '有效轮数', '平均战斗秒数', '平均每轮秒数', '研究装置', '获取率（%）', '统计来源'],
        rows: [[3, 512, 256, 41.2, 78.4, 38, 14.84, '实测'], [5, 300, 150, 46.8, 92.1, 25, 16.67, '估算']],
      }],
    }
  }
  if (category === 'commission') {
    return {
      category, month,
      metrics: [
        {label: '完成委托', value: 128, unit: '项'}, {label: '石油', value: 41200, unit: ''},
        {label: '物资', value: 38600, unit: ''}, {label: '钻石', value: 74, unit: ''},
        {label: '心智魔方', value: 31, unit: ''}, {label: '心智单元', value: 12, unit: ''},
      ],
      notes: [],
      series: [
        mockSeries('Gem', '钻石', 12, 3, 0.05), mockSeries('Cube', '心智魔方', 5, 2, 0.02),
        mockSeries('Chip', '心智单元', 2, 1, 0.01), mockSeries('Oil', '石油', 6800, 700, 6),
        mockSeries('Coin', '物资', 6400, 640, 5),
      ],
      tables: [
        {
          title: '委托收益明细',
          columns: ['资源', '总收益', '掉落记录数', '平均每次掉落'],
          rows: [['钻石', 74, 62, 1.19], ['心智魔方', 31, 28, 1.11], ['石油', 41200, 96, 429.17], ['物资', 38600, 96, 402.08]],
        },
        {
          title: '委托结算记录',
          columns: ['时间', '委托数量', '钻石', '魔方', '心智单元', '石油', '物资'],
          rows: [
            [minutesAgo(40), 4, 8, 2, 0, 3200, 2800],
            [minutesAgo(400), 4, 12, 4, 1, 4100, 3900],
            [minutesAgo(760), 4, 6, 0, 0, 2900, 3100],
          ],
        },
      ],
    }
  }
  if (category === 'ships') {
    return {
      category, month,
      metrics: [
        {label: '目标等级', value: 125, unit: ''}, {label: '预估经验效率', value: 18420, unit: '/小时'},
        {label: '平均战斗时长', value: 41.6, unit: '秒'}, {label: '平均每轮时长', value: 79.3, unit: '秒'},
        {label: '短猫平均战斗时长', value: 44.8, unit: '秒'}, {label: '今日战斗', value: 62, unit: '场'},
        {label: '今日经验', value: 184200, unit: ''}, {label: '今日运行', value: 96.4, unit: '分钟'},
      ],
      notes: [],
      series: [mockSeries('total_exp_gained', '每日经验', 160000, 24000, 20), mockSeries('battle_count', '每日战斗', 58, 9, 0.02), mockSeries('total_run_time', '每日运行秒数', 5400, 600, 2)],
      tables: [{
        title: '舰船升级进度',
        columns: ['位置', '等级', '当前经验', '累计经验', '目标经验', '检测后战斗数', '还需经验', '还需战斗', '预估用时'],
        rows: [
          ['vanguard-1', 121, '182400/240000', 182400, 240000, 214, 57600, 34, '3 小时 52 分'],
          ['main-1', 118, '96000/210000', 96000, 210000, 214, 114000, 71, '8 小时 06 分'],
        ],
        note: `上次检测：${minutesAgo(30)}；舰队：2。`,
      }],
    }
  }
  return {
    category, month, metrics: [], series: [], notes: [],
    tables: [{
      title: '短猫掉落收益',
      columns: ['侵蚀等级', '时间', '物资', '石油', '心智魔方', '装备图纸'],
      rows: [[3, minutesAgo(120), 1240.5, 320.0, 0.12, 0.04], [5, minutesAgo(240), 1860.0, 410.0, 0.18, 0.06]],
      note: '掉落数据来自短猫出击记录，刷新会重算本地缓存。',
    }],
  }
}
