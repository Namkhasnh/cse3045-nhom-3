import {useCallback, useEffect, useRef, useState} from 'react'
import {createPortal} from 'react-dom'
import {feedbackEvent, feedbackDismissEvent, type FeedbackNotice} from '../lib/feedback'
import {Icon} from './Icon'
import './feedback.css'

type Item = FeedbackNotice & {id: number; token?: number}
function FeedbackCard({item, dismiss}: {item: Item; dismiss: (id: number) => void}) {
  const root = useRef<HTMLDivElement>(null), active = useRef(true), running = useRef(false)
  const [hover, setHover] = useState(false), [focus, setFocus] = useState(false)
  const [busy, setBusy] = useState(false), [failure, setFailure] = useState('')
  const paused = hover || focus || busy || Boolean(failure)
  const remaining = useRef(item.duration ?? (item.tone === 'error' ? 8000 : 5000))
  const close = useCallback(() => {
    if (root.current?.contains(document.activeElement)) item.returnFocus?.()
    dismiss(item.id)
    item.onDismiss?.()
  }, [item, dismiss])
  useEffect(() => {active.current = true; return () => {active.current = false}}, [])
  useEffect(() => {
    if (paused) return
    const start = performance.now()
    const timer = setTimeout(close, remaining.current)
    return () => { clearTimeout(timer); remaining.current = Math.max(0, remaining.current - (performance.now() - start)) }
  }, [paused, close])
  async function select() {
    if (running.current || !item.action) return
    running.current = true; setBusy(true); setFailure('')
    try {await item.action.run(); if (active.current) close()}
    catch (error) {if (active.current) setFailure(error instanceof Error ? error.message : 'Không thể thực hiện. Vui lòng thử lại.')}
    finally {running.current = false; if (active.current) setBusy(false)}
  }
  return <div ref={root} className={`action-toast action-toast--${item.tone}`} aria-label={item.title ? 'Thông báo mới' : 'Phản hồi thao tác'}
    onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
    onFocusCapture={() => setFocus(true)} onBlurCapture={e => {if (!e.currentTarget.contains(e.relatedTarget)) setFocus(false)}}
    onKeyDown={e => {if (e.key === 'Escape') {e.stopPropagation(); close()}}}>
    <span className="action-toast-symbol"><Icon name={item.title ? 'inbox' : item.tone === 'error' ? 'alert' : 'check'}/></span>
    <div className="action-toast-copy">
      <div role={item.tone === 'error' ? 'alert' : 'status'} aria-atomic="true">{item.title && <strong>{item.title}</strong>}<p>{item.message}</p></div>
      {failure && <p className="action-toast-error" role="alert">{failure}</p>}
      {(item.action || item.link) && <div className="action-toast-actions">
        {item.action && <button type="button" disabled={busy} onClick={() => void select()}>{busy ? 'Đang mở…' : failure ? 'Thử lại' : item.action.label}</button>}
        {item.link && <a href={item.link.href}>{item.link.label}</a>}
      </div>}
    </div>
    <button className="action-toast-close" type="button" aria-label="Đóng thông báo" onClick={close}><Icon name="close"/></button>
  </div>
}

export function FeedbackViewport() {
  const [items, setItems] = useState<Item[]>([])
  const sequence = useRef(0)
  const dismiss = useCallback((id: number) => setItems(values => values.filter(value => value.id !== id)), [])
  useEffect(() => {
    const receive = (event: Event) => {
      const detail = (event as CustomEvent<FeedbackNotice & {token?: number}>).detail
      if (!detail || typeof detail.message !== 'string' || !detail.message.trim()) return
      const item = {...detail, id: ++sequence.current}
      setItems(values => [...values, item])
    }
    const cancel = (event: Event) => {
      const token = (event as CustomEvent<number>).detail
      setItems(values => values.filter(value => value.token !== token))
    }
    const clear = () => setItems([])
    window.addEventListener(feedbackEvent, receive)
    window.addEventListener(feedbackDismissEvent, cancel)
    window.addEventListener('pagehide', clear)
    return () => {window.removeEventListener(feedbackEvent, receive); window.removeEventListener(feedbackDismissEvent, cancel); window.removeEventListener('pagehide', clear)}
  }, [])
  return createPortal(<div className="action-toast-stack" aria-label="Thông báo nổi">{items.slice(0, 2).map(item => <FeedbackCard key={item.id} item={item} dismiss={dismiss}/>)}</div>, document.body)
}
