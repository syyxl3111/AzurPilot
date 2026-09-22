/**
 * 启停悬浮按钮：右下角可拖动、松手吸附左右边缘，位置持久化。
 *
 * 四态分别对应：停止 ▶ / 运行中 ■ / 异常 ▶（危险色）/ 更新中（禁用）。
 * 停止是危险动作 —— 点它先弹确认，避免误触把正在跑的任务掐掉。
 *
 * **不能靠 `onClick`。** `FloatingBubble` 内部用 `@use-gesture` 的 drag，它在 pointerdown
 * 上 `preventDefault()`，浏览器因此不派发 click —— 真实手指/鼠标点下去处理器根本不触发
 * （这就是「点击无反应」的根因，两屏都一样）。所以在按钮上自己判定：
 * **按下 → 抬起，位移小于 8px 才算轻点**；位移大了就是拖动，交给泡泡去吸附。
 * 键盘 Enter/Space 走 `onClick`，用时间戳躲开刚刚那次轻点，避免重复触发。
 *
 * **启停中要转圈并失效**（`busy`）：后端拉起/回收工作进程要好几秒，不转圈用户不知道
 * 点没点上，不失效就会连点 —— 后端那边是加锁的，第二次只会吃一个报错。
 *
 * 取色用 PC 的主按钮令牌 `--theme-primary-bg` / `--theme-on-accent`，而不是
 * `--accent`：深色下 `--accent` 是浅蓝 #64aaff，白图标压上去只有 2.40:1；PC 的
 * 主按钮令牌在两套主题下都是 #0071e3 + 白字（4.70:1）。
 */
import { FloatingBubble, SpinLoading } from 'antd-mobile'
import { Play, Square } from 'lucide-react'
import { useRef, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import type { Status } from '../../api/types'
import type { MobileTranslator } from '../i18n'

interface Props {
  status: Status
  busy: boolean
  /**
   * 状态是否已知（总览还没拉到时为 false）。
   *
   * 状态未知时按 `stopped` 渲染会让运行中的实例显示成「已停止」，点下去吃一个
   * `INSTANCE_RUNNING` 报错。PC 的 `RightRail` 也是 `disabled={!data || busy}`。
   */
  enabled?: boolean
  onToggle: () => void
  ui: MobileTranslator
}

/** 初始贴在右下、Tab 栏之上；拖动后由 magnetic="x" 吸附到最近的左右边缘。 */
const POSITION = {
  '--initial-position-right': '16px',
  '--initial-position-bottom': '84px',
  '--size': '56px',
  '--edge-distance': '16px',
  '--z-index': '10',
} as CSSProperties

/** 位移超过这个像素数就算拖动，不算轻点。 */
const TAP_SLOP = 8

export function StartStopFab({status, busy, enabled = true, onToggle, ui}: Props) {
  const running = status === 'running'
  const updating = status === 'updating'
  const disabled = busy || updating || !enabled
  const origin = useRef<{x: number; y: number} | null>(null)
  const tappedAt = useRef(0)
  /* 启停中都按「点下去会发生什么」来标无障碍名，读屏用户也能听出正在忙 */
  const label = busy
    ? (running ? ui('mobile.fab.stopping') : ui('mobile.fab.starting'))
    : running ? ui('mobile.fab.stop') : ui('mobile.fab.start')

  function down(event: ReactPointerEvent<HTMLButtonElement>) {
    origin.current = {x: event.clientX, y: event.clientY}
  }

  function up(event: ReactPointerEvent<HTMLButtonElement>) {
    const start = origin.current
    origin.current = null
    if (!start || disabled) return
    /* 拖动了就不当轻点，交给泡泡吸附 */
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > TAP_SLOP) return
    tappedAt.current = Date.now()
    onToggle()
  }

  /* 键盘 Enter / Space 会派发 click。刚被 pointerup 处理过就忽略，免得触发两次。 */
  function click() {
    if (disabled || Date.now() - tappedAt.current < 400) return
    onToggle()
  }

  return <FloatingBubble axis="xy" magnetic="x" style={POSITION}>
    <button type="button" disabled={disabled}
      onPointerDown={down} onPointerUp={up} onClick={click}
      aria-label={label} aria-busy={busy}
      data-busy={busy ? 'on' : 'off'}
      style={{
        width: '100%', height: '100%', border: 0, borderRadius: '50%',
        cursor: disabled ? 'default' : 'pointer',
        display: 'grid', placeItems: 'center',
        color: 'var(--theme-on-accent)',
        background: status === 'error' ? 'var(--theme-danger)' : 'var(--theme-primary-bg)',
        opacity: disabled ? 0.6 : 1,
        boxShadow: '0 6px 18px rgba(0,0,0,.18)',
      }}>
      {busy
        ? <SpinLoading color="currentColor" style={{'--size': '24px'} as CSSProperties} />
        : running ? <Square size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
    </button>
  </FloatingBubble>
}
