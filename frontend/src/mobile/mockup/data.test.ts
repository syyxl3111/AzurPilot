import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { LOG_LINE_RE } from '../../components/LogPanel'
import {
  mockInstances, mockLogs, mockQueue, mockResources, mockSchedule, mockStatsReport,
} from './data'
import { MENU_GROUPS, MENU_TASK_LABELS, TASK_CONFIG_FIXTURES } from './menuFixture'
import { STATS_CATEGORIES } from '../resourceRoute'

describe('任务菜单夹具', () => {
  /**
   * 夹具是 `dev_tools/export_mobile_menu.mjs` 从真实来源生成的，所以这里直接拿
   * 真实来源比对 —— 生成物一旦过期（有人改了 menu.json 却没重跑脚本），这里就红。
   * 这也顺手替掉了原来那套「手写分组」的测试。
   */
  const menu = JSON.parse(readFileSync(
    new URL('../../../../module/config/argument/menu.json', import.meta.url), 'utf8')) as
    Record<string, {page: string; tasks: string[]}>

  it('与 menu.json 的分组、顺序、任务列表逐项一致', () => {
    expect(MENU_GROUPS.map(group => group.key)).toEqual(Object.keys(menu))
    for (const group of MENU_GROUPS) {
      expect(group.tasks, `分组 ${group.key} 的任务列表与 menu.json 不一致`)
        .toEqual(menu[group.key].tasks)
    }
  })

  it('分组名不是键名回显，也不是示意图里那套手写分组', () => {
    for (const group of MENU_GROUPS) {
      expect(group.name, `${group.key} 的分组名还是键名`).not.toBe(group.key)
    }
    const handWritten = ['常规', '出击', '活动', '活动每日', '收获', '每日任务', '大世界', '岛屿', '舰队管理', '工具']
    expect(MENU_GROUPS.map(group => group.name).sort(), '又回到手写分组了')
      .not.toEqual([...handWritten].sort())
  })

  it('每个任务都有中文名 —— 不能有键名回显', () => {
    const missing = MENU_GROUPS.flatMap(group => group.tasks)
      .filter(task => MENU_TASK_LABELS[task] === undefined || MENU_TASK_LABELS[task] === task)
    expect(missing, `这些任务没有中文名，界面上会回显任务键：${missing.join(', ')}`).toEqual([])
  })

  it('没有多余的登记项', () => {
    const used = new Set(MENU_GROUPS.flatMap(group => group.tasks))
    const stale = Object.keys(MENU_TASK_LABELS).filter(key => !used.has(key))
    expect(stale, `这些登记项已经不在这棵任务树里了：${stale.join(', ')}`).toEqual([])
  })

  it('同一组内不重名', () => {
    for (const group of MENU_GROUPS) {
      const names = group.tasks.map(task => MENU_TASK_LABELS[task])
      expect(new Set(names).size, `分组「${group.name}」里有重名`).toBe(names.length)
    }
  })

  it('带上 menu 的 page —— 工具类任务要靠它才认得出', () => {
    for (const group of MENU_GROUPS) {
      expect(group.page, `分组 ${group.key} 缺少 page`).toBe(menu[group.key].page)
    }
    expect(MENU_GROUPS.some(group => group.page === 'tool'), '一个 tool 分组都没有').toBe(true)
  })

  it('配置夹具与 args.json 逐字段一致（类型、display 都要对得上）', () => {
    /* 夹具是生成的，这里直接和真实来源比对：有人改了 argument.yaml 却没重跑脚本，
       评审入口的配置页就会跟真机长得不一样，而那种漂移肉眼几乎看不出来。 */
    const args = JSON.parse(readFileSync(
      new URL('../../../../module/config/argument/args.json', import.meta.url), 'utf8')) as
      Record<string, Record<string, Record<string, {type?: string; display?: string}>>>
    for (const [task, fixture] of Object.entries(TASK_CONFIG_FIXTURES)) {
      const real = args[task]
      expect(real, `args.json 里没有 ${task}`).toBeTruthy()
      for (const [group, fields] of Object.entries(fixture.args)) {
        for (const [arg, field] of Object.entries(fields as Record<string, {type?: string; display?: string}>)) {
          expect(field.type, `${task}.${group}.${arg} 的类型与 args.json 不一致`).toBe(real[group][arg].type)
          expect(field.display, `${task}.${group}.${arg} 的 display 与 args.json 不一致`)
            .toBe(real[group][arg].display)
        }
      }
    }
  })

  it('夹具覆盖了几种典型任务：普通任务、字段最全的、只读字段的、以及只能手动运行的工具任务', () => {
    /* 全量 96 个任务的 args.json 有 410 KB，搬进前端得不偿失；但评审需要的
       「几种典型形状」必须都有人演，否则配置页的某些分支根本评审不到。 */
    expect(Object.keys(TASK_CONFIG_FIXTURES).sort())
      .toEqual(['Alas', 'Commission', 'FleetScan', 'Restart'])
    /* 工具类任务在 menu 里是 page=tool，没有 Scheduler.Enable —— 「立即执行」按钮靠它演 */
    const toolTasks = MENU_GROUPS.filter(group => group.page === 'tool').flatMap(group => group.tasks)
    expect(toolTasks).toContain('FleetScan')
  })

  it('字段形状够杂：hide / 开关 / 下拉 / 数字 / 多行 / 日期 / 只读都得有', () => {
    const all = Object.values(TASK_CONFIG_FIXTURES)
      .flatMap(fixture => Object.values(fixture.args))
      .flatMap(fields => Object.values(fields as Record<string, {type?: string; display?: string}>))
    const types = new Set(all.map(field => field.type))
    for (const type of ['checkbox', 'select', 'input', 'textarea', 'datetime', 'storage']) {
      expect(types.has(type), `夹具里没有 ${type} 类型的字段`).toBe(true)
    }
    expect(all.some(field => field.display === 'hide'),
      '夹具里没有 display:hide 的字段，可见性过滤就评不到').toBe(true)
    expect(all.some(field => field.display === 'disabled'),
      '夹具里没有 display:disabled 的字段，只读分支就评不到').toBe(true)
  })

  it('每个配置项都有中文名，不留键名回显', () => {
    for (const [task, fixture] of Object.entries(TASK_CONFIG_FIXTURES)) {
      const translations = fixture.translations
      const missing = Object.entries(fixture.args).flatMap(([group, fields]) =>
        Object.keys(fields).filter(arg => {
          const name = translations[`${group}.${arg}.name`]
          return !name || name === arg
        }).map(arg => `${task}.${group}.${arg}`))
      expect(missing, `这些配置项没有中文名：${missing.join(', ')}`).toEqual([])
    }
  })
})

describe('mock data invariants', () => {
  it('keeps the twelve dashboard resources with a label each', () => {
    expect(mockResources).toHaveLength(12)
    for (const resource of mockResources) {
      expect(resource.label.trim(), `${resource.name} 缺标签`).not.toBe('')
      expect(resource.name.trim()).not.toBe('')
    }
  })

  it('keeps a never-recorded resource so the 未采集 branch stays reviewable', () => {
    expect(mockResources.some(resource => resource.record === '2020-01-01 00:00:00')).toBe(true)
  })

  it('keeps an ActionPoint with a total so the parenthesised figure stays reviewable', () => {
    const action = mockResources.find(resource => resource.name === 'ActionPoint')
    expect(action?.total).toBeGreaterThan(0)
    expect(action?.limit).toBeUndefined()
  })

  it('fills the whole log ring buffer', () => {
    // 后端每实例只留最近 400 条；铺满才能验证虚拟化，也才和后端上限对得上
    expect(mockLogs).toHaveLength(400)
    expect(new Set(mockLogs.map(entry => entry.text)).size).toBeGreaterThan(300)
  })

  it('emits lines that PC 的 LogLine 认得出来', () => {
    /* 手机端直接挂 PC 的 LogLine 组件渲染，所以假数据必须过它的 LOG_LINE_RE
       （`LEVEL  时间 │ 正文`）。跑偏了就会整片退化成「原始行」样式，级别也不上色。
       级别**必须是大写**：后端 `runtime_service.logs()` 是用
       `re.search(r'\b(DEBUG|INFO|WARNING|ERROR|CRITICAL)\b')` 从正文里提出来的，
       给成小写，真机上按级别过滤/上色就会全部落空。 */
    let matched = 0
    for (const entry of mockLogs) {
      if (!LOG_LINE_RE.test(entry.text)) continue
      matched += 1
      const [, level, , time] = LOG_LINE_RE.exec(entry.text)!
      expect(level, `${entry.text} 的级别字段与 entry.level 不一致`).toBe(entry.level)
      expect(time, `${entry.text} 没有时间`).toBeTruthy()
    }
    expect(matched, `${mockLogs.length} 行里只有 ${matched} 行能被 LOG_LINE_RE 解析`).toBe(mockLogs.length)
  })

  it('keeps every level uppercase like the backend does', () => {
    for (const entry of mockLogs) {
      expect(entry.level, `${entry.text} 的级别不是大写枚举`).toBe(entry.level.toUpperCase())
    }
  })

  it('carries multi-line entries and rule lines, which the fixed row height could not hold', () => {
    /* rich 会把超宽正文 fold 成多行，回溯信息本来就是多行，`logger.hr` 还会打分割线。
       假日志里必须有这两类，否则「行高要按内容算」这件事在评审时验证不到。 */
    expect(mockLogs.some(entry => entry.text.includes('\n')), '假日志里没有多行条目').toBe(true)
    expect(mockLogs.some(entry => /^[═─]{3,}\s*$/.test(entry.text.split('│').at(-1)!.trim())),
      '假日志里没有 logger.hr 的分割线行').toBe(true)
  })

  it('spreads the log across levels so every colour is reviewable', () => {
    const levels = new Set(mockLogs.map(entry => entry.level))
    for (const level of ['INFO', 'WARNING', 'ERROR', 'DEBUG', 'CRITICAL']) {
      expect(levels.has(level), `日志里没有 ${level} 级别，评审时看不到它的颜色`).toBe(true)
    }
    // INFO 必须占多数，否则不像真实日志
    const info = mockLogs.filter(entry => entry.level === 'INFO').length
    expect(info / mockLogs.length).toBeGreaterThan(0.6)
  })

  it('keeps every instance status distinct so each badge is reviewable', () => {
    const statuses = new Set(mockInstances.map(instance => instance.status))
    expect(statuses.size).toBeGreaterThanOrEqual(2)
  })

  it('never queues a task without a label', () => {
    const queued = [...mockQueue.running, ...mockQueue.pending, ...mockQueue.waiting]
    expect(queued.length).toBeGreaterThan(0)
    for (const task of queued) expect(task.label.trim(), `${task.name} 缺标签`).not.toBe('')
  })
})

describe('调度状态与统计报表的假数据', () => {
  it('调度表只登记队列里的任务 —— 后端的 overview.tasks 也只含已启用的', () => {
    const queued = new Set([...mockQueue.running, ...mockQueue.pending, ...mockQueue.waiting].map(task => task.name))
    expect(new Set(Object.keys(mockSchedule))).toEqual(queued)
  })

  it('三种状态都出现过，任务页的三个徽标都能评审到', () => {
    const states = new Set(Object.values(mockSchedule).map(item => item.state))
    expect([...states].sort()).toEqual(['pending', 'running', 'waiting'])
  })

  it('调度状态与所在分组一致，不会自相矛盾', () => {
    for (const task of mockQueue.running) expect(mockSchedule[task.name].state).toBe('running')
    for (const task of mockQueue.pending) expect(mockSchedule[task.name].pending).toBe(true)
    for (const task of mockQueue.waiting) expect(mockSchedule[task.name].pending).toBe(false)
  })

  it('六个类目都有一份形状合法的报表，且内容各不相同', () => {
    const seen = new Set<string>()
    for (const {key} of STATS_CATEGORIES) {
      const report = mockStatsReport(key)
      expect(report.category).toBe(key)
      expect(report.month).toMatch(/^\d{4}-\d{2}$/)
      /* 真回包的三个数组字段一个都不能少（空数组也要给） */
      expect(Array.isArray(report.metrics)).toBe(true)
      expect(Array.isArray(report.series)).toBe(true)
      expect(Array.isArray(report.tables)).toBe(true)
      for (const item of report.series) {
        expect(item.key.trim()).not.toBe('')
        expect(item.label.trim()).not.toBe('')
        expect(item.points.length).toBeGreaterThan(0)
        for (const point of item.points) {
          expect(point.time).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
          expect(Number.isFinite(point.value)).toBe(true)
        }
      }
      /* 曲线 key 在类目之间不能撞名：撞了「切类目」看起来就没换数据 */
      for (const item of report.series) seen.add(`${key}:${item.key}`)
      /* 有表格就必须有列，行宽要与列数一致，否则窄屏表格会错位 */
      for (const table of report.tables) {
        expect(table.columns.length).toBeGreaterThan(0)
        for (const row of table.rows) expect(row).toHaveLength(table.columns.length)
      }
    }
    expect(seen.size).toBeGreaterThan(15)
  })

  it('resources 与 action 两个类目的曲线来自不同的键，与后端的分表一致', () => {
    const resources = mockStatsReport('resources').series.map(item => item.key)
    const action = mockStatsReport('action').series.map(item => item.key)
    /* 后端把 ActionPoint / YellowCoin / PurpleCoin 从资源快照里排除，放进大世界趋势 */
    expect(resources).not.toContain('ap')
    expect(action).toEqual(expect.arrayContaining(['ap', 'asset', 'distance', 'yellow_coins', 'purple_coins']))
  })

  it('opsi / commission / ships 有指标，opsi / commission / ships / loot 有明细表', () => {
    for (const key of ['opsi', 'commission', 'ships'] as const) {
      expect(mockStatsReport(key).metrics.length, `${key} 没有指标`).toBeGreaterThan(0)
    }
    for (const key of ['opsi', 'commission', 'ships', 'loot'] as const) {
      expect(mockStatsReport(key).tables.length, `${key} 没有明细表`).toBeGreaterThan(0)
    }
  })
})
