import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { AppContext, type AppContextValue } from '../app/context'
import { MonitorPanel } from './MonitorPanel'
import type { Schema } from '../api/types'

const mockSchema: Schema = {
  menu: {},
  args: {},
  translations: {},
}

const mockContext: AppContextValue = {
  instancesLoaded: true,
  instances: [{ name: 'alas', status: 'stopped', serial: '127.0.0.1:5555', server: 'cn' }],
  schema: mockSchema,
  refresh: async () => {},
  t: (key: string) => key,
  notify: () => {},
  previewEnabled: false,
  setPreviewEnabled: () => {},
  theme: 'light',
  setTheme: () => {},
  language: 'zh-CN',
  setLanguage: () => {},
}

describe('MonitorPanel 组件', () => {
  it('渲染运行监控标签栏与自适应监控体', () => {
    const html = renderToStaticMarkup(
      <AppContext.Provider value={mockContext}>
        <MemoryRouter>
          <MonitorPanel instance="alas" />
        </MemoryRouter>
      </AppContext.Provider>
    )

    expect(html).toContain('monitor-panel')
    expect(html).toContain('monitor-tabs')
    expect(html).toContain('monitor-segmented')
    expect(html).toContain('日志')
    expect(html).toContain('截图')
    expect(html).toContain('monitor-view')
    expect(html).toContain('aspect-ratio')
  })

  it('默认比例为 16:9 并在无截图时展示原有 Empty 等待状态', () => {
    const html = renderToStaticMarkup(
      <AppContext.Provider value={mockContext}>
        <MemoryRouter>
          <MonitorPanel instance="alas" />
        </MemoryRouter>
      </AppContext.Provider>
    )

    // 默认比例约为 1.7777777777777777 (16/9)
    expect(html).toMatch(/aspect-ratio:\s*(?:16\s*\/\s*9|1\.777\d*)/)

    // 验证原有的 Empty 组件文案
    expect(html).toContain('等待任务截图')
    expect(html).not.toContain('任务截图后自动更新；空闲时保留最后画面。')
    expect(html).toContain('empty')
  })
})
