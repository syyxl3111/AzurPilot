/**
 * 任务配置页的一个字段行。
 *
 * **写路径与 PC 完全一致**：任何改动都交给 `patchTaskConfig`，它背后是 PC 的
 * `config/EditQueue` → `config.patch`。所以「启用该功能」是真的落盘开关，
 * 不是只有 `defaultChecked` 的假控件（之前那个点了只在本地翻一下，退出重进就复位）。
 *
 * 三类提交时机，各有理由：
 *   · 开关 / 下拉 / 多选 —— 点一下就是一次完整意图，立即提交；
 *   · 文本 / 数字 / 多行 —— 本地草稿，**失焦或回车才提交**。手机上每敲一个字符
 *     发一次 WebSocket 请求既费流量也没意义，而 PC 有队列把连续输入合并掉，
 *     手机端没有那个必要；
 *   · 日期时间 —— 用原生 `datetime-local`（手机上有系统选择器），
 *     值按 PC 的 `preserveText` 语义原样提交，清空即「下次运行时间未设置」。
 *
 * 数值的中间态（空串、`-`、`1.`）由 PC 的 `prepareValue` 判定：格式不对就把错误
 * 留在字段上、**不进网络**，状态徽标会显示红点并可点重试。
 */
import { Button, Switch, TextArea } from 'antd-mobile'
import { useEffect, useRef, useState } from 'react'
import type { Value } from '../../api/types'
import type { MobileTranslator } from '../i18n'
import type { TaskConfigField } from '../data'
import { OptionPicker } from './MenuDrawer'

const MULTILINE = ['textarea', 'task_priority', 'yaml', 'storage']

function textOf(value: Value): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (Array.isArray(value)) return value.length ? value.join(', ') : ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function isNumeric(field: TaskConfigField, value: Value): boolean {
  return typeof value === 'number' || ['int', 'number', 'float'].includes(field.type)
}

/** 提交状态徽标：排队 / 提交中 / 已保存 / 失败（可点重试）。 */
function EditBadge({field, ui, onRetry}: {field: TaskConfigField; ui: MobileTranslator; onRetry: () => void}) {
  const edit = field.edit
  if (!edit) return null
  if (edit.status === 'error') {
    /* 带上后端给的原因（「数值必须大于 1」这类），只写「提交失败」用户不知道改什么 */
    return <button type="button" className="m-config-status is-error" onClick={onRetry}
      title={edit.error ?? undefined}>
      {ui('mobile.config.failed')}{edit.error ? `：${edit.error}` : ''} · {ui('common.retry')}
    </button>
  }
  const key = edit.status === 'saved' ? 'mobile.config.saved'
    : edit.status === 'saving' ? 'mobile.config.saving' : 'mobile.config.queued'
  return <span className={`m-config-status is-${edit.status}`}>{ui(key)}</span>
}

interface Props {
  field: TaskConfigField
  ui: MobileTranslator
  /** 下拉 / 多选项的显示名：走 PC 的 schema 翻译 `<Group>.<Arg>.<option>`。 */
  translateOption: (option: Value) => string
  onPatch: (path: string, value: Value) => void
  onRetry: () => void
}

export function ConfigField({field, ui, translateOption, onPatch, onRetry}: Props) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const multiline = MULTILINE.includes(field.type) || field.mode === 'yaml'
  const text = textOf(field.value)
  const [draft, setDraft] = useState(text)
  const [dirty, setDirty] = useState(false)
  const dirtyRef = useRef(dirty)
  dirtyRef.current = dirty

  /* 服务端（或队列）把值改掉时，只要本地没有未提交的草稿就跟随 —— 否则推送
     会把用户正在输入的内容冲掉。 */
  useEffect(() => { if (!dirty) setDraft(text) }, [text, dirty])

  const commit = (next: string) => {
    setDirty(false)
    if (next !== text) onPatch(field.path, next)
  }

  const header = <>
    <span className="m-config-label">
      {field.label}
      {field.readonly ? <em className="m-config-readonly">{ui('task.readonly')}</em> : null}
    </span>
    {field.help && field.help !== 'help' && field.help !== field.label
      ? <span className="m-config-help">{field.help.replace(/<[^>]*>/g, '')}</span>
      : null}
  </>

  /* 只读：类型本身就是运行期产物（stored / state / lock），或 schema 标了 display */
  if (field.readonly && field.type !== 'storage') {
    return <div className="m-config-row" data-readonly="on">
      <div className="m-config-text">{header}</div>
      <div className="m-config-control"><span className="m-config-static">{text || '—'}</span></div>
    </div>
  }

  /* 存储空间：PC 只给「清空」一个动作，这里也只用写 `{}` 来表达清空 */
  if (field.type === 'storage') {
    return <div className="m-config-row">
      <div className="m-config-text">{header}</div>
      <div className="m-config-control">
        <pre className="m-config-storage">{JSON.stringify(field.value ?? {}, null, 2)}</pre>
        <Button size="mini" color="danger" fill="outline" disabled={field.readonly}
          onClick={() => onPatch(field.path, {})}>{ui('storage.clear')}</Button>
        <EditBadge field={field} ui={ui} onRetry={onRetry}/>
      </div>
    </div>
  }

  if (field.type === 'checkbox' || field.type === 'bool' || typeof field.value === 'boolean') {
    return <div className="m-config-row">
      <div className="m-config-text">{header}</div>
      <div className="m-config-control m-config-switch">
        <Switch checked={Boolean(field.value)} onChange={next => onPatch(field.path, next)}
          aria-label={field.label}/>
        <EditBadge field={field} ui={ui} onRetry={onRetry}/>
      </div>
    </div>
  }

  if (field.options?.length && field.type !== 'multiselect') {
    const selected = field.options.find(option => option === field.value)
    return <div className="m-config-row">
      <div className="m-config-text">{header}</div>
      <div className="m-config-control">
        <button type="button" className="m-config-pick" onClick={() => setPickerOpen(true)}
          aria-label={`${field.label}：${ui('common.select')}`}>
          <span>{selected === undefined ? text || ui('common.notSet') : translateOption(selected)}</span>
          <span aria-hidden="true">›</span>
        </button>
        <OptionPicker visible={pickerOpen} title={field.label}
          value={JSON.stringify(field.value ?? null)}
          options={field.options.map(option => ({value: JSON.stringify(option), label: translateOption(option)}))}
          onPick={next => {
            setPickerOpen(false)
            onPatch(field.path, JSON.parse(next) as Value)
          }}
          onClose={() => setPickerOpen(false)}/>
        <EditBadge field={field} ui={ui} onRetry={onRetry}/>
      </div>
    </div>
  }

  if (field.type === 'multiselect') {
    const selected = Array.isArray(field.value) ? field.value : []
    return <div className="m-config-row">
      <div className="m-config-text">{header}</div>
      <div className="m-config-control m-config-chips">
        {field.options?.map(option => {
          const on = selected.includes(option as never)
          return <button type="button" key={JSON.stringify(option)} className={`m-chip ${on ? 'is-on' : ''}`}
            aria-pressed={on}
            onClick={() => onPatch(field.path, (on
              ? selected.filter(item => item !== option)
              : [...selected, option]) as Value)}>{translateOption(option)}</button>
        })}
        <EditBadge field={field} ui={ui} onRetry={onRetry}/>
      </div>
    </div>
  }

  if (field.type === 'datetime' && !field.readonly) {
    /* 日期时间**单独占一行**：原生 `datetime-local` 在 55% 宽的控制区里会被切掉秒
       （真机上显示成 `2026/09/17 04:1`），而这种值恰恰是要看准秒的。 */
    return <div className="m-config-row is-stacked">
      <div className="m-config-text">{header}</div>
      <div className="m-config-control">
        <input className="m-config-input" type="datetime-local" step={1} aria-label={field.label}
          value={text.replace(' ', 'T').slice(0, 19)}
          onChange={event => onPatch(field.path, event.target.value.replace('T', ' '))}/>
        <EditBadge field={field} ui={ui} onRetry={onRetry}/>
      </div>
    </div>
  }

  return <div className={`m-config-row ${multiline ? 'is-multiline' : ''}`}>
    <div className="m-config-text">{header}</div>
    <div className="m-config-control">
      {multiline
        ? <TextArea className="m-config-area" aria-label={field.label} value={draft} rows={4}
          onChange={next => { setDirty(true); setDraft(next) }}
          onBlur={() => commit(draft)}/>
        : <input className="m-config-input" aria-label={field.label}
          inputMode={isNumeric(field, field.value) ? 'decimal' : undefined}
          type={field.type === 'password' ? 'password' : 'text'}
          autoComplete={field.type === 'password' ? 'new-password' : 'off'}
          value={draft}
          onChange={event => { setDirty(true); setDraft(event.target.value) }}
          onBlur={() => commit(draft)}
          onKeyDown={event => { if (event.key === 'Enter') commit(draft) }}/>}
      <EditBadge field={field} ui={ui} onRetry={onRetry}/>
    </div>
  </div>
}
