import { useState } from 'react'
import { Icon } from '../../../shared/ui/Icon'
import '../image-crop.css'
export function RestaurantAvatar({ source, name }: { source?: string | null; name: string }) {
  const [failed, setFailed] = useState(false)
  return <div className="restaurant-avatar">{source && !failed ? <img src={source} alt={`Avatar ${name}`} onError={() => setFailed(true)} /> : <span role="img" aria-label={`Chưa có avatar ${name}`}><Icon name="shop" /></span>}</div>
}
