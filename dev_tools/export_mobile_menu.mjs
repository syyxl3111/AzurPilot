/**
 * 生成手机端评审入口（示意图）用的夹具。
 *
 * 为什么要有这个脚本：示意图原来手写了一份分组（常规 / 出击 / 活动…）与一份任务配置，
 * 与真机的 menu.json / args.json 完全是两套 —— 评审看到的和真机跑的不是一回事，
 * 而且「手写夹具」天生会漏掉真实字段（比如 `display: hide` 的内部字段），
 * 于是评审时根本发现不了真机上会多出四行内部配置。
 * 这里把**真实来源**摊平成前端夹具，两边从此同源：
 *
 *   结构（分组与任务列表） ← module/config/argument/menu.json
 *   任务配置的字段定义     ← module/config/argument/args.json
 *   中文标签 / 说明        ← module/config/i18n/zh-CN.json 的 Menu.* / Task.* / Group.*
 *
 * 用法（在 frontend/ 下运行）：
 *   node ../dev_tools/export_mobile_menu.mjs
 *
 * 改过 menu.json / argument.yaml 并重新生成过 i18n 之后，重跑一次即可。
 * menuFixture.ts 顶部的注释也写了这一点。
 */
import { readFileSync, writeFileSync } from 'node:fs'

const MENU = '../module/config/argument/menu.json'
const ARGS = '../module/config/argument/args.json'
const I18N = '../module/config/i18n/zh-CN.json'
const OUT = 'src/mobile/mockup/menuFixture.ts'

/**
 * 配置夹具挑哪几个任务。
 *
 * 不生成全部 96 个：args.json 有 401 KB，全量搬进前端夹具会让示意图入口的包
 * 膨胀十几倍，而评审真正需要的是**几种典型形状**都有人演：
 *   · Alas      —— 第一个分组的第一个任务，点开任务页顺手就会进它；
 *   · Commission—— 字段最全（开关 / 下拉 / 数字 / 多行 / 日期 / 存储 都有）；
 *   · Restart   —— `Scheduler.Enable` 是 `type: state` 的运行期字段，只有一个取值，
 *                  用来演「只读」那一支；
 *   · FleetScan —— `page: tool` 的工具任务，没有 Scheduler.Enable，只能手动运行。
 */
const FIXTURE_TASKS = ['Alas', 'Commission', 'Restart', 'FleetScan']

const menu = JSON.parse(readFileSync(MENU, 'utf8'))
const args = JSON.parse(readFileSync(ARGS, 'utf8'))
const i18n = JSON.parse(readFileSync(I18N, 'utf8'))

const groups = Object.entries(menu)
const labels = {}
for (const [key] of groups) {
  const value = i18n.Menu?.[key]?.name
  if (typeof value !== 'string') throw new Error(`i18n 里缺少 Menu.${key}.name`)
  labels[key] = value
}

const tasks = {}
const missing = []
for (const [, group] of groups) {
  for (const task of group.tasks) {
    const value = i18n.Task?.[task]?.name
    if (typeof value === 'string') tasks[task] = value
    else missing.push(task)
  }
}

/** 夹具里只留渲染要用的字段，`Field` 的其余键（option 的 i18n 等）保留原样。 */
const FIELD_KEYS = ['type', 'value', 'mode', 'display', 'option', 'validate', 'min', 'max']

function pick(field) {
  return Object.fromEntries(FIELD_KEYS.filter(key => field[key] !== undefined).map(key => [key, field[key]]))
}

/** 字段定义 + 中文标签说明；`values` 用模板默认值，`schema` 用类型定义。 */
function buildFixture(task) {
  if (!args[task]) throw new Error(`args.json 里没有 ${task}`)
  const taskGroups = Object.entries(args[task]).filter(([group]) => !group.startsWith('_'))
  return {
    task,
    label: i18n.Task?.[task]?.name ?? task,
    groupLabels: Object.fromEntries(taskGroups.map(([group]) => [group, i18n[group]?._info?.name ?? group])),
    args: Object.fromEntries(taskGroups.map(([group, fields]) => [
      group, Object.fromEntries(Object.entries(fields).map(([arg, field]) => [arg, pick(field)])),
    ])),
    values: Object.fromEntries(taskGroups.map(([group, fields]) => [
      group, Object.fromEntries(Object.entries(fields).map(([arg, field]) => [arg, field.value ?? null])),
    ])),
    translations: Object.fromEntries(taskGroups.flatMap(([group, fields]) => Object.entries(fields).flatMap(([arg, field]) => [
      [`${group}.${arg}.name`, i18n[group]?.[arg]?.name ?? arg],
      [`${group}.${arg}.help`, i18n[group]?.[arg]?.help ?? ''],
      /* 下拉项的显示名走 PC 的同一套键 `<Group>.<Arg>.<option>`，漏了它
         选项就会回显成 cube / oil 这种原始值，评审时看不出这里本该是中文。 */
      ...(Array.isArray(field.option) ? field.option.map(option => [
        `${group}.${arg}.${option}`, i18n[group]?.[arg]?.[option] ?? String(option),
      ]) : []),
    ]))),
  }
}

const fixtures = Object.fromEntries(FIXTURE_TASKS.map(task => [task, buildFixture(task)]))

const out = `/**
 * 手机端评审入口的夹具 —— **由 ../dev_tools/export_mobile_menu.mjs 生成，请勿手动编辑**。
 *
 * 结构（分组 / 任务列表 / page）取自 module/config/argument/menu.json，
 * 任务配置的字段定义取自 module/config/argument/args.json，
 * 中文标签说明取自 module/config/i18n/zh-CN.json。
 * 所以评审入口（示意图）与真机是同一份数据形状，不会各写一套再慢慢漂移。
 *
 * 重新生成：在 frontend/ 下运行 node ../dev_tools/export_mobile_menu.mjs
 */
export const MENU_GROUPS: Array<{key: string; name: string; page: string; tasks: string[]}> = ${JSON.stringify(groups.map(([key, group]) => ({key, name: labels[key], page: group.page, tasks: group.tasks})), null, 2)}

export const MENU_TASK_LABELS: Record<string, string> = ${JSON.stringify(tasks, null, 2)}

/**
 * 配置页夹具：若⼲个真实任务的字段定义 + 默认值 + 中文说明。
 *
 * **不是全部 96 个任务**：args.json 有 401 KB，全量搬进前端会让示意图入口的包
 * 膨胀十几倍。评审需要的是「几种典型形状都有人演」，具体挑选理由见下面这个列表。
 */
export type TaskConfigFixture = {
  task: string
  label: string
  groupLabels: Record<string, string>
  args: Record<string, Record<string, unknown>>
  values: Record<string, Record<string, unknown>>
  translations: Record<string, string>
}

export const TASK_CONFIG_FIXTURES: Record<string, TaskConfigFixture> = ${JSON.stringify(fixtures, null, 2)}
`

writeFileSync(OUT, out)
console.log(`分组 ${groups.length} 个，任务 ${Object.keys(tasks).length} 个`)
for (const [task, fixture] of Object.entries(fixtures)) {
  const fields = Object.values(fixture.args).reduce((sum, group) => sum + Object.keys(group).length, 0)
  console.log(`配置夹具：${task}（${Object.keys(fixture.args).length} 组 / ${fields} 个字段）`)
}
if (missing.length) console.log(`未翻译（沿用键名）：${missing.join(', ')}`)
console.log(`已写出 ${OUT}`)
