import { useEffect, useRef, useState } from 'react'
import { settingsApi, type Settings } from '../api/settings.api'
import { requestMessage } from '../../../shared/api/request'
import { defaultIntroduction, RestaurantCover } from './RestaurantCover'
import '../storefront.css'
import './storefront-form.css'
export function StorefrontForm({ initial, busy, save }: { initial: Settings; busy: boolean; save: (body: object) => Promise<Settings | undefined> }) {
  const [description, setDescription] = useState(initial.description ?? '')
  const [reference, setReference] = useState(initial.cover_image_reference ?? null)
  const [file, setFile] = useState<File | null>(null), [preview, setPreview] = useState('')
  const [uploading, setUploading] = useState(false), [error, setError] = useState('')
  const baseline = useRef(initial), fileInput = useRef<HTMLInputElement>(null), errorRef = useRef<HTMLParagraphElement>(null)
  useEffect(() => {
    const previous = baseline.current
    setDescription(current => current === (previous.description ?? '') ? initial.description ?? '' : current)
    setReference(current => current === (previous.cover_image_reference ?? null) ? initial.cover_image_reference ?? null : current)
    baseline.current = initial
  }, [initial])
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])
  useEffect(() => { if (error) errorRef.current?.focus() }, [error])
  async function submit() {
    if ([...description].length > 2000) { setError('Lời giới thiệu tối đa 2.000 ký tự.'); return }
    setUploading(true); setError('')
    try {
      let next = reference
      if (file) next = (await settingsApi.uploadCover(initial.id, file)).image_reference
      const saved = await save({ description: description.trim() || null, cover_image_reference: next })
      if (saved) { baseline.current = saved; setDescription(saved.description ?? ''); setReference(saved.cover_image_reference ?? null); setFile(null); setPreview(''); if (fileInput.current) fileInput.current.value = '' }
      else if (next !== reference) { setReference(next); setFile(null); setPreview(''); if (fileInput.current) fileInput.current.value = '' }
    } catch (e) { setError(requestMessage(e)) } finally { setUploading(false) }
  }
  const previewSource = reference ? `/api/v1/owner/restaurants/${initial.id}/cover-media/${reference.split('/').at(-1)}` : null
  return <form className="storefront-form" onSubmit={e => { e.preventDefault(); void submit() }}><fieldset disabled={busy || uploading}><legend>Ảnh bìa và giới thiệu quán</legend>
    <p>Thông tin này hiển thị trên trang quán. Để trống để dùng mẫu mặc định.</p>
    {error && <p ref={errorRef} tabIndex={-1} role="alert">{error}</p>}
    <label htmlFor="restaurant-cover-file">Ảnh bìa quán</label><input ref={fileInput} id="restaurant-cover-file" type="file" accept="image/jpeg,image/png" aria-describedby="cover-help" onChange={e => { const selected = e.target.files?.[0] ?? null; setError(''); if (selected && (!['image/jpeg', 'image/png'].includes(selected.type) || selected.size > 5242880)) { setError('Chọn ảnh JPEG/PNG tối đa 5 MiB.'); e.target.value = ''; return }; setFile(selected); setPreview(selected ? URL.createObjectURL(selected) : '') }} />
    <p id="cover-help">JPEG/PNG tối đa 5 MiB, 4096 × 4096 px. Ảnh ngang phù hợp nhất.</p>
    <button type="button" onClick={() => { setReference(null); setFile(null); setPreview(''); setError(''); if (fileInput.current) fileInput.current.value = '' }}>Dùng ảnh mặc định</button>
    <label htmlFor="restaurant-description">Lời giới thiệu</label><textarea id="restaurant-description" rows={4} value={description} placeholder={defaultIntroduction} onChange={e => setDescription(e.target.value)} aria-describedby="description-help" />
    <p id="description-help">{[...description].length}/2.000 ký tự · Văn bản thuần</p>
    <h3>Xem trước</h3><div className="storefront-form-preview">{preview ? <img src={preview} alt="Ảnh bìa đang chọn, chưa lưu" /> : <RestaurantCover key={previewSource} source={previewSource} name={initial.name} />}<div><strong>{initial.name}</strong><p>{description.trim() || defaultIntroduction}</p></div></div>
    <button className="button button--primary" type="submit">{uploading ? 'Đang lưu giới thiệu…' : 'Lưu ảnh bìa và giới thiệu'}</button>
  </fieldset></form>
}
