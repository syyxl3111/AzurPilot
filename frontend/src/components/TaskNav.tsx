import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { NavLink, useLocation, useParams } from 'react-router-dom'
import { Anchor, CalendarDays, ChevronRight, Compass, Gift, Palmtree, Search, Settings2, Ship, Sparkles, Swords, Wrench, type LucideIcon } from 'lucide-react'
import { useApp } from '../app/context'

const groupIcons: Record<string, LucideIcon> = {
  Alas: Settings2, Farm: Swords, Event: Sparkles, EventDaily: CalendarDays,
  Reward: Gift, DailyMission: CalendarDays, Opsi: Compass, Island: Palmtree, FleetManagement: Ship, Tool: Wrench,
}

export function TaskNav({ defaultOpenKey }: { defaultOpenKey?: string } = {}) {
  const { schema, t } = useApp()
  const { instance } = useParams()
  const location = useLocation()
  const base = instance ? `/i/${instance}` : ''

  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [openMenuKey, setOpenMenuKey] = useState<string | null>(defaultOpenKey ?? null)
  const [flyoutTop, setFlyoutTop] = useState(0)

  const navContainerRef = useRef<HTMLDivElement>(null)
  const flyoutRef = useRef<HTMLDivElement>(null)
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cancelClose = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }, [])

  const scheduleClose = useCallback(() => {
    cancelClose()
    closeTimerRef.current = setTimeout(() => {
      setOpenMenuKey(null)
    }, 180)
  }, [cancelClose])

  useEffect(() => {
    return () => cancelClose()
  }, [cancelClose])

  // 路由跳转时收起二级菜单
  useEffect(() => {
    cancelClose()
    setOpenMenuKey(null)
  }, [location.pathname, cancelClose])

  // 点击外部收起
  useEffect(() => {
    if (!openMenuKey) return
    const handleOutsidePointer = (event: PointerEvent) => {
      const target = event.target as Node
      if (flyoutRef.current?.contains(target)) return
      const currentBtn = buttonRefs.current[openMenuKey]
      if (currentBtn?.contains(target)) return
      cancelClose()
      setOpenMenuKey(null)
    }
    document.addEventListener('pointerdown', handleOutsidePointer)
    return () => document.removeEventListener('pointerdown', handleOutsidePointer)
  }, [openMenuKey, cancelClose])

  // 按 Escape 收起
  useEffect(() => {
    if (!openMenuKey) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        const keyToFocus = openMenuKey
        cancelClose()
        setOpenMenuKey(null)
        buttonRefs.current[keyToFocus]?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [openMenuKey, cancelClose])

  // 让弹出的子菜单窗口顶部与“父菜单的那一项”的上边缘严格对齐
  const updateFlyoutPosition = useCallback(() => {
    if (!openMenuKey || !flyoutRef.current || !navContainerRef.current) return
    const btn = buttonRefs.current[openMenuKey]
    const flyout = flyoutRef.current
    const container = navContainerRef.current
    if (!btn) return

    const btnRect = btn.getBoundingClientRect()
    const flyoutRect = flyout.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()

    // 父菜单项本身的顶部位置（视口坐标）
    const itemTopInViewport = btnRect.top
    // 子菜单窗口的理想顶部位置（与该父菜单项的上边缘对齐）
    const idealTopInViewport = itemTopInViewport

    // 视口边界保护：距视口顶部/底部至少留 8px
    const minViewportTop = 8
    const maxViewportTop = Math.max(minViewportTop, window.innerHeight - flyoutRect.height - 8)
    const clampedViewportTop = Math.max(minViewportTop, Math.min(idealTopInViewport, maxViewportTop))

    // 转换为定位父容器 (.task-nav-container) 内的 top 偏移
    setFlyoutTop(clampedViewportTop - containerRect.top)
  }, [openMenuKey])

  useLayoutEffect(() => {
    updateFlyoutPosition()
  }, [openMenuKey, updateFlyoutPosition])

  useEffect(() => {
    if (!openMenuKey) return
    window.addEventListener('resize', updateFlyoutPosition)
    const scrollContainer = navContainerRef.current?.querySelector('.task-nav')
    scrollContainer?.addEventListener('scroll', updateFlyoutPosition, { passive: true })
    return () => {
      window.removeEventListener('resize', updateFlyoutPosition)
      scrollContainer?.removeEventListener('scroll', updateFlyoutPosition)
    }
  }, [openMenuKey, updateFlyoutPosition])

  const handleGroupMouseEnter = (key: string) => {
    cancelClose()
    setOpenMenuKey(key)
  }

  const handleGroupMouseLeave = () => {
    scheduleClose()
  }

  const handleFlyoutMouseEnter = () => {
    cancelClose()
  }

  const handleFlyoutMouseLeave = () => {
    scheduleClose()
  }

  // 点击一级菜单处理
  const handleGroupClick = (key: string) => {
    cancelClose()
    setOpenMenuKey(prev => (prev === key ? null : key))
  }

  const activeGroup = schema && openMenuKey ? schema.menu[openMenuKey] : null
  const activeTasks = activeGroup
    ? activeGroup.tasks.filter(
        task =>
          t(`Task.${task}.name`).toLowerCase().includes(search.toLowerCase()) ||
          task.toLowerCase().includes(search.toLowerCase())
      )
    : []

  return (
    <div className="task-nav-container" ref={navContainerRef}>
      <div className="sidebar-label task-nav-heading">任务配置<button className="icon-button" aria-label={searchOpen ? '收起任务搜索' : '展开任务搜索'} aria-expanded={searchOpen} aria-controls="task-search" onClick={() => {setSearchOpen(!searchOpen); setSearch(''); setOpenMenuKey(null)}}><Search size={15}/></button></div>
      {searchOpen && <div className="nav-search" id="task-search">
        <Search size={14} />
        <input
          autoFocus
          aria-label="搜索任务"
          value={search}
          onChange={event => setSearch(event.target.value)}
          placeholder="搜索任务…"
        />
      </div>}

      <nav className="task-nav">
        {schema &&
          Object.entries(schema.menu).map(([key, group]) => {
            const filteredTasks = group.tasks.filter(
              task =>
                t(`Task.${task}.name`).toLowerCase().includes(search.toLowerCase()) ||
                task.toLowerCase().includes(search.toLowerCase())
            )
            if (!filteredTasks.length) return null

            const isGroupActive = group.tasks.some(task =>
              location.pathname.endsWith(`/task/${task}`)
            )
            const isExpanded = openMenuKey === key
            const GroupIcon = groupIcons[key] ?? Anchor

            return (
              <button
                key={key}
                type="button"
                ref={el => {
                  buttonRefs.current[key] = el
                }}
                className={[
                  'task-group-button',
                  isExpanded && 'expanded',
                  isGroupActive && 'active',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onMouseEnter={() => handleGroupMouseEnter(key)}
                onMouseLeave={handleGroupMouseLeave}
                onClick={() => handleGroupClick(key)}
                aria-haspopup="menu"
                aria-expanded={isExpanded}
              >
                <GroupIcon size={18} className="task-group-icon" />
                <span className="task-group-title">{t(`Menu.${key}.name`)}</span>
                <span className="task-group-badge">{filteredTasks.length}</span>
                <ChevronRight size={13} className="task-group-arrow" />
              </button>
            )
          })}
      </nav>

      {openMenuKey && activeGroup && (
        <div
          ref={flyoutRef}
          className="task-submenu-flyout"
          style={{ top: `${flyoutTop}px` }}
          role="menu"
          aria-label={t(`Menu.${openMenuKey}.name`)}
          onMouseEnter={handleFlyoutMouseEnter}
          onMouseLeave={handleFlyoutMouseLeave}
        >
          <div className="task-submenu-list">
            {activeTasks.map(task => (
              <NavLink
                key={task}
                to={`${base}/task/${task}`}
                className={({ isActive }) =>
                  ['task-submenu-item', isActive && 'active'].filter(Boolean).join(' ')
                }
                onClick={() => setOpenMenuKey(null)}
                role="menuitem"
              >
                <span className="task-submenu-dot" />
                <span className="task-submenu-item-text">{t(`Task.${task}.name`)}</span>
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
