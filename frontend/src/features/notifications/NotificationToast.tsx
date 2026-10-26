import {useEffect, useRef} from 'react'
import {publishFeedback} from '../../shared/lib/feedback'
import type {Notice} from './api'
import type {NoticeBatch} from './use-notification-alerts'

// Feature adapter only: all cards render through the shared viewport.
export function NotificationToast({batch, onClose, onOpen}: {
  batch: NoticeBatch; onClose: () => void; onOpen: (notice: Notice) => Promise<Notice | null>
}) {
  const latest = useRef({onClose, onOpen})
  useEffect(() => {latest.current = {onClose, onOpen}}, [onClose, onOpen])
  useEffect(() => {
    let active = true
    const cancel = publishFeedback({
      message: batch.notice.body, title: batch.notice.title, tone: 'success', duration: 8000,
      onDismiss: () => latest.current.onClose(),
      returnFocus: () => document.querySelector<HTMLButtonElement>('.notification-trigger')?.focus(),
      action: {label: 'Xem chi tiết', run: async () => {
        try {
          const detail = await latest.current.onOpen(batch.notice)
          if (!active) return
          if (!detail) throw new Error('Notification operation busy')
          latest.current.onClose()
          window.location.assign(detail.destination?.href ?? '/notifications?message=' + detail.id)
        } catch {throw new Error('Không thể mở thông báo. Vui lòng thử lại.')}
      }},
      ...(batch.extra > 0 ? {link: {label: `Còn ${batch.extra} thông báo mới`, href: '/notifications'}} : {}),
    })
    return () => {active = false; cancel()}
  }, [batch])
  return null
}
