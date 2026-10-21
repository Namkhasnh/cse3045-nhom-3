import { useState } from 'react'
import { Icon } from '../../../shared/ui/Icon'

export function DishImage({ name, source }: { name: string; source: string | null }) {
  const [failed, setFailed] = useState(false)
  // References are untrusted catalog data; only same-origin paths and HTTPS images render.
  const safe = source && (source.startsWith('/') && !source.startsWith('//') && !source.includes('\\') || source.startsWith('https://'))
  return <div className="dish-image">
    {safe && !failed ? <img src={source} alt={`Ảnh món ${name}`} loading="lazy" onError={() => setFailed(true)} />
      : <span className="image-fallback" role="img" aria-label={`Chưa có ảnh món ${name}`}><Icon name="bowl" /><span>Chưa có ảnh món</span></span>}
  </div>
}
