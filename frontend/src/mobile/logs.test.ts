import { describe, expect, it } from 'vitest'
import { LOG_CAP, mergeLogs } from './logs'
import type { LogEntry } from '../api/types'

const entry = (id: number): LogEntry => ({id, level: 'INFO', text: `INFO  00:00:0${id % 10}.000 │ line ${id}`})

describe('日志合并', () => {
  it('去重：GET 与事件推送的重叠段只留一份', () => {
    const first = [entry(1), entry(2), entry(3)]
    /* 推送通常从「最后一个已知 id」往回带一点，直接拼接就会出现重复行 */
    const merged = mergeLogs(first, [entry(3), entry(4)], false)
    expect(merged.map(item => item.id)).toEqual([1, 2, 3, 4])
  })

  it('排序：区间回退时也要保持按 id 递增', () => {
    const merged = mergeLogs([entry(5), entry(6)], [entry(3), entry(4)], false)
    expect(merged.map(item => item.id)).toEqual([3, 4, 5, 6])
  })

  it('重复合并不产生重复行（切到截图 tab 会重订阅）', () => {
    const batch = [entry(1), entry(2)]
    const once = mergeLogs([], batch, false)
    const twice = mergeLogs(once, batch, false)
    expect(twice).toEqual(once)
  })

  it('reset 时整段替换，不再与旧内容拼接', () => {
    const merged = mergeLogs([entry(90), entry(91)], [entry(1), entry(2)], true)
    expect(merged.map(item => item.id)).toEqual([1, 2])
  })

  it('上限与后端一致：只留最近 400 条', () => {
    const many = Array.from({length: LOG_CAP + 50}, (_, index) => entry(index + 1))
    const merged = mergeLogs([], many, false)
    expect(merged).toHaveLength(LOG_CAP)
    expect(merged.at(-1)?.id).toBe(LOG_CAP + 50)
    expect(mergeLogs([entry(1)], many, true)).toHaveLength(LOG_CAP)
  })
})
