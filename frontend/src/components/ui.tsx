import { useEffect, useRef, type ReactNode } from 'react'
import { AlertCircle, LoaderCircle, X } from 'lucide-react'
import type { Status } from '../api/types'

export function StatusBadge({status}: {status: Status}) {
  return <span className={`status ${status}`}><i />{{running: '运行中', stopped: '待命中', error: '需要处理', updating: '更新中'}[status]}</span>
}
export function Empty({icon, title, children}: {icon?: ReactNode; title: string; children?: ReactNode}) {
  return <div className="empty">{icon}<strong>{title}</strong><div>{children}</div></div>
}
export function Loading() { return <div className="loading" role="status"><LoaderCircle className="spin" size={22} />正在加载…</div> }
export function ErrorBox({message, retry}: {message: string; retry?: () => void}) {
  return <div role="alert" className="error-box"><AlertCircle size={18}/><span>{message}</span>{retry && <button onClick={retry}>重试</button>}</div>
}
export function Modal({title, children, onClose}: {title: string; children: ReactNode; onClose: () => void}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => { ref.current?.showModal(); return () => ref.current?.close() }, [])
  return <dialog ref={ref} onCancel={onClose} className="modal">
    <div className="panel-heading"><h2>{title}</h2><button className="icon-button" aria-label="关闭" onClick={onClose}><X size={20}/></button></div>
    {children}
  </dialog>
}
export function PageTitle({title, actions}: {title: string; actions?: ReactNode}) {
  return <div className="page-title"><h1>{title}</h1>{actions && <div className="title-actions">{actions}</div>}</div>
}
