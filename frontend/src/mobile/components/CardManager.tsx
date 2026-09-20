/**
 * 卡片管理：按 PC `components/ResourceCards.tsx` 的 `ResourceSettings` 重做。
 *
 * 结构、类名、文案与 PC 逐项一致：
 *   「资源卡片」标题 + 提示 + 「恢复默认」 | 已选卡片（抓手图标可拖 + ✕ 移除）
 *   | 「添加卡片」虚线按钮 → 展开可选资源的网格
 *
 * 与 PC 的两处差异：
 *   1. **拖动改用指针事件**。PC 用的是 HTML5 拖放（`draggable` + dragstart/drop），
 *      那套在触屏浏览器上根本不触发 —— 这正是「卡片管理中不能拖动」的原因。
 *      指针事件在触屏和鼠标下都能用，排序算法（move）与 PC 逐字一致。
 *   2. 存储键沿用 PC 的 `azurpilot.resources.<实例>`，**与电脑端互通**：
 *      在电脑上调好的卡片搭配，手机打开就是同一套。
 *
 * 旧版那套「全部 12 项 + 逐行开关」以及 `≡` 抓手（假的、不能拖）已经删掉。
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronDown, GripVertical, Plus, X } from 'lucide-react'
import { useOverlayBack } from '../backGuard'
import { ResourceIcon } from './resourceIcons'
import type { MobileTranslator } from '../i18n'

/** 与 PC 的 defaultResourceKeys 一致：默认只显示四张。 */
export const DEFAULT_RESOURCE_KEYS = ['Oil', 'Coin', 'Gem', 'Cube']

export interface ResourceOption {
  name: string
  label: string
}

interface Props {
  ui: MobileTranslator
  /** 全部可选资源（含显示名） */
  resources: ResourceOption[]
  selected: string[]
  onChange: (keys: string[]) => void
  onClose: () => void
}

export function CardManager({ui, resources, selected, onChange, onClose}: Props) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [draggingKey, setDraggingKey] = useState<string | null>(null)
  /* 拖拽过程中持续重排，所以要用 ref 拿到最新的 selected —— state 在 pointermove
     的高频回调里会读到闭包里的旧值。 */
  const latest = useRef(selected)
  latest.current = selected

  const labelOf = useCallback((key: string) => {
    return resources.find(item => item.name === key)?.label ?? key
  }, [resources])

  /** 与 PC 的 move() 逐字一致：把 fromKey 移到 toKey 的位置。 */
  const move = useCallback((fromKey: string, toKey: string) => {
    if (fromKey === toKey) return
    const keys = [...latest.current]
    const from = keys.indexOf(fromKey)
    const to = keys.indexOf(toKey)
    if (from < 0 || to < 0) return
    const [moved] = keys.splice(from, 1)
    keys.splice(to, 0, moved)
    onChange(keys)
  }, [onChange])

  /* 指针事件拖动：按下时记住 key，移动时若落到另一张卡上就交换位置 */
  function handlePointerDown(key: string) {
    return (event: React.PointerEvent<HTMLDivElement>) => {
      /* 点在 ✕ 上不算拖动 */
      if ((event.target as HTMLElement).closest('.resource-editor-remove')) return
      event.currentTarget.setPointerCapture(event.pointerId)
      setDraggingKey(key)
    }
  }
  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!draggingKey) return
    const element = document.elementFromPoint(event.clientX, event.clientY)
    const overKey = element?.closest('[data-card-key]')?.getAttribute('data-card-key')
    if (overKey && overKey !== draggingKey) move(draggingKey, overKey)
  }
  function endDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    setDraggingKey(null)
  }

  const available = resources.filter(resource => !selected.includes(resource.name))

  return <div className="resource-settings m-card-manager">
    <div className="resource-settings-heading">
      <div>
        <strong>{ui('resource.cards')}</strong>
        <span>{ui('resource.cardsHint')}</span>
      </div>
      <button type="button" className="text-button" onClick={() => onChange(DEFAULT_RESOURCE_KEYS)}>
        {ui('resource.restoreDefault')}
      </button>
    </div>

    <div className="resource-card-editor m-card-editor">
      {selected.map(key => <div key={key} data-card-key={key}
        className={`resource-editor-card${draggingKey === key ? ' dragging' : ''}`}
        onPointerDown={handlePointerDown(key)}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}>
        <span className="resource-editor-grip" aria-hidden="true"><GripVertical size={16} /></span>
        <span className="resource-editor-icon resource-editor-icon-image">
          <ResourceIcon resourceKey={key} size={30} />
        </span>
        <span className="resource-editor-label">{labelOf(key)}</span>
        <button type="button" className="resource-editor-remove"
          aria-label={ui('resource.remove', {label: labelOf(key)})}
          title={ui('resource.remove', {label: labelOf(key)})}
          onClick={() => onChange(selected.filter(item => item !== key))}>
          <X size={15} />
        </button>
      </div>)}

      <button type="button" className={`resource-editor-card resource-editor-add${pickerOpen ? ' open' : ''}`}
        aria-expanded={pickerOpen} onClick={() => setPickerOpen(open => !open)}>
        <span className="resource-editor-add-icon"><Plus size={18} /></span>
        <span>{ui('resource.addCard')}</span>
        <ChevronDown size={15} className="m-card-add-chevron" />
      </button>
    </div>

    {pickerOpen && <div className="resource-picker">
      {available.length
        ? <div className="resource-picker-grid m-card-picker">
          {available.map(resource => <button type="button" key={resource.name} className="resource-picker-card"
            onClick={() => onChange([...selected, resource.name])}>
            <span className="resource-editor-icon resource-editor-icon-image">
              <ResourceIcon resourceKey={resource.name} size={28} />
            </span>
            <span>{resource.label}</span>
            <Plus size={15} />
          </button>)}
        </div>
        : <div className="resource-picker-empty">{ui('resource.allAdded')}</div>}
    </div>}

    <div className="m-card-manager-foot">
      <button type="button" className="button primary" onClick={onClose}>{ui('mobile.overview.cardsDone')}</button>
    </div>
  </div>
}

/**
 * 卡片管理弹层：PC 的卡片管理是嵌在实例设置面板里的，手机端用一个底部弹层承载。
 * 打开时挂 useOverlayBack，让 Android 的返回手势先关它。
 */
export function CardManagerSheet({visible, onClose, children, ui}: {
  visible: boolean
  onClose: () => void
  children: React.ReactNode
  ui: MobileTranslator
}) {
  useOverlayBack(visible, onClose)
  useEffect(() => {
    if (!visible) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [visible])
  if (!visible) return null
  return <div className="m-sheet" role="dialog" aria-modal="true">
    <button type="button" className="m-sheet-mask" aria-label={ui('common.close')} onClick={onClose} />
    <div className="m-sheet-body">{children}</div>
  </div>
}
