/**
 * 正式入口（mobile.html）的外壳：登录 / 连接状态 + 真实数据。
 *
 * 数据来自 `/api/v1/ws`，屏幕组件与评审入口共用 `../MobileShell.tsx`。
 * 连接、实例列表、schema、语言 / 主题、Toast 都由 PC 的 `AppProvider` 提供 ——
 * 手机端不重复实现一套，否则两边行为迟早不一致。
 *
 * 实例选择、当前任务这类**导航状态**留在这里：它们要进 URL，属于外壳的职责。
 */
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { ArrowRight, WifiOff } from 'lucide-react'
import { api } from '../../api/client'
import { useApp, useConnection } from '../../app/context'
import { useUpdater } from '../../app/updater'
import { createMobileTranslator } from '../i18n'
import { MobileShell } from '../MobileShell'
import { LiveDataProvider } from './liveData'

/** 选中的实例记在本地：手机端多数时候只有一个实例，但换实例后不该跳回第一个。 */
const INSTANCE_KEY = 'azurpilot.mobile.instance'

function rememberedInstance(instances: string[]): string | null {
  try {
    const saved = window.localStorage.getItem(INSTANCE_KEY)
    if (saved && instances.includes(saved)) return saved
  } catch { /* 存储不可用时用第一个 */ }
  return instances[0] ?? null
}

/** 登录页：与 PC 同样只要求密码，不做账号体系。 */
function MobileLogin() {
  const {ui} = useApp()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try { await api.login(password) } catch (failure) { setError((failure as Error).message) } finally { setBusy(false) }
  }
  return <div className="m-auth">
    <h1>{ui('auth.welcome')}</h1>
    <p className="muted">{ui('auth.passwordHint')}</p>
    <form className="form-stack" onSubmit={submit}>
      <label htmlFor="mobile-password">{ui('auth.password')}</label>
      <input id="mobile-password" type="password" autoComplete="current-password" autoFocus required
        value={password} onChange={event => setPassword(event.target.value)}/>
      {error && <p role="alert" className="m-auth-error">{error}</p>}
      <button className="button primary" disabled={busy}>
        {busy ? ui('auth.verifying') : ui('auth.enter')}<ArrowRight size={16} aria-hidden="true"/>
      </button>
    </form>
  </div>
}

function MobileStatus({kind, ui}: {kind: 'connecting' | 'offline'; ui: ReturnType<typeof createMobileTranslator>}) {
  return <div className="m-auth m-auth-status">
    {kind === 'offline' ? <WifiOff size={28} aria-hidden="true"/> : null}
    <p>{kind === 'offline' ? ui('mobile.app.offline') : ui('mobile.app.connecting')}</p>
  </div>
}

export function MobileApp() {
  const connection = useConnection()
  const {instances, instancesLoaded, language, setLanguage} = useApp()
  /* 更新检查与 PC 一致：手机端不显示入口，但不能让它因为缺少调用而报错 */
  useUpdater()
  const names = useMemo(() => instances.map(item => item.name), [instances])
  const [instance, setInstance] = useState<string | null>(null)

  /* 首次拿到实例列表时选中一个；之后跟随本地记忆。
     **实例全被删掉时要退回 null** —— 否则 instance 还指着那个已经不存在的名字，
     下面的 `!instance` 分支永远进不去，整屏卡在「找不到实例」上。 */
  useEffect(() => {
    setInstance(current => current && names.includes(current) ? current : rememberedInstance(names))
  }, [names])

  useEffect(() => {
    if (!instance) return
    try { window.localStorage.setItem(INSTANCE_KEY, instance) } catch { /* 存储不可用 */ }
  }, [instance])

  /* 当前打开的任务：任务配置页要按它拉配置。进 URL，便于深链。 */
  const [task, setTask] = useState<string | null>(() =>
    new URLSearchParams(window.location.search).get('task'))
  useEffect(() => {
    const url = new URL(window.location.href)
    if (task) url.searchParams.set('task', task)
    else url.searchParams.delete('task')
    window.history.replaceState(window.history.state, '', url)
  }, [task])

  const ui = useMemo(() => createMobileTranslator(language), [language])

  if (connection === 'auth') return <MobileLogin/>
  if (connection === 'connecting') return <MobileStatus kind="connecting" ui={ui}/>
  if (connection === 'offline') return <MobileStatus kind="offline" ui={ui}/>

  /* 连上了但一个实例都没有：把话说清楚，而不是一直转圈 */
  if (!instance) {
    return instancesLoaded && !names.length
      ? <div className="m-auth m-auth-status"><p>{ui('mobile.app.noInstance')}</p></div>
      : <MobileStatus kind="connecting" ui={ui}/>
  }

  return <LiveDataProvider instance={instance} task={task} ui={ui}>
    {/* 外壳自己管屏幕；`?task=` 变化时告诉外壳当前任务，配置页据此拉数据；
        首页点实例卡切换实例（实例是 URL 与本地记忆的一部分，外壳不自己存）。
        `initialLanguage` 把 AppProvider 当前的语言交给外壳当默认值 —— 两边各读各的
        本地键时，电脑端选了日语、手机端却仍是简体，会出现「资源名日文、Tab 中文」。 */}
    <MobileShell onLanguageChange={setLanguage} onTaskChange={setTask}
      onInstanceChange={setInstance} initialTask={task} initialLanguage={language}/>
  </LiveDataProvider>
}
