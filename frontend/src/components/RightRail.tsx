import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarClock, ChevronLeft, ChevronRight, CirclePlay, Clock3, Hourglass, ListTodo, Play, Square, TriangleAlert, X } from 'lucide-react'
import { api } from '../api/client'
import type { Overview } from '../api/types'
import { useApp, useConnection } from '../app/context'
import { editor } from '../config/editors'

const taskStateLabel = {
  running: '正在运行',
  pending: '待运行',
  waiting: '等待中',
} as const

const taskGroups = [
  {state: 'running', label: '正在运行', empty: '当前没有正在运行的任务', icon: CirclePlay},
  {state: 'pending', label: '待运行', empty: '当前没有待运行任务', icon: ListTodo},
  {state: 'waiting', label: '等待中', empty: '当前没有等待中的任务', icon: Hourglass},
] as const

export function RightRail({
  instance,
  collapsed = false,
  onToggleCollapse,
  onMobileClose,
}: {
  instance: string
  collapsed?: boolean
  onToggleCollapse?: () => void
  onMobileClose: () => void
}) {
  const connection = useConnection()
  const {notify} = useApp()
  const [data, setData] = useState<Overview>()
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (connection !== 'ready') return
    let active = true
    void api.request('overview.get', {instance})
      .then(value => { if (active) setData(value) })
      .catch(error => notify((error as Error).message, true))
    return () => { active = false }
  }, [connection, instance, notify])

  useEffect(() => api.onEvent(event => {
    if (event.topic !== 'overview') return
    const next = event.data as Overview
    if (next.instance === instance) setData(next)
  }), [instance])

  async function toggleScheduler() {
    if (!data) return
    setBusy(true)
    try {
      if (data.status !== 'running') await editor(`config:${instance}`).settled()
      const next = await api.request(data.status === 'running' ? 'scheduler.stop' : 'scheduler.start', {instance})
      setData(next)
      notify(data.status === 'running' ? '调度器已停止' : '调度器已启动')
    } catch (error) {
      notify((error as Error).message, true)
    } finally {
      setBusy(false)
    }
  }

  const running = data?.tasks.filter(task => task.state === 'running').length ?? 0
  const pending = data?.tasks.filter(task => task.state === 'pending').length ?? 0
  const waiting = data?.tasks.filter(task => task.state === 'waiting').length ?? 0

  return <aside className={`right-rail ${collapsed ? 'collapsed' : ''}`} aria-label="调度与任务">
    {onToggleCollapse && (
      <button
        className="rail-edge-toggle"
        aria-label={collapsed ? '展开调度与任务' : '收起调度与任务'}
        title={collapsed ? '展开调度与任务' : '收起调度与任务'}
        onClick={onToggleCollapse}
      >
        {collapsed ? <ChevronLeft size={16}/> : <ChevronRight size={16}/>}
      </button>
    )}
    <div className="right-rail-header">
      <div>
        <span className="right-rail-eyebrow">实例工作区</span>
        <strong>{instance}</strong>
      </div>
      <button className="mobile-rail-close icon-button" aria-label="关闭调度与任务" onClick={onMobileClose}><X size={18}/></button>
    </div>

    <section className="scheduler-widget" aria-label="调度器">
      <div className="scheduler-widget-heading">
        <div><CalendarClock size={17}/><span>调度器</span></div>
        <span className={`scheduler-status ${data?.status === 'running' ? 'running' : ''}`}>
          {data?.status === 'running' ? <CirclePlay size={13}/> : data?.status === 'error' ? <TriangleAlert size={13}/> : <Square size={12}/>} 
          {data?.status === 'running' ? '运行中' : data?.status === 'error' ? '异常' : '已停止'}
        </span>
      </div>
      <div className="scheduler-stats">
        <div><span>正在运行</span><strong>{running}</strong></div>
        <div><span>待运行</span><strong>{pending}</strong></div>
        <div><span>等待中</span><strong>{waiting}</strong></div>
      </div>
      <button
        className={`button scheduler-toggle ${data?.status === 'running' ? 'danger' : 'primary'}`}
        onClick={toggleScheduler}
        disabled={!data || busy || connection !== 'ready'}
      >
        {data?.status === 'running' ? <Square size={14}/> : <Play size={14}/>} {busy ? '正在处理…' : data?.status === 'running' ? '停止运行' : '启动调度器'}
      </button>
    </section>

    <section className="rail-schedule" aria-label="任务计划">
      <div className="rail-section-heading">
        <div><Clock3 size={15}/><span>任务计划</span></div>
        <span>{data?.tasks.length ?? 0}</span>
      </div>
      <div className="rail-task-list">
        {data?.tasks.length ? taskGroups.map(group => {
          const tasks = data.tasks.filter(task => task.state === group.state)
          const GroupIcon = group.icon
          return <section className={`rail-queue-group ${group.state}`} key={group.state} aria-label={group.label}>
            <div className="rail-queue-heading">
              <div><GroupIcon size={16}/><strong>{group.label}</strong></div>
              <span>{tasks.length}</span>
            </div>
            <div className="rail-queue-body">
              {tasks.length ? tasks.map(task => <Link key={task.name} className="rail-task-item" to={`/i/${instance}/task/${task.name}`} onClick={onMobileClose}>
                <div>
                  <strong>{task.label}</strong>
                  <small>{task.state === 'running' ? '正在执行' : task.state === 'pending' ? '等待运行' : task.nextRun.slice(5, 16)}</small>
                </div>
                <span className={`task-state ${task.state}`}><GroupIcon size={12}/>{taskStateLabel[task.state]}</span>
                <ChevronRight size={13}/>
              </Link>) : <div className="rail-queue-empty">{group.empty}</div>}
            </div>
          </section>
        }) : <div className="rail-empty">暂无已启用任务</div>}
      </div>
    </section>
  </aside>
}
