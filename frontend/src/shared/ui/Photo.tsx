import { useState } from 'react'
import { Icon } from './Icon'
export function Photo({ src, alt, eager = false }: { src: string; alt: string; eager?: boolean }) {
  const [failed, setFailed] = useState(false)
  return failed ? <span className="photo-fallback" role="img" aria-label={alt || 'Chưa tải được ảnh minh họa'}><Icon name="bowl" /><span>Chưa tải được ảnh</span></span>
    : <img src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} onError={() => setFailed(true)} />
}
