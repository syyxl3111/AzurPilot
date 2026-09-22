/**
 * 任务配置的摊平逻辑（**正式入口与评审入口共用**）。
 *
 * 从 `schema.args[task]` + `config.values[task]` 生成配置页要的分组字段，
 * 可见性与只读判定**直接复用 PC 的实现**（`pages/configVisibility.ts` +
 * `pages/TaskConfig.tsx` 的 `readonly` 表达式），不在这里另立一套规则：
 *
 *   · `display: hide` / `_info` / 空 storage 不出现（`isFieldVisible`）；
 *   · `display: disabled|readonly|display` 与 `stored|state|lock` 类型只读。
 *
 * 单独成文件是为了让示意图入口也能调用同一个函数 —— 否则评审入口的配置页
 * 只能手写夹具，慢慢就会和真机长得不一样。
 */
import type { Config, Field, Schema, Value } from '../api/types'
import type { Edit } from '../config/EditQueue'
import { isFieldVisible } from '../pages/configVisibility'
import type { ConfigEdit, TaskConfigGroup } from './data'

/** 从 `Task.Group.Argument` 反查 schema 字段（数值校验、选项、类型都要用它）。 */
export function lookupField(schema: Schema | undefined, path: string): Field | undefined {
  if (!schema) return undefined
  const parts = path.split('.')
  if (parts.length < 3) return undefined
  return schema.args[parts[0]]?.[parts[1]]?.[parts.slice(2).join('.')]
}

/** 配置路径的第三段之后仍可能是参数名的一部分，所以按前两段切、其余全部归参数。 */
export function configPath(task: string, group: string, arg: string): string {
  return `${task}.${group}.${arg}`
}

/**
 * 摊平成配置页的分组字段。
 *
 * `edits` 是 PC `EditQueue` 的快照：**本地未确认的输入优先于服务端值**，
 * 否则用户刚打完字就会被一次推送冲回旧值。
 */
export function buildTaskConfig(
  schema: Schema | undefined, config: Config | null, task: string | null,
  t: (key: string) => string, edits: Record<string, Edit>,
): TaskConfigGroup[] {
  if (!schema || !task) return []
  const groups = schema.args[task] as Record<string, Record<string, Field>> | undefined
  if (!groups) return []
  return Object.entries(groups).map(([group, fields]) => ({
    key: group,
    title: t(`${group}._info.name`),
    fields: Object.entries(fields)
      .filter(([arg, field]) => {
        const edit = edits[configPath(task, group, arg)]
        const value = edit ? edit.value : config?.values?.[task]?.[group]?.[arg] ?? field.value
        return isFieldVisible(arg, field, value)
      })
      .map(([arg, field]) => {
        const path = configPath(task, group, arg)
        const edit = edits[path]
        /* 只读判定与 PC 的 TaskConfig 一致；`storage` 是例外 —— PC 允许「清空」，
           所以这里也放行编辑（写 `{}` 即清空）。 */
        const readonly = ['disabled', 'readonly', 'display'].includes(field.display ?? '')
          || ['stored', 'state', 'lock'].includes(field.type)
        const stored = config?.values?.[task]?.[group]?.[arg] ?? field.value
        return {
          path,
          label: t(`${group}.${arg}.name`),
          help: t(`${group}.${arg}.help`),
          type: field.type,
          mode: field.mode,
          options: field.option,
          value: (edit ? edit.value : stored) as Value,
          readonly,
          edit: edit ? ({status: edit.status, error: edit.error} as ConfigEdit) : undefined,
        }
      }),
  }))
}
