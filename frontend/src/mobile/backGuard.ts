/**
 * 返回行为：Android 返回手势 / 浏览器后退键的统一处理。
 *
 * 手机端有两个容易踩的坑，这里一起收掉：
 *
 *   1. **深链进入的子页面按返回会直接退出应用。** 页眉的返回箭头原先只会
 *      改本地 state，Android 的返回手势落在 WebView 上就变成了「关掉页面」。
 *      goBack() 优先走真正的历史返回，栈里确实没有上一页时才回退到调用方
 *      给的兜底路径 —— 不用 location.replace()，那会抹掉是用户前进还是后退。
 *
 *   2. **弹层打开时按返回会离开当前页。** 弹层应该是返回的第一个消费对象。
 *      useOverlayBack 在弹层打开时压入一条历史记录，返回键先吃掉这一条来关弹层。
 *
 * 弹层之间会**交接**（抽屉里点「关于」＝ 同一个 tick 里关抽屉、开模态）。这种情况
 * 不能各自压一条历史再各自弹一条：抽屉卸载时发出的 history.back() 是异步的，会落在
 * 模态刚压入的那条记录上，于是 popstate 立刻把模态也关掉 —— 表现为「点关于没反应」。
 *
 * 因此历史记录按**同时打开的弹层深度**记账，而不是每个弹层一条：
 *   - depth 0 → 1 时压入一条；
 *   - 卸载时若 depth 已归零，**延迟到下一个宏任务**再补退，因为同一批 effect 里
 *     可能紧接着就打开了下一个弹层；期间只要有人再次压入就取消补退。
 *
 * 判定逻辑抽成纯函数（hasHistoryEntry），因为 vitest 没有 jsdom，DOM 部分只能靠
 * E2E 覆盖。
 */
import { useEffect, useRef } from 'react'

const MARKER = 'azurpilotOverlay'

/** 当前同时打开的弹层数。只有 0 → 1 才压历史记录。 */
let depth = 0
/** 待执行的补退定时器；同一批 effect 里又开了新弹层就取消它。 */
let pendingPop: number | null = null

/** react-router v7 会在 history.state 上维护 idx：>0 说明栈里确实有上一页。 */
export function hasHistoryEntry(state: unknown): boolean {
  if (!state || typeof state !== 'object') return false
  const idx = (state as {idx?: unknown}).idx
  return typeof idx === 'number' && idx > 0
}

function isOverlayEntry(state: unknown): boolean {
  return Boolean(state && typeof state === 'object' && (state as Record<string, unknown>)[MARKER])
}

function cancelPendingPop(): void {
  if (pendingPop === null) return
  window.clearTimeout(pendingPop)
  pendingPop = null
}

/**
 * 补退那条已经没人消费的弹层历史记录。
 *
 * 必须延迟：React 在同一批提交里先跑完所有 cleanup 再跑所有 effect，所以
 * 「关抽屉 + 开关于」会在微任务边界之前把 depth 又抬回 1。等到宏任务再判断，
 * 才知道这条记录到底还有没有人要。
 */
function schedulePendingPop(): void {
  if (pendingPop !== null) return
  pendingPop = window.setTimeout(() => {
    pendingPop = null
    if (depth === 0 && isOverlayEntry(window.history.state)) window.history.back()
  }, 0)
}

/**
 * 返回上一页。
 *
 * @param fallback 历史栈里没有上一页时（例如直接打开深链）的去处。
 */
export function goBack(fallback: () => void): void {
  if (hasHistoryEntry(window.history.state)) {
    window.history.back()
    return
  }
  fallback()
}

/**
 * 让打开中的弹层消费一次系统返回。
 *
 * @param visible 弹层是否可见；可见时压入一条历史记录（若当前没有别的弹层）。
 * @param onClose 返回键触发时的关闭回调。
 */
export function useOverlayBack(visible: boolean, onClose: () => void): void {
  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    if (!visible) return
    /* 有人要接管这次返回，取消上一次卸载排下的补退 */
    cancelPendingPop()

    const ownEntry = depth === 0
    depth += 1
    if (ownEntry) window.history.pushState({[MARKER]: true}, '')

    /* consumed 区分「返回键关的」与「页内按钮关的」：
       前者历史已经退回去了，后者还需要我们补退一次。 */
    let consumed = false
    const onPop = () => {
      if (consumed) return
      consumed = true
      close.current()
    }
    window.addEventListener('popstate', onPop)

    return () => {
      window.removeEventListener('popstate', onPop)
      depth = Math.max(0, depth - 1)
      if (!consumed && depth === 0) schedulePendingPop()
    }
  }, [visible])
}
