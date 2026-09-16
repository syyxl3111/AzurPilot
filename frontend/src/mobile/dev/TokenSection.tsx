/**
 * 颜色与设计 Token 分区 —— 对齐 PC `DevControls.tsx` 的同一块。
 *
 * 与 PC 的差别只有一处：**PC 列的是 PC 的令牌名，手机端列的也是同一批令牌名** ——
 * 因为手机端现在真的加载了 PC 的 `tokens.css`，`--text`/`--accent`/`--glass-tint`
 * 这些变量在手机上同样存在。所以两边看到的是同一套颜色。
 *
 * 额外保留手机端特有的**现场对比度自查**：逐项算出「文字色 vs 它真正所在的背景」，
 * 并断言不低于 4.5:1。页眉与 Tab 栏是半透明玻璃，所以背景先做合成再比。
 */
import { DEV_COLOR_TOKENS } from './sections'
import {
  MIN_TEXT_CONTRAST, STATUS_COLORS, contrastRatio, palettes, readabilityIssues, statusIssues,
} from '../theme'
import type { MobileTranslator } from '../i18n'

const STATUS_ORDER = ['running', 'stopped', 'error', 'updating']

function ContrastAudit({theme, ui}: {theme: 'light' | 'dark'; ui: MobileTranslator}) {
  const palette = palettes[theme]
  /* 每一项都对照它真正所在的背景：玻璃条上的文字对合成后的玻璃色，
     卡片里的文字对 --surface。 */
  const rows: Array<[string, string, string]> = [
    ['text', palette.text, palette.barBg],
    ['muted', palette.muted, palette.barBg],
    ['accent', palette.accent, palette.barBg],
    ['onSurface', palette.onSurface, palette.surface],
    ['onSurfaceMuted', palette.onSurfaceMuted, palette.surface],
  ]
  const issues = [...readabilityIssues(palette), ...statusIssues(theme)]
  return <div className="panel m-dev-audit">
    <div className="panel-heading">
      <h2>{theme === 'light' ? ui('mobile.appearance.light') : ui('mobile.appearance.dark')} · {palette.barBg}</h2>
    </div>
    <table className="m-dev-audit-table">
      <tbody>
        {rows.map(([name, foreground, background]) => {
          const ratio = contrastRatio(foreground, background)
          return <tr key={name}>
            <td>{name}</td>
            <td className="m-dev-audit-pair">{foreground} / {background}</td>
            <td className={ratio >= MIN_TEXT_CONTRAST ? 'm-dev-pass' : 'm-dev-fail'}>{ratio.toFixed(2)}:1</td>
          </tr>
        })}
        {STATUS_ORDER.map(name => {
          const {fg, bg} = STATUS_COLORS[theme][name]
          const ratio = contrastRatio(fg, bg)
          return <tr key={`status-${name}`}>
            <td>status.{name}</td>
            <td className="m-dev-audit-pair">{fg} / {bg}</td>
            <td className={ratio >= MIN_TEXT_CONTRAST ? 'm-dev-pass' : 'm-dev-fail'}>{ratio.toFixed(2)}:1</td>
          </tr>
        })}
      </tbody>
    </table>
    <p style={{margin: '10px 0 0', fontSize: 12}}>
      文字/图标色要求 ≥{MIN_TEXT_CONTRAST}:1：{issues.length ? issues.join('；') : '全部达标'}
    </p>
  </div>
}

export function TokenSection({ui}: {ui: MobileTranslator}) {
  return <>
    <div className="dev-token-grid m-dev-grid">
      {DEV_COLOR_TOKENS.map(({labelKey, token}) => <div className="dev-token" key={token}>
        <span style={{background: `var(${token})`}} />
        <div><strong>{ui(labelKey)}</strong><code>var({token})</code></div>
      </div>)}
    </div>
    {/* 两套主题都列出来，不用切主题就能核对深色令牌 */}
    <ContrastAudit theme="light" ui={ui} />
    <ContrastAudit theme="dark" ui={ui} />
  </>
}
