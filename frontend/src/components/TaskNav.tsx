import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { NavLink, useLocation, useParams } from 'react-router-dom'
import { Anchor, CalendarDays, ChevronRight, Compass, Gift, Palmtree, Search, Settings2, Ship, Sparkles, Swords, Wrench, type LucideIcon } from 'lucide-react'
import { useApp } from '../app/context'

const groupIcons: Record<string, LucideIcon> = {
  Alas: Settings2, Farm: Swords, Event: Sparkles, EventDaily: CalendarDays,
  Reward: Gift, DailyMission: CalendarDays, Opsi: Compass, Island: Palmtree, FleetManagement: Ship, Tool: Wrench,
}

export function TaskNav({
  defaultOpenKey,
  onNavigate,
  forceMobile,
}: {
  defaultOpenKey?: string
  onNavigate?: () => void
  forceMobile?: boolean
} = {}) {
  const { schema, t } = useApp()
  const { instance } = useParams()
  const location = useLocation()
  const base = instance ? `/i/${instance}` : ''

  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)

  // 检测是否为移动端视口（<= 950px）
  const [isMobileState, setIsMobileState] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth <= 950
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mql = window.matchMedia('(max-width: 950px)')
    const update = (e: MediaQueryListEvent | MediaQueryList) => setIsMobileState(e.matches)
    update(mql)
    mql.addEventListener('change', update)
    return () => mql.removeEventListener('change', update)
  }, [])

  const isMobile = forceMobile ?? isMobileState

  // 电脑端：向右弹出的二级菜单激活 key
  const [openMenuKey, setOpenMenuKey] = useState<string | null>(defaultOpenKey ?? null)
  const [flyoutTop, setFlyoutTop] = useState(0)

  // 手机端：向下展开的手风琴分组 Set
  const [mobileOpenKeys, setMobileOpenKeys] = useState<Set<string>>(() => {
    const initial = new Set<string>()
    if (defaultOpenKey) initial.add(defaultOpenKey)
    return initial
  })

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

  useEffect(() => () => cancelClose(), [cancelClose])

  // 路由跳转时：电脑端收起弹出层；手机端自动展开当前任务所在分组
  useEffect(() => {
    cancelClose()
    setOpenMenuKey(null)

    if (schema) {
      for (const [key, group] of Object.entries(schema.menu)) {
        if (group.tasks.some(task => location.pathname.endsWith(`/task/${task}`))) {
          setMobileOpenKeys(prev => {
            if (prev.has(key)) return prev
            const next = new Set(prev)
            next.add(key)
            return next
          })
          break
        }
      }
    }
  }, [location.pathname, schema, cancelClose])

  // 电脑端：点击外部收起
  useEffect(() => {
    if (isMobile || !openMenuKey) return
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
  }, [isMobile, openMenuKey, cancelClose])

  // 电脑端：按 Escape 收起
  useEffect(() => {
    if (isMobile || !openMenuKey) return
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
  }, [isMobile, openMenuKey, cancelClose])

  // 电脑端：计算二级悬浮菜单垂直对齐位置
  const updateFlyoutPosition = useCallback(() => {
    if (isMobile || !openMenuKey || !flyoutRef.current || !navContainerRef.current) return
    const btn = buttonRefs.current[openMenuKey]
    const flyout = flyoutRef.current
    const container = navContainerRef.current
    if (!btn) return

    const btnRect = btn.getBoundingClientRect()
    const flyoutRect = flyout.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()

    const idealTopInViewport = btnRect.top
    const minViewportTop = 8
    const maxViewportTop = Math.max(minViewportTop, window.innerHeight - flyoutRect.height - 8)
    const clampedViewportTop = Math.max(minViewportTop, Math.min(idealTopInViewport, maxViewportTop))

    setFlyoutTop(clampedViewportTop - containerRect.top)
  }, [isMobile, openMenuKey])

  useLayoutEffect(() => {
    updateFlyoutPosition()
  }, [updateFlyoutPosition])

  useEffect(() => {
    if (isMobile || !openMenuKey) return
    window.addEventListener('resize', updateFlyoutPosition)
    const scrollContainer = navContainerRef.current?.querySelector('.task-nav')
    scrollContainer?.addEventListener('scroll', updateFlyoutPosition, { passive: true })
    return () => {
      window.removeEventListener('resize', updateFlyoutPosition)
      scrollContainer?.removeEventListener('scroll', updateFlyoutPosition)
    }
  }, [isMobile, openMenuKey, updateFlyoutPosition])

  const handleGroupMouseEnter = (key: string) => {
    if (isMobile) return
    cancelClose()
    setOpenMenuKey(key)
  }

  const handleGroupMouseLeave = () => {
    if (isMobile) return
    scheduleClose()
  }

  const handleFlyoutMouseEnter = () => {
    if (isMobile) return
    cancelClose()
  }

  const handleFlyoutMouseLeave = () => {
    if (isMobile) return
    scheduleClose()
  }

  const handleGroupClick = (key: string) => {
    if (isMobile) {
      setMobileOpenKeys(prev => {
        const next = new Set(prev)
        if (next.has(key)) {
          next.delete(key)
        } else {
          next.add(key)
        }
        return next
      })
    } else {
      cancelClose()
      setOpenMenuKey(prev => (prev === key ? null : key))
    }
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
      <div className="sidebar-label task-nav-heading">
        任务配置
        <button
          className="icon-button"
          aria-label={searchOpen ? '收起任务搜索' : '展开任务搜索'}
          aria-expanded={searchOpen}
          aria-controls="task-search"
          onClick={() => {
            setSearchOpen(!searchOpen)
            setSearch('')
            setOpenMenuKey(null)
          }}
        >
          <Search size={15} />
        </button>
      </div>
      {searchOpen && (
        <div className="nav-search" id="task-search">
          <Search size={14} />
          <input
            autoFocus
            aria-label="搜索任务"
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="搜索任务…"
          />
        </div>
      )}

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
            const isExpanded = isMobile
              ? Boolean(search.trim()) || mobileOpenKeys.has(key)
              : openMenuKey === key
            const GroupIcon = groupIcons[key] ?? Anchor

            return (
              <div key={key} className="task-group">
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
                  aria-haspopup={isMobile ? undefined : 'menu'}
                  aria-expanded={isExpanded}
                >
                  <GroupIcon size={18} className="task-group-icon" />
                  <span className="task-group-title">{t(`Menu.${key}.name`)}</span>
                  <span className="task-group-badge">{filteredTasks.length}</span>
                  <ChevronRight size={13} className="task-group-arrow" />
                </button>

                {/* 手机端：向下展开手风琴 */}
                {isMobile && isExpanded && (
                  <div className="task-group-children" role="group" aria-label={t(`Menu.${key}.name`)}>
                    {filteredTasks.map(task => (
                      <NavLink
                        key={task}
                        to={`${base}/task/${task}`}
                        className={({ isActive }) =>
                          ['task-nav-item', 'task-submenu-item', isActive && 'active'].filter(Boolean).join(' ')
                        }
                        onClick={() => onNavigate?.()}
                      >
                        <span className="task-nav-dot task-submenu-dot" />
                        <span className="task-nav-text task-submenu-item-text">{t(`Task.${task}.name`)}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
      </nav>

      {/* 电脑端：向右弹出二级浮层 */}
      {!isMobile && openMenuKey && activeGroup && (
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
