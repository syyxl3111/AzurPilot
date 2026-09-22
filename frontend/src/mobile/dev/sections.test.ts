import { describe, expect, it } from 'vitest'
import { translateUi, type Language } from '../../i18n'
import {
  DEV_BLUR_PRESETS,
  DEV_COLOR_TOKENS,
  DEV_RADII,
  DEV_SECTION_IDS,
  DEV_SECTIONS,
  DEV_SLIDERS,
  blurLevelKey,
} from './sections'

const LANGUAGES: Language[] = ['zh-CN', 'zh-TW', 'en-US', 'ja-JP', 'zh-MIAO']

/** PC 的 pages/DevControls.tsx 里的分区标题，顺序即渲染顺序。 */
const PC_SECTIONS = [
  'developer.playground',
  'developer.visualLab',
  'developer.layers',
  'developer.colorsTokens',
  'developer.typography',
  'developer.buttons',
  'developer.formControls',
  'developer.selectorsStatus',
  'developer.layout',
  'developer.dataTables',
  'developer.feedback',
]

describe('dev playground sections', () => {
  it('mirrors the PC developer page section for section, in order', () => {
    expect(DEV_SECTIONS.map(section => section.labelKey)).toEqual(PC_SECTIONS)
  })

  it('uses unique ids', () => {
    expect(new Set(DEV_SECTION_IDS).size).toBe(DEV_SECTION_IDS.length)
  })

  it('only the intro strip is headless', () => {
    // PC 里除 dev-intro 外每个分区都有 panel-heading 标题
    expect(DEV_SECTIONS.filter(section => !section.headed).map(section => section.id)).toEqual(['playground'])
  })
})

describe('developer labels resolve on mobile', () => {
  it('every label key resolves to real text in all five languages', () => {
    /* 手机端的 translator 对非 mobile.* 的键会回落到 PC 的 translateUi，
       所以这些文案不需要在手机端重新登记一遍。这里断言回落真的生效。 */
    const keys = [
      ...DEV_SECTIONS.map(section => section.labelKey),
      ...DEV_COLOR_TOKENS.map(token => token.labelKey),
      ...DEV_SLIDERS.map(slider => slider.labelKey),
      blurLevelKey(0), blurLevelKey(6), blurLevelKey(24), blurLevelKey(48),
    ]
    for (const language of LANGUAGES) {
      for (const key of keys) {
        const text = translateUi(language, key)
        expect(text, `${language} 缺少 ${key}`).toBeTruthy()
        // 生成器把未翻译的键写成键路径本身，那说明漏译了
        expect(text, `${language} 的 ${key} 未翻译（回显了键名）`).not.toBe(key)
      }
    }
  })

  it('keeps the 喵语 label aligned with PC wording', () => {
    // 手机端原先自己写成「喵」，与 PC 系统设置的「喵语」对不上；现在共用一份
    expect(translateUi('zh-CN', 'developer.pageTitle')).toContain('开发者')
  })
})

describe('dev playground constants', () => {
  it('keeps the PC slider ranges', () => {
    const byKey = Object.fromEntries(DEV_SLIDERS.map(slider => [slider.key, slider]))
    expect(byKey.blur.min).toBe(0)
    expect(byKey.blur.max).toBe(48)
    expect(byKey.saturation.min).toBe(70)
    expect(byKey.saturation.max).toBe(180)
    expect(byKey.opacity.min).toBe(0)
    expect(byKey.opacity.max).toBe(100)
    expect(byKey.radius.max).toBe(48)
    expect(byKey.shadow.max).toBe(48)
    expect(DEV_SLIDERS).toHaveLength(5)
  })

  it('keeps the PC blur presets and radius ladder', () => {
    expect(DEV_BLUR_PRESETS).toEqual([0, 6, 12, 18, 24, 32])
    expect(DEV_RADII).toEqual([0, 6, 10, 14, 18, 22, 26, 32, 999])
  })

  it('buckets blur values the same way PC does', () => {
    expect(blurLevelKey(0)).toBe('developer.blurNone')
    expect(blurLevelKey(6)).toBe('developer.blurLight')
    expect(blurLevelKey(12)).toBe('developer.blurLight')
    expect(blurLevelKey(18)).toBe('developer.blurMedium')
    expect(blurLevelKey(24)).toBe('developer.blurMedium')
    expect(blurLevelKey(32)).toBe('developer.blurHeavy')
  })

  it('lists exactly the twelve PC colour tokens', () => {
    expect(DEV_COLOR_TOKENS).toHaveLength(12)
    expect(DEV_COLOR_TOKENS.map(token => token.token)).toEqual([
      '--text', '--muted', '--accent', '--accent-soft',
      '--surface', '--surface-muted', '--border', '--glass-tint',
      '--glass-edge', '--green', '--red', '--bg',
    ])
  })
})
