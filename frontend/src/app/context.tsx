import { createContext, useCallback, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react'
import { api } from '../api/client'
import type { Instance, Schema } from '../api/types'
import type { Parameters } from '../api/generated'
import { resumeEditors } from '../config/editors'

export const languages = {'zh-CN': '简体中文', 'zh-TW': '繁体中文', 'en-US': 'English', 'ja-JP': '日本語', 'zh-MIAO': '喵语'}
type Language = NonNullable<Parameters['schema.get']['language']>

export interface AppContextValue {
  instancesLoaded: boolean; instances: Instance[]; schema?: Schema; refresh: () => Promise<void>; t: (key: string) => string
  notify: (message: string, error?: boolean) => void
  previewEnabled: boolean; setPreviewEnabled: (enabled: boolean) => void
  theme: 'light' | 'dark'; setTheme: (theme: 'light' | 'dark') => void
  language: Language; setLanguage: (language: Language) => void
}
export const AppContext = createContext<AppContextValue | null>(null)
const Context = AppContext
export const useConnection = () => useSyncExternalStore(api.subscribe, api.getSnapshot, api.getSnapshot)
export const useApp = () => useContext(AppContext)!

export function AppProvider({children}: {children: ReactNode}) {
  const connection = useConnection()
  const [instances, setInstances] = useState<Instance[]>([])
  const [instancesLoaded, setInstancesLoaded] = useState(false)
  const [schema, setSchema] = useState<Schema>()
  const [previewEnabled, setPreviewEnabled] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => localStorage.getItem('azurpilot.theme') === 'dark' ? 'dark' : 'light')
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('azurpilot.language')
    return saved && Object.hasOwn(languages, saved) ? saved as Language : 'zh-CN'
  })
  const [toast, setToast] = useState<{message: string; error: boolean}>()
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('azurpilot.theme', theme)
  }, [theme])
  useEffect(() => { api.connect(); return () => api.disconnect() }, [])
  useEffect(() => { if (connection === 'ready') resumeEditors() }, [connection])
  const notify = useCallback((message: string, error = false) => setToast({message, error}), [])
  const refresh = useCallback(async () => setInstances(await api.request('instances.list', {})), [])
  useEffect(() => {
    if (connection !== 'ready') return
    let active = true
    void api.request('instances.list', {}).then(instances => {
      if (active) {setInstances(instances); setInstancesLoaded(true)}
    }).catch(error => notify(error.message, true))
    return () => { active = false }
  }, [connection, notify])
  useEffect(() => {
    if (connection !== 'ready') return
    let active = true
    void api.request('schema.get', {language}).then(schema => {
      if (active) {
        setSchema(schema)
        document.documentElement.lang = language === 'zh-MIAO' ? 'zh-CN' : language
        localStorage.setItem('azurpilot.language', language)
      }
    }).catch(error => {if (active) notify(error.message, true)})
    return () => {active = false}
  }, [connection, language, notify])
  useEffect(() => api.onEvent(event => {
    if (event.topic === 'instances') setInstances(event.data as Instance[])
  }), [])
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(undefined), 6000)
    return () => clearTimeout(timer)
  }, [toast])
  const t = useCallback((key: string) => {
    let value: unknown = schema?.translations
    for (const part of key.split('.')) value = value && typeof value === 'object' ? (value as Record<string, unknown>)[part] : undefined
    return typeof value === 'string' && value !== key ? value : key.split('.').filter(item => item !== 'name' && item !== '_info').at(-1) ?? key
  }, [schema])
  return <Context.Provider value={{instancesLoaded, instances, schema, refresh, t, notify, previewEnabled, setPreviewEnabled, theme, setTheme, language, setLanguage}}>
    {children}
    {toast && <div role={toast.error ? 'alert' : 'status'} className={`toast ${toast.error ? 'error' : ''}`} onClick={() => setToast(undefined)}>{toast.message}</div>}
  </Context.Provider>
}
