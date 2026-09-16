/**
 * 表单控件分区 —— 对齐 PC `DevControls.tsx` 的同一块（14 项）。
 *
 * 手机端不用 PC 的 `FieldInput`（它依赖 PC 的 AppProvider），而是用 PC 的
 * **类名与结构**：`.field-row` / `.field-label` / `.field-control`，控件本身用
 * 原生 input 或 antd-mobile 里 PC 没有对应物的那几个（开关、多选、日期）。
 * 外观由 PC 的 `forms.css` + `components.css` 提供。
 */
import { lazy, Suspense, useState } from 'react'
import { CircleAlert, Search } from 'lucide-react'
import type { MobileTranslator } from '../i18n'

/* CodeMirror 按需加载，不进手机端主包 */
const YamlField = lazy(() => import('../components/YamlField').then(module => ({default: module.YamlField})))

function DevField({id, label, help, multiline = false, children}: {
  id: string
  label: string
  help?: string
  multiline?: boolean
  children: React.ReactNode
}) {
  return <div className={`field-row ${multiline ? 'field-row-multiline' : ''}`}>
    <div className="field-label"><label htmlFor={id}>{label}</label>{help && <p>{help}</p>}</div>
    <div className="field-control">{children}</div>
  </div>
}

export function FormSection({ui}: {ui: MobileTranslator}) {
  const [text, setText] = useState('AzurPilot')
  const [number, setNumber] = useState(25548)
  const [password, setPassword] = useState('developer')
  const [select, setSelect] = useState('Auto')
  const [dateTime, setDateTime] = useState('2026-09-15 09:00:00')
  const [month, setMonth] = useState('2026-09')
  const [toggle, setToggle] = useState(true)
  const [multi, setMulti] = useState<string[]>(['Alas', 'Opsi'])
  const [textarea, setTextarea] = useState(() => ui('developer.textareaSample'))
  const [yaml, setYaml] = useState('Scheduler:\n  Enable: true\n  SuccessInterval: 30')

  return <>
    <DevField id="dev-text" label={ui('developer.textInput')} help={ui('developer.textInputHelp')}>
      <input id="dev-text" value={text} onChange={event => setText(event.target.value)} />
    </DevField>

    <DevField id="dev-number" label={ui('developer.numberInput')} help={ui('developer.numberInputHelp')}>
      <input id="dev-number" type="number" inputMode="decimal" value={number}
        onChange={event => setNumber(Number(event.target.value))} />
    </DevField>

    <DevField id="dev-password" label={ui('developer.passwordInput')}>
      <input id="dev-password" type="password" value={password}
        onChange={event => setPassword(event.target.value)} />
    </DevField>

    <DevField id="dev-select" label={ui('developer.selectInput')} help={ui('developer.selectInputHelp')}>
      <select id="dev-select" value={select} onChange={event => setSelect(event.target.value)}>
        {['Auto', 'ADB', 'Nemulator'].map(option => <option key={option} value={option}>{option}</option>)}
      </select>
    </DevField>

    <DevField id="dev-datetime" label={ui('developer.dateTime')}>
      <input id="dev-datetime" type="datetime-local" value={dateTime.replace(' ', 'T')}
        onChange={event => setDateTime(event.target.value.replace('T', ' '))} />
    </DevField>

    <DevField id="dev-month" label={ui('developer.month')}>
      <input id="dev-month" type="month" value={month} onChange={event => setMonth(event.target.value)} />
    </DevField>

    <DevField id="dev-toggle" label={ui('developer.toggle')} help={ui('developer.toggleHelp')}>
      <div className="dev-inline-controls">
        <label className="m-dev-switch">
          <input type="checkbox" checked={toggle} onChange={event => setToggle(event.target.checked)} />
          <span>{ui('developer.toggle')}</span>
        </label>
        <label className="m-dev-switch">
          <input type="checkbox" checked={false} onChange={() => undefined} />
          <span>{ui('developer.toggleOff')}</span>
        </label>
        <label className="m-dev-switch">
          <input type="checkbox" checked disabled onChange={() => undefined} />
          <span>{ui('developer.toggleDisabled')}</span>
        </label>
      </div>
    </DevField>

    <DevField id="dev-multi" label={ui('developer.multiSelect')} help={ui('developer.multiSelectHelp')}>
      <div className="dev-inline-controls">
        {['Alas', 'Opsi', 'Commission', 'Event'].map(option => <label className="m-dev-switch" key={option}>
          <input type="checkbox" checked={multi.includes(option)} onChange={event => {
            setMulti(current => event.target.checked
              ? [...current, option]
              : current.filter(item => item !== option))
          }} />
          <span>{option}</span>
        </label>)}
      </div>
    </DevField>

    <DevField id="dev-disabled" label={ui('developer.disabledInput')}>
      <input id="dev-disabled" value={ui('developer.disabledValue')} disabled readOnly />
    </DevField>

    <DevField id="dev-invalid" label={ui('developer.invalidInput')} help={ui('developer.invalidInputHelp')}>
      <input id="dev-invalid" value="invalid-value" aria-invalid readOnly />
      <div id="dev-invalid-status" className="edit-status edit-error" role="alert">
        <CircleAlert size={14} aria-hidden="true" />{ui('developer.invalidInputMessage')}
      </div>
    </DevField>

    <DevField id="dev-search" label={ui('developer.iconInput')}>
      <div className="input-icon">
        <Search size={15} />
        <input id="dev-search" aria-label={ui('developer.iconInput')}
          placeholder={ui('developer.searchPlaceholder')} />
      </div>
    </DevField>

    <DevField id="dev-textarea" label={ui('developer.textarea')} multiline>
      <textarea id="dev-textarea" rows={3} value={textarea}
        onChange={event => setTextarea(event.target.value)} />
    </DevField>

    <DevField id="dev-yaml" label={ui('developer.yamlEditor')} help={ui('developer.yamlHelp')} multiline>
      {/* 与 PC 一样按需加载，CodeMirror 不会进主包 */}
      <Suspense fallback={<div className="loading" role="status">{ui('common.loading')}</div>}>
        <YamlField id="dev-yaml" value={yaml} onChange={setYaml}
          heading={ui('field.yaml')} ariaLabel={ui('developer.yamlEditor')} />
      </Suspense>
    </DevField>
  </>
}
