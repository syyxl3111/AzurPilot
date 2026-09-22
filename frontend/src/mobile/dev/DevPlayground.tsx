/**
 * 组件测试页：手机端的「开发者 · 控件预览」。
 *
 * **分区、标题、文案逐项对齐 PC 的 `pages/DevControls.tsx`**，文案键全部复用 PC 的
 * `developer.*`（5 种语言现成，手机端 translator 本就会回落到 PC 词表）。
 * 分区清单在 `sections.ts`，由 `sections.test.ts` 断言与 PC 一致。
 *
 * 与 PC 的三处差异，都是能力边界决定的：
 *   1. PC 的 `ui.tsx` 组件（Modal / Empty / ErrorBox / Loading / StatusBadge）硬绑
 *      PC 的 AppProvider，无法 import；这里用**同样的类名与同样的标记**渲染等价
 *      结构，外观由 PC 的 styles 提供，所以看起来是一致的。
 *   2. 视觉效果实验室用原生 `backdrop-filter` 而不是 `liquid-glass-react`
 *      （那个库 174 kB，为一个开发者页面带进手机端不划算）。
 *   3. 数据表格在手机窄屏会横向撑破，改用 PC 令牌画的卡片行。
 *
 * 整页按需加载，所以它自己的样式（PC 的 dev.css + 本目录的 dev.css）与 CodeMirror
 * 都切进独立 chunk，手机端主包不受影响。
 */
import { useState } from 'react'
import {
  ArrowRight, Bell, ChevronRight, CircleAlert, Code2, Database, Image, Layers3, LoaderCircle,
  Plus, Server, Settings2, Terminal, Trash2, X,
} from 'lucide-react'
import '../../styles/dev.css'
import './dev.css'
import { DEV_RADII, DEV_SECTIONS } from './sections'
import { EffectLab } from './EffectLab'
import { FormSection } from './FormSection'
import { TokenSection } from './TokenSection'
import { SegmentedControl } from '../../components/SegmentedControl'
import type { MobileTranslator } from '../i18n'
import type { Status } from '../../api/types'

const STATUS_ORDER: Status[] = ['running', 'stopped', 'error', 'updating']
const STATUS_LABEL: Record<Status, string> = {
  running: 'status.running',
  stopped: 'status.stopped',
  error: 'status.error',
  updating: 'status.updating',
}

interface Props {
  ui: MobileTranslator
  /** 退出开发者模式：回首页并写回 azurpilot.dev-mode */
  onExit: () => void
  /** 打开模态预览 */
  onModal: () => void
}

function Panel({title, children, note}: {title: string; note?: string; children: React.ReactNode}) {
  return <section className="panel config-group">
    <div className="panel-heading">
      <div><h2 aria-label={title} data-text={title}>{title}</h2></div>
      {note ? <span className="small-label">{note}</span> : null}
    </div>
    {children}
  </section>
}

export function DevPlayground({ui, onExit, onModal}: Props) {
  const [segment, setSegment] = useState<'logs' | 'preview'>('logs')
  const [demoTab, setDemoTab] = useState('resources')
  const sectionTitle = (id: string) => {
    const section = DEV_SECTIONS.find(item => item.id === id)!
    return ui(section.labelKey)
  }

  return <>
    {/* 0. 简介条（PC 的 dev-intro） */}
    <section className="panel dev-intro m-dev-intro">
      <div>
        <Code2 size={20} />
        <div>
          <strong>{ui('developer.playground')}</strong>
          <p>{ui('developer.playgroundHint')}</p>
        </div>
      </div>
      <div className="m-dev-intro-actions">
        <span className="small-label">{ui('developer.only')}</span>
        <button type="button" className="button secondary" onClick={onExit}>
          <X size={15} />{ui('developer.exit')}
        </button>
      </div>
    </section>

    {/* 1. 视觉效果实验室 */}
    <Panel title={sectionTitle('visualLab')} note={ui('developer.liveTuning')}>
      <EffectLab ui={ui} />
    </Panel>

    {/* 2. 玻璃、表面与层级 */}
    <Panel title={sectionTitle('layers')}>
      <div className="dev-surface-grid m-dev-grid">
        <div className="dev-surface-sample dev-surface-plain">
          <span>{ui('developer.tokenSurface')}</span><strong>{ui('developer.surfacePlain')}</strong><small>var(--surface)</small>
        </div>
        <div className="dev-surface-sample dev-surface-muted">
          <span>{ui('developer.tokenMuted')}</span><strong>{ui('developer.surfaceMuted')}</strong><small>var(--surface-muted)</small>
        </div>
        <div className="dev-surface-sample dev-surface-accent">
          <span>{ui('developer.tokenAccent')}</span><strong>{ui('developer.surfaceAccent')}</strong><small>var(--accent-soft)</small>
        </div>
        {/* 玻璃样本用 PC 的 .glass-material（纯 CSS），与页眉同一层 */}
        <div className="dev-surface-sample dev-surface-glass">
          <div className="glass-material" aria-hidden="true" />
          <span>{ui('developer.backdropGlass')}</span><strong>{ui('developer.surfaceGlass')}</strong><small>GlassMaterial</small>
        </div>
      </div>
      <div className="dev-shadow-grid m-dev-grid">
        {([[ui('developer.shadowNone'), 'none'],
          [ui('developer.shadowLight'), '0 4px 14px #00000010'],
          [ui('developer.shadowPanel'), 'var(--glass-shadow)'],
          [ui('developer.shadowFloating'), '0 18px 56px #0003'],
          [ui('developer.shadowModal'), '0 24px 100px #0003']] as const).map(([label, value]) =>
          <div key={label} className="dev-shadow-sample" style={{boxShadow: value}}>
            <strong>{label}</strong><code>{value}</code>
          </div>)}
      </div>
      <div className="dev-radius-grid m-dev-grid">
        {DEV_RADII.map(value => <div key={value}>
          <span style={{borderRadius: `${value}px`}} />
          <small>{value === 999 ? ui('developer.pill') : `${value}px`}</small>
        </div>)}
      </div>
    </Panel>

    {/* 3. 颜色与设计 Token（含现场对比度自查） */}
    <Panel title={sectionTitle('colorsTokens')}>
      <TokenSection ui={ui} />
    </Panel>

    {/* 4. 文字层级与内容样式 */}
    <Panel title={sectionTitle('typography')}>
      <div className="dev-type-grid m-dev-grid">
        <div><span className="small-label">{ui('developer.typePageTitle')}</span><h1>{ui('developer.samplePageTitle')}</h1></div>
        <div><span className="small-label">{ui('developer.typeSectionHeading')}</span><h2>{ui('developer.sampleSectionHeading')}</h2></div>
        <div><span className="small-label">{ui('developer.typeCardHeading')}</span><h3>{ui('developer.sampleCardHeading')}</h3></div>
        <div><span className="small-label">{ui('developer.typeBody')}</span><p>{ui('developer.sampleBody')}</p></div>
        <div><span className="small-label">{ui('developer.typeMuted')}</span><p className="muted">{ui('developer.sampleMuted')}</p></div>
        <div><span className="small-label">{ui('developer.typeCode')}</span><code>Scheduler.Enable = true</code></div>
        <div><span className="small-label">{ui('developer.numberLabel')}</span><strong className="dev-numeric">12,345.67 / 99.8%</strong></div>
        <div><span className="small-label">{ui('developer.ellipsisLabel')}</span><div className="dev-ellipsis">{ui('developer.ellipsisSample')}</div></div>
      </div>
    </Panel>

    {/* 5. 按钮与操作 */}
    <Panel title={sectionTitle('buttons')}>
      <div className="dev-control-block m-dev-block">
        <div className="dev-control-label"><strong>{ui('developer.buttonStyles')}</strong><span>{ui('developer.buttonStylesHint')}</span></div>
        <div className="dev-button-row">
          <button type="button" className="button">{ui('developer.buttonDefault')}</button>
          <button type="button" className="button primary">{ui('developer.buttonPrimary')}</button>
          <button type="button" className="button secondary">{ui('developer.buttonSecondary')}</button>
          <button type="button" className="button danger"><Trash2 size={15} />{ui('developer.buttonDanger')}</button>
          <button type="button" className="button danger subtle">{ui('developer.buttonDangerSubtle')}</button>
          <button type="button" className="button primary" disabled>{ui('developer.buttonDisabled')}</button>
        </div>
      </div>
      <div className="dev-control-block m-dev-block">
        <div className="dev-control-label"><strong>{ui('developer.lightActions')}</strong><span>{ui('developer.lightActionsHint')}</span></div>
        <div className="dev-button-row">
          <button type="button" className="icon-button" aria-label={ui('nav.settings')}><Settings2 size={18} /></button>
          <button type="button" className="icon-button" aria-label={ui('common.close')}><X size={18} /></button>
          <button type="button" className="text-button">{ui('developer.textButton')}</button>
          <button type="button" className="button secondary" onClick={onModal}>{ui('developer.openModal')}</button>
        </div>
      </div>
    </Panel>

    {/* 6. 表单控件 */}
    <Panel title={sectionTitle('formControls')}>
      <FormSection ui={ui} />
    </Panel>

    {/* 7. 选择器与状态 */}
    <Panel title={sectionTitle('selectorsStatus')}>
      <div className="dev-control-block m-dev-block">
        <div className="dev-control-label"><strong>{ui('developer.segmented')}</strong><span>{ui('developer.segmentedHint')}</span></div>
        <SegmentedControl label={ui('developer.segmentedLabel')} value={segment} onChange={setSegment} options={[
          {value: 'logs', label: <><Terminal size={15} />{ui('monitor.logs')}</>},
          {value: 'preview', label: <><Image size={15} />{ui('monitor.preview')}</>},
        ]} />
      </div>
      <div className="dev-control-block m-dev-block">
        <div className="dev-control-label"><strong>{ui('developer.statusBadges')}</strong><span>{ui('developer.statusBadgesHint')}</span></div>
        <div className="dev-button-row">
          {STATUS_ORDER.map(status => <span key={status} className={`status ${status}`}>
            <i />{ui(STATUS_LABEL[status] as 'status.running')}
          </span>)}
          <span className="count-badge">12</span>
          <span className="live-label"><i />{ui('developer.live')}</span>
          <span className="update-notice"><Bell size={13} />{ui('nav.newVersion')}</span>
        </div>
      </div>
      <div className="dev-control-block m-dev-block">
        <div className="dev-control-label"><strong>{ui('developer.statsTabs')}</strong><span>{ui('developer.statsTabsHint')}</span></div>
        <SegmentedControl label={ui('developer.statsTabsLabel')} value={demoTab} onChange={setDemoTab} options={[
          {value: 'resources', label: ui('developer.tabResources')},
          {value: 'loot', label: ui('developer.tabLoot')},
          {value: 'action', label: ui('developer.tabAction')},
          {value: 'commission', label: ui('developer.tabCommission')},
        ]} />
      </div>
    </Panel>

    {/* 8. 导航、卡片与层级（换成手机端的对应物：Tab 栏 / 抽屉 / 实例卡 / 资源卡 / 指标卡） */}
    <Panel title={sectionTitle('layout')}>
      <div className="m-dev-layout">
        <div className="m-dev-cell">
          <span className="small-label">{ui('nav.primary')}</span>
          <nav className="primary-nav">
            <a href="#dev-nav" onClick={event => event.preventDefault()}><Server size={18} />{ui('developer.navNormal')}</a>
            <a href="#dev-nav" className="active" onClick={event => event.preventDefault()}><Database size={18} />{ui('developer.navCurrent')}<span className="nav-pill">DEV</span></a>
            <a href="#dev-nav" onClick={event => event.preventDefault()}><Settings2 size={18} />{ui('developer.navHover')}</a>
          </nav>
          <div className="task-group-button expanded">
            <Layers3 size={18} className="task-group-icon" />
            <span className="task-group-title">{ui('developer.taskGroup')}</span>
            <ChevronRight size={13} className="task-group-arrow" />
          </div>
          <div className="task-submenu-list dev-submenu-list">
            <a className="task-submenu-item active" href="#dev-sub" onClick={event => event.preventDefault()}><span className="task-submenu-dot" /><span className="task-submenu-item-text">{ui('developer.submenuCurrent')}</span></a>
            <a className="task-submenu-item" href="#dev-sub" onClick={event => event.preventDefault()}><span className="task-submenu-dot" /><span className="task-submenu-item-text">{ui('developer.submenuNormal')}</span></a>
          </div>
        </div>
        <div className="m-dev-cell">
          <span className="small-label">{ui('developer.instanceCard')}</span>
          <div className="instance-card panel">
            <div className="instance-card-heading">
              <span className="home-instance-icon"><Server size={22} /></span>
              <span className="status running"><i />{ui('status.running')}</span>
            </div>
            <h3>dev-instance</h3>
            <div className="instance-device"><span>ADB</span><span>127.0.0.1:5555</span></div>
            <div className="instance-card-footer"><span>{ui('developer.instanceRunning')}</span><ArrowRight size={17} /></div>
          </div>
        </div>
        <div className="m-dev-cell">
          <span className="small-label">{ui('developer.metricCards')}</span>
          <div className="summary-metrics stat-metrics">
            <section><span>{ui('resource.Coin')}</span><strong>52,840<small>/ 600,000</small></strong></section>
            <section><span>{ui('resource.Oil')}</span><strong>14,320<small>/ 25,000</small></strong></section>
            <section><span>{ui('developer.runCount')}</span><strong>128<small>{ui('developer.times')}</small></strong></section>
          </div>
        </div>
      </div>
    </Panel>

    {/* 9. 数据、表格与滚动区域 */}
    <Panel title={sectionTitle('dataTables')}>
      {/* PC 用真表格；360dp 上会横向撑破，这里改成 PC 令牌画的卡片行 */}
      <div className="m-table-card m-dev-cardtable">
        <div className="m-table-row m-table-row-head">
          <span className="m-table-row-label">{ui('stats.time')}</span>
          <span className="m-table-row-label">{ui('developer.tableTask')}</span>
          <span className="m-table-row-value">{ui('developer.tableDuration')}</span>
        </div>
        {[['09:18:02', ui('developer.demoMainline'), '01:42', 'running', ui('developer.demoCompleted')],
          ['09:15:43', ui('developer.demoResearch'), '00:18', 'updating', ui('developer.demoSync')],
          ['09:12:10', ui('developer.demoCommission'), '00:06', 'stopped', ui('developer.demoIdle')]].map(row =>
          <div className="m-table-row" key={row[0]}>
            <span className="m-table-row-label">{row[0]}</span>
            <span className="m-table-row-label">
              {row[1]} <span className={`status ${row[3]}`}><i />{row[4]}</span>
            </span>
            <span className="m-table-row-value">{row[2]}</span>
          </div>)}
      </div>
      <div className="dev-scroll-sample m-dev-scroll">
        <div>{Array.from({length: 12}, (_, index) => <p key={index}>
          <code>{String(index + 1).padStart(2, '0')}</code> {ui('developer.scrollSample')}
        </p>)}</div>
      </div>
    </Panel>

    {/* 10. 反馈状态 */}
    <Panel title={sectionTitle('feedback')}>
      <div className="dev-feedback-grid m-dev-grid">
        <div>
          <span className="small-label">{ui('developer.errorLabel')}</span>
          <div role="alert" className="error-box">
            <CircleAlert size={18} /><span>{ui('developer.errorMessage')}</span>
            <button type="button">{ui('common.retry')}</button>
          </div>
        </div>
        <div>
          <span className="small-label">{ui('developer.loadingLabel')}</span>
          <div className="dev-state-box">
            <div className="loading" role="status"><LoaderCircle className="spin" size={22} />{ui('common.loading')}</div>
          </div>
        </div>
        <div>
          <span className="small-label">{ui('developer.emptyLabel')}</span>
          <div className="dev-state-box">
            <div className="empty">
              <CircleAlert size={34} />
              <strong>{ui('developer.emptyTitle')}</strong>
              <div>{ui('developer.emptyHint')}</div>
            </div>
          </div>
        </div>
      </div>
    </Panel>

    {/* 与 PC 一样：末尾补一个「新增」入口的占位，说明这里还能放什么 */}
    <p className="muted m-dev-foot"><Plus size={14} />{ui('developer.only')}</p>
  </>
}
