import { describe, expect, it } from 'vitest'
import { VIRTUAL_THRESHOLD, variablePrefix, variableWindow, virtualWindow } from './virtual'

describe('virtualWindow', () => {
  it('renders only the visible slice of a long list', () => {
    // 93 个任务、每行 64px、视口 800px：一屏只该渲染十几行，而不是 93 行
    const result = virtualWindow(93, 64, 0, 800, 6)
    expect(result.end - result.start).toBeLessThan(25)
    expect(result.start).toBe(0)
    expect(result.offsetY).toBe(0)
  })

  it('reports the full height so the scrollbar stays honest', () => {
    expect(virtualWindow(93, 64, 0, 800).totalHeight).toBe(93 * 64)
    expect(virtualWindow(500, 22, 0, 800).totalHeight).toBe(11_000)
  })

  it('moves the window and the offset as the list scrolls', () => {
    const top = virtualWindow(93, 64, 0, 800, 0)
    const middle = virtualWindow(93, 64, 64 * 40, 800, 0)
    expect(middle.start).toBe(40)
    expect(middle.offsetY).toBe(40 * 64)
    expect(middle.start).toBeGreaterThan(top.start)
  })

  it('never runs past the end of the list', () => {
    const result = virtualWindow(93, 64, 64 * 92, 800, 6)
    expect(result.end).toBe(93)
    expect(result.start).toBeLessThan(93)
  })

  it('clamps a negative scroll offset to the first row', () => {
    // 列表还没滚到页眉下方时 rect.top 是正的，-top 为负
    const result = virtualWindow(93, 64, -300, 800, 0)
    expect(result.start).toBe(0)
    expect(result.offsetY).toBe(0)
  })

  it('overscan adds rows above and below the viewport', () => {
    const exact = virtualWindow(200, 50, 50 * 20, 400, 0)
    const padded = virtualWindow(200, 50, 50 * 20, 400, 8)
    expect(padded.start).toBe(exact.start - 8)
    expect(padded.end).toBe(exact.end + 8)
    expect(padded.offsetY).toBe(padded.start * 50)
  })

  it('degrades safely on empty lists and zero row height', () => {
    expect(virtualWindow(0, 64, 0, 800)).toEqual({start: 0, end: 0, offsetY: 0, totalHeight: 0})
    expect(virtualWindow(10, 0, 0, 800).totalHeight).toBe(0)
    expect(virtualWindow(10, 0, 0, 800).end).toBe(0)
  })

  it('handles a zero-height viewport without an empty window', () => {
    // 首帧测量前 innerHeight 可能是 0，此时仍要渲染一行，否则会闪一下空白
    const result = virtualWindow(50, 50, 0, 0, 0)
    expect(result.end).toBeGreaterThan(result.start)
  })

  it('keeps the threshold in the range where virtualizing pays off', () => {
    expect(VIRTUAL_THRESHOLD).toBeGreaterThanOrEqual(30)
    expect(VIRTUAL_THRESHOLD).toBeLessThanOrEqual(100)
  })
})

describe('container scrolling (日志页)', () => {
  /* 日志页是整屏自适应的：页面本身不滚，由 .m-logscroll 自己滚。所以
     scrollTop 就是「已经滚过去多少」，viewport 是容器高度而不是 window.innerHeight。 */

  it('maps a container scrollTop straight onto the window offset', () => {
    // 500 行 × 18px 的日志，容器 600px 高，滚到第 200 行
    const result = virtualWindow(500, 18, 200 * 18, 600, 12)
    expect(result.start).toBe(200 - 12)
    expect(result.offsetY).toBe((200 - 12) * 18)
    expect(result.totalHeight).toBe(9000)
  })

  it('renders only a container-worth of rows plus overscan', () => {
    const result = virtualWindow(500, 18, 0, 600, 12)
    // ceil(600/18)+1 = 35 行在视口内，加上下各 12 行 overscan
    expect(result.end - result.start).toBeLessThan(70)
    expect(result.start).toBe(0)
  })

  it('clamps at both ends of the log buffer', () => {
    expect(virtualWindow(500, 18, 0, 600, 12).start).toBe(0)
    expect(virtualWindow(500, 18, 9000, 600, 12).end).toBe(500)
    // 滚过头（回弹）也不能算出负下标
    expect(virtualWindow(500, 18, 99_999, 600, 12).start).toBeLessThan(500)
  })

  it('treats a zero-height container as empty instead of rendering everything', () => {
    // 首帧测量前 clientHeight 可能是 0
    const result = virtualWindow(500, 18, 0, 0, 0)
    expect(result.end).toBeGreaterThan(result.start)
    expect(result.end).toBeLessThan(500)
  })
})

describe('变高行的虚拟化（日志里有多行条目）', () => {
  /* rich 会把超宽正文 fold 成多行，回溯信息本来就是多行，`logger.hr` 的分割线行
     还带外边距。按定高 18px 渲染这些行会溢出并与下一行叠字，所以日志改用前缀和定位。 */

  it('前缀和就是每行高度累加，长度恒为行数 + 1', () => {
    expect(variablePrefix([18, 18, 18])).toEqual([0, 18, 36, 54])
    expect(variablePrefix([])).toEqual([0])
  })

  it('偏移量落在正确的那一行上', () => {
    /* 10 行：前 9 行 18px，第 10 行是个 72px 的四行条目 */
    const heights = [...Array(9).fill(18), 72]
    const prefix = variablePrefix(heights)
    const result = variableWindow(prefix, 18 * 5, 100, 0)
    expect(result.start).toBe(5)
    expect(result.offsetY).toBe(18 * 5)
    expect(result.totalHeight).toBe(18 * 9 + 72)
  })

  it('长条目不会被切成半行：窗口边界落在整行之间', () => {
    const heights = [18, 18, 108, 18, 18]
    const prefix = variablePrefix(heights)
    /* 视口压在长条目中间，它必须整个落在窗口里 */
    const result = variableWindow(prefix, 36, 40, 0)
    expect(result.start).toBeLessThanOrEqual(2)
    expect(result.end).toBeGreaterThan(2)
  })

  it('滚到底时窗口贴住末尾，且不会越界', () => {
    const prefix = variablePrefix([...Array(100).fill(18), 90])
    const total = prefix.at(-1)!
    const result = variableWindow(prefix, total, 600, 12)
    expect(result.end).toBe(prefix.length - 1)
    expect(result.offsetY).toBeLessThanOrEqual(total)
  })

  it('空列表与零高度视口都安全', () => {
    expect(variableWindow([0], 0, 600)).toEqual({start: 0, end: 0, offsetY: 0, totalHeight: 0})
    const result = variableWindow(variablePrefix(Array(60).fill(18)), 0, 0, 0)
    expect(result.end).toBeGreaterThan(result.start)
  })
})
