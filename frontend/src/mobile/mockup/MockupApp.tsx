/**
 * 评审入口（mobile-mockup.html）：假数据 + 真外壳。
 *
 * 屏幕组件与正式入口是**同一份**（`../MobileShell.tsx`），这里只负责把假数据
 * 塞进 `MobileDataContext`。评审时改样式、量间距，正式入口会一起变 —— 这正是
 * 之前把数据抽成契约的目的。
 *
 * 当前打开的任务也在这里持有，位置与正式入口的 `?task=` 对应：配置页按它取夹具，
 * 所以「点哪个任务就看哪个任务的配置」在示意图上也是真的。
 *
 * 入口本身在评审结束后可以删掉（连同 mobile-mockup.html 与 vite 配置里的一项），
 * 但 `MobileShell.tsx` 要留着。
 */
import { useState } from 'react'
import { MobileShell } from '../MobileShell'
import { MockupDataProvider } from './mockDataSource'

export function MockupApp() {
  /* 由外壳在进入配置页时报上来，和正式入口把任务写进 URL 的是同一个时机 */
  const [task, setTask] = useState<string | null>(null)
  return <MockupDataProvider task={task}><MobileShell onTaskChange={setTask}/></MockupDataProvider>
}
