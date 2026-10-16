import { useState } from 'react'
import { formatDistance, formatVnd } from '../../../shared/lib/format'
import { Badge } from '../../../shared/ui/Badge'
import { Icon } from '../../../shared/ui/Icon'
import type { RestaurantSummary } from '../types'

function RestaurantImage({ restaurant }: { restaurant: RestaurantSummary }) {
  const [failed, setFailed] = useState(false)
  return <div className={`restaurant-image restaurant-image--${restaurant.illustrationTone}`}>
    {restaurant.imageSrc && !failed
      ? <img src={restaurant.imageSrc} alt={`Minh họa món ăn tại ${restaurant.name}`} onError={() => setFailed(true)} />
      : <div className="image-fallback" role="img" aria-label={`Chưa có ảnh quán ${restaurant.name}`}><span><Icon name="bowl" /></span><p>Chưa có ảnh quán</p></div>}
    <span className="image-caption">{restaurant.imageSrc && !failed ? 'Ảnh minh họa' : 'Ảnh thay thế'}</span>
  </div>
}

export function RestaurantCard({ restaurant }: { restaurant: RestaurantSummary }) {
  const status = !restaurant.isOpen
    ? { label: 'Đã đóng cửa', tone: 'neutral' as const }
    : !restaurant.isAcceptingOrders
      ? { label: 'Tạm ngưng nhận đơn', tone: 'warning' as const }
      : { label: 'Đang nhận đơn', tone: 'success' as const }

  return <article className="restaurant-card" aria-labelledby={`restaurant-${restaurant.id}`}>
    <div className="restaurant-cover">
      <RestaurantImage key={restaurant.imageSrc} restaurant={restaurant} />
      <div className="restaurant-status"><Badge tone={status.tone}>{status.label}</Badge></div>
    </div>
    <div className="restaurant-card-content">
      <p className="restaurant-cuisine">{restaurant.cuisine}</p>
      <h3 id={`restaurant-${restaurant.id}`}>{restaurant.name}</h3>
      <p className="restaurant-description">{restaurant.description}</p>
      <p className="restaurant-hours"><Icon name="clock" /><span>Giờ mở cửa: {restaurant.hours}</span></p>
      <div className="restaurant-delivery">
        <span className={restaurant.deliveryFeeVnd === null ? 'unknown-fee' : 'known-fee'}>
          <Icon name="delivery" />
          {restaurant.deliveryFeeVnd === null ? 'Chưa xác định phí giao' : `Giao ${formatVnd(restaurant.deliveryFeeVnd)}`}
        </span>
        {restaurant.distanceMetres !== null && (
          <span className="restaurant-distance"><Icon name="pin" />{formatDistance(restaurant.distanceMetres)}</span>
        )}
      </div>
      <p className="fixture-card-note">Thông tin quán & giao hàng là dữ liệu mẫu</p>
    </div>
  </article>
}
