import { useEffect, useRef, type ReactNode } from 'react'
import { Button } from './Button'

export function ConfirmDialog({ title, children, confirmLabel, cancelLabel = 'Giữ giỏ hiện tại', onConfirm, onCancel }: {
  title: string; children: ReactNode; confirmLabel: string; cancelLabel?: string; onConfirm(): void; onCancel(): void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current!
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    dialog.showModal()
    return () => { dialog.close(); previous?.focus() }
  }, [])
  return <dialog ref={ref} className="confirm-dialog" aria-labelledby="confirm-dialog-title" onCancel={event => { event.preventDefault(); onCancel() }} onKeyDown={event => {
      if (event.key !== 'Tab') return
      const controls = Array.from(ref.current!.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])')).filter(el => el.getClientRects().length > 0)
      const first = controls[0], last = controls.at(-1)
      if (!first || !last) { event.preventDefault(); return }
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }}>
    <h2 id="confirm-dialog-title">{title}</h2>
    {children}
    <div className="cart-actions"><Button variant="neutral" autoFocus onClick={onCancel}>{cancelLabel}</Button><Button onClick={onConfirm}>{confirmLabel}</Button></div>
  </dialog>
}
