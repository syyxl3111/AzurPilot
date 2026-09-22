/**
 * 底部 Tab 栏：整宽、毛玻璃（与页眉同材质），五项来自 shell.ts 的 tabModel()。
 *
 * 设置不在其中 —— 它只从 App 宿主的 ⚙ 进入，浏览器用户不进设置页。
 * 玻璃由 PC 的 .glass-material 提供，选中/未选中色由 mobile.css 接到 PC 的
 * --accent / --muted 上。
 */
import { TabBar } from 'antd-mobile'
import { ChartNoAxesCombined, House, ListTodo, ScrollText, Server } from 'lucide-react'
import type { ReactNode } from 'react'
import { tabModel, type TabKey } from '../shell'
import type { MobileTranslator } from '../i18n'

const ICONS: Record<TabKey, ReactNode> = {
  overview: <House size={22} />,
  instance: <Server size={22} />,
  tasks: <ListTodo size={22} />,
  stats: <ChartNoAxesCombined size={22} />,
  logs: <ScrollText size={22} />,
}

interface Props {
  instance: string
  active: TabKey
  ui: MobileTranslator
  onSelect: (tab: TabKey) => void
}

export function MobileTabBar({instance, active, ui, onSelect}: Props) {
  return <div className="m-tabbar">
    <div className="glass-material" aria-hidden="true" />
    <TabBar activeKey={active} onChange={key => onSelect(key as TabKey)}>
      {tabModel(instance).map(tab => (
        <TabBar.Item key={tab.key} title={ui(tab.labelKey)} icon={ICONS[tab.key]} />
      ))}
    </TabBar>
  </div>
}
