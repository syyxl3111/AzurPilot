/**
 * 手机端的配色契约。
 *
 * **手机端不再自己定义设计令牌** —— 它们来自 PC 的 `tokens.css` / `apple.css`，
 * 本文件只是保留一份同源副本，用来：
 *   1. 让「组件陈列页」现场算对比度；
 *   2. 让单测断言「文字/图标色不得低于 4.5:1」，避免以后有人把 PC 的某个浅色
 *      直接拿去当文字用。
 *
 * 页眉与 Tab 栏是**半透明毛玻璃**，所以校验不能拿令牌原值互相比 —— 先把玻璃色
 * 按 alpha 合成到页面底色上得到实际生效的背景色，再算对比度（见 glassOver）。
 */

/** PC tokens.css 的亮色取值。 */
export interface ShellPalette {
  /** 玻璃条的实际底色：--glass-tint 合成到 --bg 之后的结果 */
  barBg: string
  /** 玻璃条上的正文与标题（PC --text） */
  text: string
  /** 玻璃条上的次要文字、未选中项（PC --muted） */
  muted: string
  /** 强调与选中项（PC --accent） */
  accent: string
  /** 页面底色（PC --bg） */
  pageBg: string
  /** 卡片表面（PC --surface） */
  surface: string
  /** 卡片表面之上的正文（PC --text） */
  onSurface: string
  /** 卡片表面之上的次要文字（PC --muted） */
  onSurfaceMuted: string
  /** 强调色文字落在卡片表面上（PC --accent） */
  accentOnSurface: string
  /** 卡片描边（PC --border） */
  border: string
}

/** 文字与图标的最低对比度（WCAG AA 正文） */
export const MIN_TEXT_CONTRAST = 4.5

/** PC 的毛玻璃与底色原值，供 glassOver 合成用。 */
export const glass = {
  light: {tint: '#ffffff', alpha: 0xb8 / 255, page: '#f5f5f7'},
  dark: {tint: '#242426', alpha: 0xd9 / 255, page: '#161618'},
} as const

/**
 * 把半透明的玻璃色合成到页面底色上，得到实际生效的不透明背景色。
 *
 * 这一步不能省：`--glass-tint` 是 `#ffffffb8`（72% 白），直接拿它算对比度会得到
 * 偏乐观的结果；合成后的颜色才是用户真正看到的那个背景。
 */
export function blend(top: string, bottom: string, alpha: number): string {
  const front = parseHex(top)
  const back = parseHex(bottom)
  if (!front || !back) return bottom
  const mixed = front.map((channel, index) =>
    Math.round(channel * alpha + back[index] * (1 - alpha)))
  return `#${mixed.map(value => value.toString(16).padStart(2, '0')).join('')}`
}

export function glassOver(theme: 'light' | 'dark'): string {
  const {tint, alpha, page} = glass[theme]
  return blend(tint, page, alpha)
}

export const lightShell: ShellPalette = {
  barBg: glassOver('light'),
  text: '#1d1d1f',
  muted: '#6e6e73',
  accent: '#0071e3',
  pageBg: '#f5f5f7',
  surface: '#ffffff',
  onSurface: '#1d1d1f',
  onSurfaceMuted: '#6e6e73',
  accentOnSurface: '#0071e3',
  border: '#e5e5ea',
}

export const darkShell: ShellPalette = {
  barBg: glassOver('dark'),
  text: '#f5f5f7',
  muted: '#aaaab0',
  accent: '#64aaff',
  pageBg: '#161618',
  surface: '#242426',
  onSurface: '#f5f5f7',
  onSurfaceMuted: '#aaaab0',
  accentOnSurface: '#64aaff',
  border: '#38383a',
}

export const palettes: Record<'light' | 'dark', ShellPalette> = {light: lightShell, dark: darkShell}

/**
 * 状态徽标的前景/底色。
 *
 * PC 的 `.status` 取值在手机上不达标，且 `--theme-warning-soft` 在 PC 里没有深色
 * 覆盖（深色下会是一块浅黄底），所以这里两套主题、四档全部自己定，并用 PC 的
 * `.status` 类与标记渲染。同源副本在 mobile.css 的 `--m-status-*`。
 */
export const STATUS_COLORS: Record<'light' | 'dark', Record<string, {fg: string; bg: string}>> = {
  light: {
    running: {fg: '#1a7a35', bg: '#eaf6ed'},
    stopped: {fg: '#6e6e73', bg: '#f5f5f7'},
    error: {fg: '#b3261e', bg: '#faebea'},
    updating: {fg: '#7a5a00', bg: '#f5f1e6'},
  },
  dark: {
    running: {fg: '#6cda86', bg: '#223d2a'},
    stopped: {fg: '#aaaab0', bg: '#1c1c1e'},
    error: {fg: '#ff8a80', bg: '#3a2e2f'},
    updating: {fg: '#e0b055', bg: '#37322b'},
  },
}

/** 把 #rgb / #rrggbb 解析为 0–255 三元组；非法输入返回 null。 */
export function parseHex(hex: string): [number, number, number] | null {
  const value = hex.trim().replace(/^#/, '')
  const full = value.length === 3 ? value.split('').map(char => char + char).join('') : value
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null
  return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16)]
}

/** WCAG 相对亮度；用于对比度计算。 */
export function relativeLuminance(hex: string): number {
  const rgb = parseHex(hex)
  if (!rgb) return 0
  const [r, g, b] = rgb.map(channel => {
    const ratio = channel / 255
    return ratio <= 0.03928 ? ratio / 12.92 : ((ratio + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** 两色对比度，范围 1–21。 */
export function contrastRatio(foreground: string, background: string): number {
  const first = relativeLuminance(foreground)
  const second = relativeLuminance(background)
  const lighter = Math.max(first, second)
  const darker = Math.min(first, second)
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * 列出配色的可读性问题。
 *
 * 每一项都对照它**真正所在的背景**：页眉与 Tab 栏的文字在合成后的玻璃底上，
 * 卡片里的文字在卡片表面上，强调色按它实际出现的位置分别检查。
 *
 * 不检查 border：它是卡片与背景之间的发丝线，纯装饰，不承载状态或文字。
 */
export function readabilityIssues(palette: ShellPalette, minimum = MIN_TEXT_CONTRAST): string[] {
  const checks: Array<[string, string, string]> = [
    ['text', palette.text, palette.barBg],
    ['muted', palette.muted, palette.barBg],
    ['accent', palette.accent, palette.barBg],
    ['onSurface', palette.onSurface, palette.surface],
    ['onSurfaceMuted', palette.onSurfaceMuted, palette.surface],
    ['accentOnSurface', palette.accentOnSurface, palette.surface],
  ]
  return checks
    .map(([name, foreground, background]) => ({name, ratio: contrastRatio(foreground, background)}))
    .filter(item => item.ratio < minimum)
    .map(item => `${item.name} 在对应底色上对比度 ${item.ratio.toFixed(2)}:1，低于 ${minimum}:1`)
}

/** 状态徽标的可读性问题；单独列是因为它有自己的底色。 */
export function statusIssues(theme: 'light' | 'dark', minimum = MIN_TEXT_CONTRAST): string[] {
  return Object.entries(STATUS_COLORS[theme])
    .map(([name, {fg, bg}]) => ({name, ratio: contrastRatio(fg, bg)}))
    .filter(item => item.ratio < minimum)
    .map(item => `status.${item.name} 对比度 ${item.ratio.toFixed(2)}:1，低于 ${minimum}:1`)
}
