/**
 * 组件测试页的分区清单。
 *
 * 顺序与标题**逐项对齐 PC 的 `pages/DevControls.tsx`**，文案键全部复用 PC 的
 * `developer.*`（定义在 `i18n.dev.ts`，5 种语言齐全）。手机端的 translator 本来
 * 就会对非 `mobile.*` 的键回落到 PC 的 `translateUi`，所以这里不需要重写一个字。
 *
 * 抽成纯数据是为了让单测能断言「分区没漏、文案键在 5 种语言里都取得到」——
 * 组件本身在 vitest 里跑不了（没有 jsdom）。
 */
import type { UiKey } from '../../i18n'

export interface DevSection {
  /** 与 PC DevControls 的分区一一对应 */
  id: string
  /** PC 词表里的标题键 */
  labelKey: UiKey
  /** 该分区在 PC 里是否由 panel-heading 承载标题（简介条不是） */
  headed: boolean
}

export const DEV_SECTIONS: DevSection[] = [
  {id: 'playground', labelKey: 'developer.playground', headed: false},
  {id: 'visualLab', labelKey: 'developer.visualLab', headed: true},
  {id: 'layers', labelKey: 'developer.layers', headed: true},
  {id: 'colorsTokens', labelKey: 'developer.colorsTokens', headed: true},
  {id: 'typography', labelKey: 'developer.typography', headed: true},
  {id: 'buttons', labelKey: 'developer.buttons', headed: true},
  {id: 'formControls', labelKey: 'developer.formControls', headed: true},
  {id: 'selectorsStatus', labelKey: 'developer.selectorsStatus', headed: true},
  {id: 'layout', labelKey: 'developer.layout', headed: true},
  {id: 'dataTables', labelKey: 'developer.dataTables', headed: true},
  {id: 'feedback', labelKey: 'developer.feedback', headed: true},
]

export const DEV_SECTION_IDS = DEV_SECTIONS.map(section => section.id)

/**
 * 颜色分区里列出的令牌。
 *
 * PC 那份列的是 `--text`/`--accent`/`--surface`… —— 手机端现在引了 PC 的
 * tokens.css，**这些变量真的存在**，所以列的是同一套，不再是手机端自造的色阶。
 */
export const DEV_COLOR_TOKENS: Array<{labelKey: UiKey; token: string}> = [
  {labelKey: 'developer.tokenText', token: '--text'},
  {labelKey: 'developer.tokenMuted', token: '--muted'},
  {labelKey: 'developer.tokenAccent', token: '--accent'},
  {labelKey: 'developer.tokenAccentSoft', token: '--accent-soft'},
  {labelKey: 'developer.tokenSurface', token: '--surface'},
  {labelKey: 'developer.tokenSurfaceMuted', token: '--surface-muted'},
  {labelKey: 'developer.tokenBorder', token: '--border'},
  {labelKey: 'developer.tokenGlassTint', token: '--glass-tint'},
  {labelKey: 'developer.tokenGlassEdge', token: '--glass-edge'},
  {labelKey: 'developer.tokenGreen', token: '--green'},
  {labelKey: 'developer.tokenRed', token: '--red'},
  {labelKey: 'developer.tokenBackground', token: '--bg'},
]

/** 视觉效果实验室的滑杆。 */
export const DEV_SLIDERS: Array<{key: 'blur' | 'saturation' | 'opacity' | 'radius' | 'shadow'; labelKey: UiKey; min: number; max: number; unit: string}> = [
  {key: 'blur', labelKey: 'developer.blur', min: 0, max: 48, unit: 'px'},
  {key: 'saturation', labelKey: 'developer.saturate', min: 70, max: 180, unit: '%'},
  {key: 'opacity', labelKey: 'developer.surface', min: 0, max: 100, unit: '%'},
  {key: 'radius', labelKey: 'developer.radius', min: 0, max: 48, unit: 'px'},
  {key: 'shadow', labelKey: 'developer.shadow', min: 0, max: 48, unit: 'px'},
]

/** 模糊预设档位，与 PC 的 [0,6,12,18,24,32] 一致。 */
export const DEV_BLUR_PRESETS = [0, 6, 12, 18, 24, 32]

/** 圆角档位，与 PC 的 [0,6,10,14,18,22,26,32,999] 一致。 */
export const DEV_RADII = [0, 6, 10, 14, 18, 22, 26, 32, 999]

/** 模糊档位的语义标签（与 PC 的分档一致）。 */
export function blurLevelKey(value: number): UiKey {
  if (value === 0) return 'developer.blurNone'
  if (value <= 12) return 'developer.blurLight'
  if (value <= 24) return 'developer.blurMedium'
  return 'developer.blurHeavy'
}
