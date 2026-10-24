import { useState } from 'react'
import { Icon } from '../../../shared/ui/Icon'
export const defaultIntroduction = 'Món ngon quen thuộc, giá sinh viên, phục vụ nhanh tại Hòa Lạc.'
export const defaultCover = '/images/restaurant/default-cover.jpg'
export function RestaurantCover({ source, name }: { source?: string | null; name: string }) {
  const [failed, setFailed] = useState(false)
  const [defaultFailed, setDefaultFailed] = useState(false)
  const safe = source && /^\/api\/v1\/(restaurant-cover-media\/[1-9][0-9]*|owner\/restaurants\/[1-9][0-9]*\/cover-media\/[1-9][0-9]*)$/.test(source)
  const fallback = !safe || failed
  return <div className="storefront-cover">
    {fallback && defaultFailed ? <div className="storefront-cover-art" aria-hidden="true"><Icon name="bowl" /></div>
      : <img src={fallback ? defaultCover : source!} alt={fallback ? 'Ảnh món ăn minh họa' : `Ảnh bìa ${name}`} onError={() => fallback ? setDefaultFailed(true) : setFailed(true)} fetchPriority="high" />}
    {fallback && <span className="storefront-cover-caption">Ảnh minh họa</span>}
  </div>
}
