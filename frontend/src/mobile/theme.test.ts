/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  MIN_TEXT_CONTRAST,
  STATUS_COLORS,
  blend,
  contrastRatio,
  darkShell,
  glass,
  glassOver,
  lightShell,
  palettes,
  parseHex,
  readabilityIssues,
  relativeLuminance,
  statusIssues,
} from './theme'

describe('glass compositing', () => {
  it('composites the tint onto the page colour instead of trusting the raw value', () => {
    // --glass-tint 是 #ffffffb8（72% 白），不合成就会算出偏乐观的对比度
    expect(glassOver('light')).not.toBe('#ffffff')
    expect(glassOver('dark')).not.toBe('#242426')
    // 亮色玻璃落在浅灰页面上，结果应当比页面底色更亮但不到纯白
    expect(relativeLuminance(glassOver('light'))).toBeGreaterThan(relativeLuminance(glass.light.page))
    expect(relativeLuminance(glassOver('light'))).toBeLessThan(relativeLuminance('#ffffff'))
    // 深色玻璃落在深色页面上，结果应当比页面底色更亮
    expect(relativeLuminance(glassOver('dark'))).toBeGreaterThan(relativeLuminance(glass.dark.page))
  })

  it('is opaque and stays within the source range', () => {
    for (const theme of ['light', 'dark'] as const) {
      const result = glassOver(theme)
      expect(parseHex(result), `${theme} 合成结果不是合法十六进制`).not.toBeNull()
      expect(result).toMatch(/^#[0-9a-f]{6}$/)
    }
  })

  it('returns the backdrop at alpha 0 and the tint at alpha 1', () => {
    expect(blend('#ffffff', '#000000', 0)).toBe('#000000')
    expect(blend('#ffffff', '#000000', 1)).toBe('#ffffff')
    expect(blend('#ffffff', '#000000', 0.5)).toBe('#808080')
  })

  it('degrades to the backdrop instead of throwing on bad input', () => {
    expect(blend('nonsense', '#123456', 0.5)).toBe('#123456')
    expect(blend('#ffffff', 'nonsense', 0.5)).toBe('nonsense')
  })
})

describe('shell palettes', () => {
  it('meets WCAG AA for every text role in both themes', () => {
    expect(readabilityIssues(lightShell)).toEqual([])
    expect(readabilityIssues(darkShell)).toEqual([])
  })

  it('keeps the measured ratios the design was approved against', () => {
    /* 这几个数字是配色评审时逐项核对过的（背景是**合成后**的玻璃色：
       亮色 #fcfcfd、深色 #222224），改令牌时应当一起更新而不是悄悄漂移 */
    expect(lightShell.barBg).toBe('#fcfcfd')
    expect(darkShell.barBg).toBe('#222224')
    expect(contrastRatio(lightShell.text, lightShell.barBg)).toBeCloseTo(16.41, 1)
    expect(contrastRatio(lightShell.muted, lightShell.barBg)).toBeCloseTo(4.95, 1)
    expect(contrastRatio(lightShell.accent, lightShell.barBg)).toBeCloseTo(4.58, 1)
    expect(contrastRatio(darkShell.text, darkShell.barBg)).toBeCloseTo(14.59, 1)
    expect(contrastRatio(darkShell.muted, darkShell.barBg)).toBeCloseTo(6.87, 1)
    expect(contrastRatio(darkShell.accent, darkShell.barBg)).toBeCloseTo(6.61, 1)
    // Tab 选中/未选中都在玻璃上，取的就是这三个令牌
    expect(lightShell.accent).toBe('#0071e3')
    expect(darkShell.accent).toBe('#64aaff')
  })

  it('tracks the PC tokens it mirrors', () => {
    // 这些值必须与 PC 的 tokens.css 一致 —— 手机端与电脑端是同一套设计系统
    expect(lightShell.pageBg).toBe('#f5f5f7')
    expect(lightShell.surface).toBe('#ffffff')
    expect(lightShell.text).toBe('#1d1d1f')
    expect(lightShell.muted).toBe('#6e6e73')
    expect(lightShell.border).toBe('#e5e5ea')
    expect(darkShell.pageBg).toBe('#161618')
    expect(darkShell.surface).toBe('#242426')
    expect(darkShell.text).toBe('#f5f5f7')
    expect(darkShell.border).toBe('#38383a')
  })

  it('keeps the two themes genuinely different', () => {
    expect(darkShell.pageBg).not.toBe(lightShell.pageBg)
    expect(darkShell.barBg).not.toBe(lightShell.barBg)
    expect(relativeLuminance(darkShell.text)).toBeGreaterThan(relativeLuminance(darkShell.pageBg))
    expect(relativeLuminance(lightShell.text)).toBeLessThan(relativeLuminance(lightShell.pageBg))
  })

  it('no longer carries the retired rose ramp', () => {
    for (const palette of Object.values(palettes)) {
      for (const value of Object.values(palette)) {
        expect(String(value).toLowerCase()).not.toContain('b32d5c')
        expect(String(value).toLowerCase()).not.toContain('fb7299')
      }
    }
  })
})

describe('status badges', () => {
  it('meets WCAG AA in both themes', () => {
    expect(statusIssues('light')).toEqual([])
    expect(statusIssues('dark')).toEqual([])
  })

  it('does not reuse the PC values that fail AA', () => {
    /* PC 现状：running --green #248a3d on --green-soft #eaf6ed = 3.96:1，
       updating #997000 on #fff3cd = 3.98:1。手机端两档都换掉了。 */
    expect(contrastRatio('#248a3d', '#eaf6ed')).toBeLessThan(MIN_TEXT_CONTRAST)
    expect(contrastRatio('#997000', '#fff3cd')).toBeLessThan(MIN_TEXT_CONTRAST)
    expect(STATUS_COLORS.light.running.fg).not.toBe('#248a3d')
    expect(STATUS_COLORS.light.updating.fg).not.toBe('#997000')
  })

  it('covers every status the app can render', () => {
    for (const theme of ['light', 'dark'] as const) {
      expect(Object.keys(STATUS_COLORS[theme]).sort()).toEqual(['error', 'running', 'stopped', 'updating'])
      for (const [name, {fg, bg}] of Object.entries(STATUS_COLORS[theme])) {
        expect(parseHex(fg), `${theme}.${name}.fg`).not.toBeNull()
        expect(parseHex(bg), `${theme}.${name}.bg`).not.toBeNull()
      }
    }
  })

  it('gives dark mode its own updating colours instead of PC light-on-light', () => {
    // PC 的 --theme-warning-soft #fff3cd 没有深色覆盖，深色下会是一块浅黄底
    expect(STATUS_COLORS.dark.updating.bg).not.toBe('#fff3cd')
    expect(relativeLuminance(STATUS_COLORS.dark.updating.bg))
      .toBeLessThan(relativeLuminance(STATUS_COLORS.dark.updating.fg))
  })
})

describe('search field', () => {
  /* 直接读 CSS 源文本取令牌，而不是在 theme.ts 里再镜像一份 —— 镜像迟早会漂移，
     而且这里真正要守的是「CSS 里那条覆盖还在」，只有读源文件才守得住。
     用 node:fs 而不是 Vite 的 `?raw`：Vitest 默认把 CSS 存根成空模块（css: false），
     `?raw` 会拿到空字符串。文件顶部的三斜线引用只为这一个文件打开 node 类型，
     不动 tsconfig 的全局 `types`（免得 app 代码误用 process 之类的 node 全局）。 */
  const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'mobile.css'), 'utf8')

  const blockOf = (selector: string): string => {
    const start = css.indexOf(`${selector} {`)
    expect(start, `mobile.css 中找不到 ${selector}`).toBeGreaterThanOrEqual(0)
    const end = css.indexOf('\n}', start)
    expect(end, `${selector} 块没有正常闭合`).toBeGreaterThan(start)
    return css.slice(start, end)
  }

  const token = (block: string, name: string): string => {
    const match = block.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{3,6})\\s*;`))
    expect(match, `mobile.css 中找不到 --${name}`).not.toBeNull()
    return match![1]
  }

  const light = blockOf("[data-shell='mobile']")
  const dark = blockOf("[data-shell='mobile'][data-theme='dark']")

  it('keeps the placeholder and magnifier readable on the grey field', () => {
    /* 这两档单独给，是因为 --muted 压不住：亮色 #6e6e73 on #e3e3e6 只有 3.96:1 */
    expect(contrastRatio(lightShell.muted, token(light, 'm-search-bg'))).toBeLessThan(MIN_TEXT_CONTRAST)
    for (const [theme, block] of [['light', light], ['dark', dark]] as const) {
      const ratio = contrastRatio(token(block, 'm-search-fg'), token(block, 'm-search-bg'))
      expect(ratio, `${theme} 搜索框前景只有 ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST)
    }
  })

  it('is visibly darker than the page in both themes', () => {
    expect(token(light, 'm-search-bg')).not.toBe(lightShell.pageBg)
    expect(token(dark, 'm-search-bg')).not.toBe(darkShell.pageBg)
    // 亮色往下压、深色往上抬，都是「比页面深一档」的观感方向相反地实现
    expect(relativeLuminance(token(light, 'm-search-bg')))
      .toBeLessThan(relativeLuminance(lightShell.pageBg))
    expect(relativeLuminance(token(dark, 'm-search-bg')))
      .toBeGreaterThan(relativeLuminance(darkShell.pageBg))
  })

  it('rewrites --adm-color-light inside the search bar', () => {
    /* antd 的放大镜用 --adm-color-light(#ccc)，压在深灰底上只有 1.25:1；
       聚焦态还有一条三重类规则把占位符也拉回同一个令牌。这两条在本 chunk 里
       都排在 mobile.css 之后，靠选择器拼不过，所以必须靠改写令牌来兜。 */
    const bar = blockOf("[data-shell='mobile'] .adm-search-bar")
    expect(bar).toContain('--adm-color-light: var(--m-search-fg)')
    expect(contrastRatio('#cccccc', token(light, 'm-search-bg')), 'antd 默认值本来就该是不达标的')
      .toBeLessThan(MIN_TEXT_CONTRAST)
  })
})

describe('contrast maths', () => {
  it('returns 21 for black on white and 1 for a colour against itself', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5)
    expect(contrastRatio('#0071e3', '#0071e3')).toBeCloseTo(1, 5)
  })

  it('is symmetric', () => {
    expect(contrastRatio('#0071e3', '#ffffff')).toBeCloseTo(contrastRatio('#ffffff', '#0071e3'), 10)
  })

  it('expands shorthand hex', () => {
    expect(parseHex('#fff')).toEqual([255, 255, 255])
    expect(parseHex('abc')).toEqual([0xaa, 0xbb, 0xcc])
  })

  it('rejects malformed input', () => {
    expect(parseHex('#12345')).toBeNull()
    expect(parseHex('rebeccapurple')).toBeNull()
    expect(relativeLuminance('nonsense')).toBe(0)
  })

  it('flags a low-contrast pair instead of silently passing', () => {
    const broken = {...lightShell, text: '#cccccc'}
    expect(readabilityIssues(broken)).toHaveLength(1)
    expect(readabilityIssues(broken)[0]).toContain('text')
  })
})
