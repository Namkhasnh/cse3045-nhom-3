import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { cropRectangle, type CropPosition } from '../image-crop'
import '../image-crop.css'

export function RestaurantImageCropper({ file, avatar, onCancel, onApply }: {
  file: File; avatar: boolean; onCancel: () => void; onApply: (file: File) => void
}) {
  const dialog = useRef<HTMLDialogElement>(null), image = useRef<HTMLImageElement>(null)
  const drag = useRef<{ x: number; y: number; position: CropPosition } | null>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [position, setPosition] = useState<CropPosition>({ zoom: 1, x: 50, y: 50 })
  const [error, setError] = useState(''), [busy, setBusy] = useState(false)
  const lock = useRef(false), alive = useRef(true), aspect = avatar ? 1 : 3
  useEffect(() => {
    alive.current = true
    const previous = document.activeElement as HTMLElement | null, overflow = document.body.style.overflow
    dialog.current?.showModal(); document.body.style.overflow = 'hidden'
    const source = URL.createObjectURL(file)
    if (image.current) image.current.src = source
    return () => { alive.current = false; URL.revokeObjectURL(source); document.body.style.overflow = overflow; previous?.focus() }
  }, [file])
  const rect = size.width ? cropRectangle(size.width, size.height, aspect, position) : null
  async function apply() {
    if (!rect || !image.current || lock.current || error) return
    lock.current = true; setBusy(true)
    try {
      const canvas = document.createElement('canvas')
      canvas.width = Math.min(avatar ? 512 : 1800, Math.floor(rect.width))
      canvas.height = Math.max(1, Math.round(canvas.width / aspect))
      const context = canvas.getContext('2d'); if (!context) throw new Error()
      // Preserve transparency for PNG. The server still sanitizes the final upload.
      context.drawImage(image.current, rect.x, rect.y, rect.width, rect.height, 0, 0, canvas.width, canvas.height)
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error()), file.type, .92))
      if (!blob.size || blob.size > 5242880) throw new Error()
      if (alive.current) onApply(new File([blob], avatar ? 'avatar-quan.' + (file.type === 'image/png' ? 'png' : 'jpg') : 'bia-quan.' + (file.type === 'image/png' ? 'png' : 'jpg'), { type: file.type }))
    } catch { if (alive.current) setError('Chưa cắt được ảnh. Hãy chọn ảnh khác và thử lại.') }
    finally { lock.current = false; if (alive.current) setBusy(false) }
  }
  return createPortal(<dialog className="restaurant-crop-dialog" ref={dialog} aria-labelledby="restaurant-crop-title" aria-describedby="restaurant-crop-help" onCancel={e => { e.preventDefault(); if (!busy) onCancel() }}>
    <h2 id="restaurant-crop-title">{avatar ? 'Cắt avatar quán · 1:1' : 'Cắt ảnh bìa · 3:1'}</h2>
    <p id="restaurant-crop-help">Kéo ảnh để chọn vùng giữ lại. Bạn cũng có thể dùng các thanh điều chỉnh bên dưới.</p>
    <div className="restaurant-crop-frame" style={{ aspectRatio: aspect, width: avatar ? 'min(100%, 40dvh)' : '100%' }}
      onPointerDown={e => { if (!rect || busy) return; e.currentTarget.setPointerCapture(e.pointerId); drag.current = { x: e.clientX, y: e.clientY, position } }}
      onPointerMove={e => {
        if (!drag.current || !rect || busy) return
        const bounds = e.currentTarget.getBoundingClientRect(), start = drag.current
        setPosition({ ...start.position, x: Math.max(0, Math.min(100, start.position.x - (e.clientX - start.x) / bounds.width * rect.width / Math.max(1, size.width - rect.width) * 100)), y: Math.max(0, Math.min(100, start.position.y - (e.clientY - start.y) / bounds.height * rect.height / Math.max(1, size.height - rect.height) * 100)) })
      }} onPointerUp={() => { drag.current = null }} onPointerCancel={() => { drag.current = null }}>
      <img ref={image} alt="Vùng ảnh sẽ được lưu" draggable={false} onLoad={e => {
        const { naturalWidth: width, naturalHeight: height } = e.currentTarget
        if (!width || !height || width > 4096 || height > 4096 || width * height > 16000000) setError('Ảnh tối đa 4096 × 4096 px và 16 triệu điểm ảnh.')
        else setSize({ width, height })
      }} onError={() => setError('Không đọc được ảnh. Hãy chọn ảnh JPEG hoặc PNG khác.')} style={rect ? { width: size.width / rect.width * 100 + '%', height: size.height / rect.height * 100 + '%', left: -rect.x / rect.width * 100 + '%', top: -rect.y / rect.height * 100 + '%' } : undefined} />
      <div className="restaurant-crop-grid" aria-hidden="true" />
    </div>
    <fieldset disabled={busy || !rect || Boolean(error)}>{([
      ['zoom', 'Phóng to', 1, 4, .01], ['x', 'Vị trí ngang', 0, 100, 1], ['y', 'Vị trí dọc', 0, 100, 1],
    ] as const).map(([key, label, min, max, step]) => <label key={key}>{label}<input type="range" min={min} max={max} step={step} value={position[key]} onChange={e => setPosition(p => ({ ...p, [key]: Number(e.target.value) }))} /></label>)}</fieldset>
    {error && <p role="alert">{error}</p>}
    <div className="restaurant-crop-actions"><button type="button" disabled={busy} onClick={onCancel}>Hủy</button><button type="button" className="button button--primary" disabled={busy || !rect || Boolean(error)} onClick={() => void apply()}>{busy ? 'Đang cắt…' : 'Dùng vùng ảnh này'}</button></div>
  </dialog>, document.body)
}
