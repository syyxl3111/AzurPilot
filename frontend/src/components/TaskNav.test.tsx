import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AppContext, type AppContextValue } from '../app/context'
import { TaskNav } from './TaskNav'
import type { Schema } from '../api/types'

const mockSchema: Schema = {
  menu: {
    Alas: {
      menu: 'collapse',
      page: 'setting',
      tasks: ['Alas', 'General', 'Restart'],
    },
    Farm: {
      menu: 'collapse',
      page: 'setting',
      tasks: ['Main', 'Main2', 'ThreeOilLowCost'],
    },
  },
  args: {},
  translations: {},
}

const mockTranslations: Record<string, string> = {
  'Menu.Alas.name': '智慧港区Plus',
  'Menu.Farm.name': '出击Plus',
  'Task.Alas.name': '基础设置',
  'Task.General.name': '通用设置',
  'Task.Restart.name': '游戏重启',
  'Task.Main.name': '主线常规出击',
  'Task.Main2.name': '主线常规出击2',
  'Task.ThreeOilLowCost.name': '3油低耗出击',
}

const mockContext: AppContextValue = {
  instancesLoaded: true,
  instances: [{ name: 'default', status: 'stopped', serial: '127.0.0.1:5555', server: 'cn' }],
  schema: mockSchema,
  refresh: async () => {},
  t: (key: string) => mockTranslations[key] ?? key,
  notify: () => {},
  previewEnabled: false,
  setPreviewEnabled: () => {},
  theme: 'light',
  setTheme: () => {},
  language: 'zh-CN',
  setLanguage: () => {},
}

describe('TaskNav 导航组件', () => {
  it('电脑端：正确渲染一级菜单按钮及无障碍属性', () => {
    const html = renderToStaticMarkup(
      <AppContext.Provider value={mockContext}>
        <MemoryRouter initialEntries={['/i/default/overview']}>
          <Routes>
            <Route path="/i/:instance/*" element={<TaskNav />} />
          </Routes>
        </MemoryRouter>
      </AppContext.Provider>
    )

    // 检查容器与搜索框
    expect(html).toContain('task-nav-container')
    expect(html).toContain('展开任务搜索')
    expect(html).not.toContain('搜索任务…')

    // 检查一级菜单项按钮
    expect(html).toContain('task-group-button')
    expect(html).toContain('aria-haspopup="menu"')
    expect(html).toContain('aria-expanded="false"')

    // 检查向右指示箭头图标和菜单文本
    expect(html).toContain('task-group-arrow')
    expect(html).toContain('智慧港区Plus')
    expect(html).toContain('出击Plus')

    // 检查任务数量徽标
    expect(html).toContain('task-group-badge')
    expect(html).toContain('>3<') // Alas 组有 3 个任务
  })

  it('电脑端：展开一级菜单时，向右弹出二级子菜单浮层', () => {
    const html = renderToStaticMarkup(
      <AppContext.Provider value={mockContext}>
        <MemoryRouter initialEntries={['/i/default/overview']}>
          <Routes>
            <Route path="/i/:instance/*" element={<TaskNav defaultOpenKey="Alas" />} />
          </Routes>
        </MemoryRouter>
      </AppContext.Provider>
    )

    // 一级菜单应带有 expanded 类和 aria-expanded="true"
    expect(html).toContain('task-group-button expanded')
    expect(html).toContain('aria-expanded="true"')

    // 电脑端向右弹出层检查
    expect(html).toContain('task-submenu-flyout')
    expect(html).not.toContain('task-group-children')

    // 子菜单列表检查：应动态渲染出 Alas 下的所有子任务
    expect(html).toContain('task-submenu-list')
    expect(html).toContain('task-submenu-item')
    expect(html).toContain('基础设置')
    expect(html).toContain('通用设置')
    expect(html).toContain('游戏重启')
    expect(html).toContain('href="/i/default/task/Alas"')
    expect(html).toContain('href="/i/default/task/General"')
    expect(html).toContain('href="/i/default/task/Restart"')
  })

  it('手机端：forceMobile 展开一级菜单时，在下方垂直展开手风琴子列表', () => {
    const html = renderToStaticMarkup(
      <AppContext.Provider value={mockContext}>
        <MemoryRouter initialEntries={['/i/default/overview']}>
          <Routes>
            <Route path="/i/:instance/*" element={<TaskNav defaultOpenKey="Alas" forceMobile={true} />} />
          </Routes>
        </MemoryRouter>
      </AppContext.Provider>
    )

    // 一级菜单应带有 expanded 类和 aria-expanded="true"
    expect(html).toContain('task-group-button expanded')
    expect(html).toContain('aria-expanded="true"')
    expect(html).not.toContain('aria-haspopup="menu"')

    // 手机端向下展开检查
    expect(html).toContain('task-group-children')
    expect(html).not.toContain('task-submenu-flyout')

    // 子任务列表检查
    expect(html).toContain('task-nav-item')
    expect(html).toContain('基础设置')
    expect(html).toContain('href="/i/default/task/Alas"')
  })
})
