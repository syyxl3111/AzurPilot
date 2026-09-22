/**
 * 示意图入口的 AppContext 垫片。
 *
 * **为什么需要**：PC 的共用组件会通过 `useApp()` 读应用级状态 —— 比如
 * `components/SegmentedControl.tsx` 要读 `theme` 决定用玻璃滑块还是朴素分段。示意图
 * 入口不该套 PC 的 `AppProvider`（它会连真实 WebSocket、拉实例与 schema），但少了
 * 这层 Provider，`useApp()` 返回 null，组件一挂就抛
 * 「Cannot destructure property 'theme' of … as it is null」，**整页白屏** ——
 * 而白屏时 Playwright 只会报一堆「等不到某元素」，很难看出根因。手机端早先在
 * `StatisticsTable` 上踩过一次同样的坑，这里把上下文补齐。
 *
 * 主题与配色**订阅真实 store**：外观切换、深色令牌、配色都不作假；文案与实例用夹具。
 * `AppContextValue` 是强类型，PC 那边加字段时这里会立刻编译不过，而不是等评审时白屏。
 */
import { useCallback, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react'
import type { Instance } from '../../api/types'
import { AppContext, type AppContextValue } from '../../app/context'
import { readDevMode, writeDevMode } from '../../app/devMode'
import { applyTheme, getThemePreference, subscribeTheme, type CustomPalette } from '../../app/theme'
import { translateUi, type Language, type UiTranslator } from '../../i18n'
import { mockInstances } from './data'
import { mockTranslate } from './mockDataSource'

const LANGUAGES: readonly Language[] = ['zh-CN', 'zh-TW', 'en-US', 'ja-JP', 'zh-MIAO']

/** 与 PC 的 `initialLanguage` 同一套顺序：先本地键（手机端的优先），再回默认。 */
function initialLanguage(): Language {
  try {
    const saved = localStorage.getItem('azurpilot.mobile.language') ?? localStorage.getItem('azurpilot.language')
    if (saved && (LANGUAGES as readonly string[]).includes(saved)) return saved as Language
  } catch { /* 存储不可用时用默认语言 */ }
  return 'zh-CN'
}

export function MockAppProvider({children}: {children: ReactNode}) {
  const {theme, palette, colorMode, resolvedMode, customPalettes} = useSyncExternalStore(subscribeTheme, getThemePreference)
  const [language, setLanguageState] = useState<Language>(initialLanguage)
  const [previewEnabled, setPreviewEnabled] = useState(false)
  const [devMode, setDevModeState] = useState(readDevMode)

  const setTheme = useCallback((next: AppContextValue['theme']) => {
    void applyTheme({...getThemePreference(), theme: next})
  }, [])
  const setPalette = useCallback((next: AppContextValue['palette']) => {
    void applyTheme({...getThemePreference(), palette: next})
  }, [])
  const setColorMode = useCallback((next: AppContextValue['colorMode']) => {
    void applyTheme({...getThemePreference(), colorMode: next})
  }, [])
  const saveCustomPalette = useCallback((item: CustomPalette) => {
    const current = getThemePreference()
    const saved = current.customPalettes.some(entry => entry.id === item.id)
      ? current.customPalettes.map(entry => entry.id === item.id ? item : entry)
      : [...current.customPalettes, item]
    void applyTheme({...current, customPalettes: saved, palette: item.id})
  }, [])
  const deleteCustomPalette = useCallback((id: CustomPalette['id']) => {
    const current = getThemePreference()
    void applyTheme({
      ...current,
      customPalettes: current.customPalettes.filter(entry => entry.id !== id),
      palette: current.palette === id ? 'ocean' : current.palette,
    })
  }, [])
  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next)
    /* 两个键都写：PC 的键给数据层（AppProvider 的 t()），手机端的键给外壳。 */
    try {
      localStorage.setItem('azurpilot.language', next)
      localStorage.setItem('azurpilot.mobile.language', next)
    } catch { /* 存储不可用时仅当前会话生效 */ }
  }, [])
  const setDevMode = useCallback((enabled: boolean) => {
    setDevModeState(enabled)
    writeDevMode(enabled)
  }, [])
  /* 假数据不会报错，通知没有去处；保留空实现而不是漏字段（漏字段会白屏）。 */
  const notify = useCallback((_message: string, _error?: boolean) => { /* no-op */ }, [])
  const refresh = useCallback(async () => { /* 假数据不需要重拉 */ }, [])
  const t = useCallback((key: string) => mockTranslate(key), [])
  const ui = useMemo<UiTranslator>(() => (key, params) => translateUi(language, key, params), [language])

  const value = useMemo<AppContextValue>(() => ({
    instancesLoaded: true,
    instances: mockInstances as Instance[],
    schema: undefined,
    refresh, t, ui, notify,
    previewEnabled, setPreviewEnabled,
    devMode, setDevMode,
    theme, setTheme,
    palette, setPalette,
    colorMode, resolvedMode, setColorMode,
    customPalettes, saveCustomPalette, deleteCustomPalette,
    language, setLanguage,
  }), [
    refresh, t, ui, notify, previewEnabled, devMode, setDevMode, theme, setTheme, palette, setPalette,
    colorMode, resolvedMode, setColorMode, customPalettes, saveCustomPalette, deleteCustomPalette,
    language, setLanguage,
  ])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
