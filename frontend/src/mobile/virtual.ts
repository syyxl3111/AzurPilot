/**
 * 长列表虚拟化。
 *
 * 任务页有 95 个任务、日志页最多 400 行（与后端缓冲上限一致），整份挂进 DOM 会让
 * 低端安卓机在滚动时掉帧（清单里的 virtualize-lists 是 High）。项目没有引入第三方
 * 虚拟列表库 —— 为了一个窗口计算加一个依赖不划算，也避免给现有安装多加一次 npm ci。
 *
 * 布局约定（配合 mobile.css 的 .m-virtual / .m-virtual-window）：
 *
 *   <div ref={ref} className="m-virtual" style={{height: total}}>
 *     <div className="m-virtual-window" style={{transform: `translateY(${offsetY}px)`}}>
 *       {rows.slice(start, end).map(...)}
 *     </div>
 *   </div>
 *
 * 两套 API：
 *   · `useVirtualWindow` —— **等高**行，最省事，任务列表用它；
 *   · `useVirtualRows`   —— **变高**行，日志用它。
 *
 * 日志为什么必须支持变高：rich 会把超过约 151 列的正文 fold 成多行，回溯信息
 * （traceback）本身就是多行，而 `logger.hr` 的分割线行在 PC 样式里还带上下外边距。
 * 按定高 18px 渲染会让这些行**溢出并与下一行叠字**。所以行高由内容行数算出来，
 * 偏移用前缀和二分查表 —— 与等高版一样快，只是多算 400 个整数的前缀和。
 */
import { useEffect, useMemo, useRef, useState } from 'react'

export interface VirtualWindow {
  /** 窗口内第一行的全局下标 */
  start: number
  /** 窗口结束下标（不含） */
  end: number
  /** 窗口相对列表顶部的像素偏移，直接喂给 translateY */
  offsetY: number
  /** 撑开滚动条用的总高度 */
  totalHeight: number
}

/**
 * 纯计算：给定滚动位置求渲染窗口。
 *
 * @param count 行数
 * @param rowHeight 固定行高（px）
 * @param scrolled 列表顶部已经滚出视口顶部的距离（px，负数按 0 处理）
 * @param viewportHeight 视口高度（px）
 * @param overscan 视口外上下各多渲染几行，避免快速滚动露白
 */
export function virtualWindow(
  count: number,
  rowHeight: number,
  scrolled: number,
  viewportHeight: number,
  overscan = 6,
): VirtualWindow {
  const totalHeight = Math.max(0, count * rowHeight)
  if (count <= 0 || rowHeight <= 0) {
    return {start: 0, end: 0, offsetY: 0, totalHeight}
  }
  const first = Math.floor(Math.max(0, scrolled) / rowHeight)
  const visible = Math.ceil(Math.max(0, viewportHeight) / rowHeight) + 1
  /* start 必须夹在 [0, count-1]：滚动越界时（回弹、列表变短、scrollTop 过大）
     first - overscan 会超过 count，窗口就倒挂了 —— slice(start, end) 变成空数组，
      整个列表渲染成一片空白。夹住之后窗口永远至少有一行。 */
  const start = Math.max(0, Math.min(first - overscan, count - 1))
  const end = Math.min(count, Math.max(start + 1, first + visible + overscan))
  return {start, end, offsetY: start * rowHeight, totalHeight}
}

/** 变高版：`prefix[i]` 是第 i 行**之前**的累计高度，长度 = 行数 + 1。 */
export function variablePrefix(heights: number[]): number[] {
  const prefix = new Array<number>(heights.length + 1)
  prefix[0] = 0
  for (let index = 0; index < heights.length; index += 1) {
    prefix[index + 1] = prefix[index] + Math.max(0, heights[index])
  }
  return prefix
}

/** 变高版的纯计算：二分找首行，再顺序找末行。 */
export function variableWindow(
  prefix: number[],
  scrolled: number,
  viewportHeight: number,
  overscan = 6,
): VirtualWindow {
  const count = prefix.length - 1
  const totalHeight = prefix[count] ?? 0
  if (count <= 0) return {start: 0, end: 0, offsetY: 0, totalHeight}
  const top = Math.max(0, scrolled)
  /* 行高不等，不能整除定位；二分找第一条底边越过视口顶部的行 */
  let low = 0
  let high = count - 1
  while (low < high) {
    const middle = (low + high) >> 1
    if (prefix[middle + 1] <= top) low = middle + 1
    else high = middle
  }
  const first = low
  const bottom = top + Math.max(0, viewportHeight)
  let last = first
  while (last < count && prefix[last] < bottom) last += 1
  const start = Math.max(0, first - overscan)
  const end = Math.min(count, Math.max(start + 1, last + overscan + 1))
  return {start, end, offsetY: prefix[start], totalHeight}
}

/** 需要虚拟化的行数门槛：低于此值直接全渲染，省掉一层包裹。 */
export const VIRTUAL_THRESHOLD = 50

/**
 * 滚动来源。
 *
 *   `window`    —— 页面本身在滚（大多数列表页）。ref 挂**列表容器**，
 *                  用它与视口顶边的距离算已滚距离。
 *   `container` —— 列表在一个固定高度的区域里自己滚（日志页）。
 *                  ref 挂**滚动容器**，直接读它的 scrollTop。
 */
export type VirtualMode = 'window' | 'container'

export interface VirtualOptions {
  /** 视口外上下各多渲染几行，避免快速滚动露白 */
  overscan?: number
  mode?: VirtualMode
}

/** 滚动位置的读取方式：container 读 scrollTop，window 用 getBoundingClientRect。 */
function scrolledIn(element: HTMLElement, mode: VirtualMode): number {
  return mode === 'container' ? element.scrollTop : -element.getBoundingClientRect().top
}

function viewportIn(element: HTMLElement, mode: VirtualMode): number {
  return mode === 'container' ? element.clientHeight : window.innerHeight
}

/** 监听滚动并回调；两套虚拟化 hook 共用同一段绑定/解绑逻辑。 */
function useScrollListener(
  ref: React.RefObject<HTMLDivElement | null>, mode: VirtualMode, onScroll: () => void,
  /** 这些值变化时要重新量一次窗口（行数变多、行高改变、列表被清空…） */
  deps: unknown[],
) {
  const handler = useRef(onScroll)
  handler.current = onScroll
  useEffect(() => {
    let frame = 0
    const schedule = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => { frame = 0; handler.current() })
    }
    handler.current()
    /* container 模式监听容器自己的滚动，window 模式监听页面滚动 */
    const target: HTMLElement | Window = mode === 'container' && ref.current ? ref.current : window
    target.addEventListener('scroll', schedule, {passive: true})
    window.addEventListener('resize', schedule)
    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      target.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, mode, ...deps])
}

/**
 * 跟踪滚动位置并返回渲染窗口（**等高**行）。
 *
 * window 模式用 getBoundingClientRect 而不是 scrollY：页面顶部有固定页眉，用
 * rect.top 算「已经滚过去多少」不需要另行知道页眉高度，也不会被 safe-area 影响。
 * container 模式则必须用 scrollTop，因为页面根本不滚（日志页是整屏自适应的）。
 *
 * 行数不到 VIRTUAL_THRESHOLD 时直接全量渲染。
 */
export function useVirtualWindow(count: number, rowHeight: number, options: VirtualOptions = {}) {
  const {overscan = 6, mode = 'window'} = options
  const ref = useRef<HTMLDivElement>(null)
  const virtualized = count >= VIRTUAL_THRESHOLD
  const [window_, setWindow] = useState<VirtualWindow>(() => ({
    start: 0, end: count, offsetY: 0, totalHeight: Math.max(0, count * rowHeight),
  }))

  useScrollListener(ref, mode, () => {
    const element = ref.current
    if (!element) return
    if (!virtualized) {
      setWindow(current => (current.start === 0 && current.end === count
        ? current : {start: 0, end: count, offsetY: 0, totalHeight: Math.max(0, count * rowHeight)}))
      return
    }
    const next = virtualWindow(count, rowHeight, scrolledIn(element, mode), viewportIn(element, mode), overscan)
    setWindow(current => (current.start === next.start && current.end === next.end ? current : next))
  }, [count, rowHeight, overscan, mode])

  return {ref, window: window_, virtualized}
}

/**
 * 跟踪滚动位置并返回渲染窗口（**变高**行，日志页用）。
 *
 * `heights[i]` 是第 i 行的高度；调用方按内容算（日志就是「内容行数 × 行高」）。
 * 行数不到 VIRTUAL_THRESHOLD 时全量渲染，省掉包裹层。
 */
export function useVirtualRows(heights: number[], options: VirtualOptions = {}) {
  const {overscan = 6, mode = 'container'} = options
  const ref = useRef<HTMLDivElement>(null)
  const prefix = useMemo(() => variablePrefix(heights), [heights])
  const count = heights.length
  const virtualized = count >= VIRTUAL_THRESHOLD
  const [window_, setWindow] = useState<VirtualWindow>(() => ({
    start: 0, end: count, offsetY: 0, totalHeight: prefix[count] ?? 0,
  }))

  useScrollListener(ref, mode, () => {
    const element = ref.current
    if (!element) return
    const next = virtualized
      ? variableWindow(prefix, scrolledIn(element, mode), viewportIn(element, mode), overscan)
      : {start: 0, end: count, offsetY: 0, totalHeight: prefix[count] ?? 0}
    setWindow(current => (current.start === next.start && current.end === next.end
      && current.totalHeight === next.totalHeight ? current : next))
  }, [prefix, count, overscan, mode])

  return {ref, window: window_, virtualized}
}
