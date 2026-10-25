import { useRef, useState } from 'react'
import { RestaurantImageCropper } from './RestaurantImageCropper'
export function RestaurantImagePicker({ avatar = false, busy, file, onFile, onClear }: {
  avatar?: boolean; busy: boolean; file: File | null; onFile: (file: File) => void; onClear: () => void
}) {
  const input = useRef<HTMLInputElement>(null)
  const [error, setError] = useState(''), [original, setOriginal] = useState<File | null>(null), [crop, setCrop] = useState<File | null>(null)
  const kind = avatar ? 'avatar' : 'cover'
  function select(f?: File) {
    if (!f) return
    if (!['image/jpeg', 'image/png'].includes(f.type) || !f.size || f.size > 5242880) { setError('Chọn ảnh JPEG/PNG từ 1 byte đến 5 MiB.'); return }
    setError(''); setCrop(f)
  }
  return <div className="owner-upload" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if (!busy) select(e.dataTransfer.files[0]) }}>
    <label htmlFor={`restaurant-${kind}-file`}>{avatar ? 'Avatar quán · khung vuông 1:1' : 'Ảnh bìa · khung ngang 3:1'}</label>
    <p>Kéo ảnh vào đây hoặc chọn từ thiết bị. JPEG, PNG · tối đa 5 MiB · 4096 × 4096 px.</p>
    <button type="button" className="owner-outline" disabled={busy} onClick={() => input.current?.click()}>{avatar ? 'Chọn avatar' : 'Chọn ảnh'}</button>
    <input hidden ref={input} id={`restaurant-${kind}-file`} type="file" accept="image/jpeg,image/png" aria-invalid={Boolean(error)} aria-describedby={`${kind}-help`} onChange={e => { select(e.target.files?.[0]); e.target.value = '' }} />
    <p id={`${kind}-help`} role={error ? 'alert' : undefined}>{error || file?.name}</p>
    {original && file && <button type="button" disabled={busy} onClick={() => setCrop(original)}>Chỉnh lại vùng cắt {avatar ? 'avatar' : 'ảnh bìa'}</button>}
    <button type="button" disabled={busy} onClick={() => { onClear(); setError(''); setOriginal(null) }}>{avatar ? 'Bỏ avatar' : 'Dùng ảnh mặc định'}</button>
    {crop && <RestaurantImageCropper file={crop} avatar={avatar} onCancel={() => setCrop(null)} onApply={f => { setOriginal(crop); onFile(f); setCrop(null) }} />}
  </div>
}
