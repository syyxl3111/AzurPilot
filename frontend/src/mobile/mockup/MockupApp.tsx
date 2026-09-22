/**
 * 评审入口（mobile-mockup.html）：假数据 + 真外壳。
 *
 * 屏幕组件与正式入口是**同一份**（`../MobileShell.tsx`），这里只负责把假数据
 * 塞进 `MobileDataContext`，并套上 AppContext 垫片（`mockApp.tsx`）—— PC 的共用组件
 * 会通过 `useApp()` 读应用级状态，缺这层 Provider 会整页白屏。
 *
 * 当前打开的任务也在这里持有，位置与正式入口的 `?task=` 对应：配置页按它取夹具，
 * 所以「点哪个任务就看哪个任务的配置」在示意图上也是真的。语言同理：外壳报上来的
 * 语言写回垫片，`t` 与 `ui` 都跟着变。
 *
 * 入口本身在评审结束后可以删掉（连同 mobile-mockup.html 与 vite 配置里的一项），
 * 但 `MobileShell.tsx` 要留着。
 */
import { useState } from 'react'
import { useApp } from '../../app/context'
import { MobileShell } from '../MobileShell'
import { MockAppProvider } from './mockApp'
import { MockupDataProvider } from './mockDataSource'

/** 放在垫片里面，才能用 `useApp()` 把语言接到外壳上（与正式入口的接线一致）。 */
function Shell({task, onTask}: {task: string | null; onTask: (task: string | null) => void}) {
  const {language, setLanguage} = useApp()
  return <MockupDataProvider task={task}>
    <MobileShell onTaskChange={onTask} onLanguageChange={setLanguage} initialLanguage={language}/>
  </MockupDataProvider>
}

export function MockupApp() {
  /* 由外壳在进入配置页时报上来，和正式入口把任务写进 URL 的是同一个时机 */
  const [task, setTask] = useState<string | null>(null)
  return <MockAppProvider><Shell task={task} onTask={setTask}/></MockAppProvider>
}
