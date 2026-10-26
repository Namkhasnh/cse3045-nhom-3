import { useState } from 'react'
import { RestaurantAvatar } from './RestaurantAvatar'
import { Icon } from '../../../shared/ui/Icon'
import { Button } from '../../../shared/ui/Button'
import { ListState } from '../../../shared/ui/ListState'
import { formatVnd } from '../../../shared/lib/format'
import { summary, type Restaurant } from '../api/catalog.api'
import { useCatalog } from '../hooks/use-catalog'
import type { RestaurantFilterValues } from '../types'
function HomeRestaurantImage({ source, name }: { source?: string | null; name: string }) {
  const [failed, setFailed] = useState(false)
  return source && !failed
    ? <img src={source} alt={`Ảnh bìa ${name}`} loading="lazy" onError={() => setFailed(true)} />
    : <div className="home-restaurant-placeholder" role="img" aria-label={`Chưa có ảnh quán ${name}`}><Icon name="bowl" /><span>Chưa có ảnh quán</span></div>
}
export function HomeRestaurants({ filters, onReset }: { filters: RestaurantFilterValues; onReset: () => void }) {
  const catalog = useCatalog<Restaurant>(filters)
  const hasFilters = Boolean(filters.query || filters.category !== 'all' || filters.priceRange !== 'all')
  return <section id="restaurants" className="home-restaurant-section section design-container" aria-labelledby="restaurant-title">
    <div className="section-heading section-heading--inline"><div><span className="kicker">Quanh khuôn viên</span><h2 id="restaurant-title">Khám phá quán ăn quanh VJU</h2></div><p>Xem giờ mở cửa, giá món và thực đơn của quán.</p></div>
    <p className="home-result-count" role="status" aria-live="polite">{catalog.status === 'ready' ? `Đã tải ${catalog.data.length} quán${hasFilters ? ' phù hợp' : ''}` : catalog.status === 'loading' ? 'Đang tải danh sách quán…' : ''}</p>
    {catalog.status === 'error' ? <ListState error title="Chưa tải được danh sách quán" action="Thử lại" onAction={catalog.retry}>Kiểm tra kết nối và thử lại. Các bộ lọc của bạn vẫn được giữ.</ListState>
      : catalog.status === 'loading' ? <div className="home-restaurant-grid" aria-busy="true">{[0, 1, 2].map(n => <div key={n} className="home-restaurant-card skeleton" />)}</div>
      : !catalog.data.length ? <ListState title={hasFilters ? 'Chưa tìm thấy quán phù hợp' : 'Chưa có quán trong danh sách'} action={hasFilters ? 'Xóa bộ lọc' : undefined} onAction={onReset}>Các quán sẽ xuất hiện khi sẵn sàng công khai. Bạn có thể thử từ khóa hoặc bộ lọc khác.</ListState>
      : <div className="home-restaurant-grid" tabIndex={0} aria-label="Danh sách quán ăn, có thể cuộn ngang trên điện thoại">{catalog.data.map(restaurant => {
        const row = summary(restaurant)
        return <article className="home-restaurant-card" key={restaurant.id}>
          <HomeRestaurantImage key={row.imageSrc} source={row.imageSrc} name={restaurant.name} />
          <div className="home-restaurant-shade" /><div className="home-restaurant-content">
            <div className="home-restaurant-meta"><span><i />{!restaurant.is_open ? 'Đã đóng cửa' : restaurant.is_accepting_orders ? 'Đang nhận đơn' : 'Tạm ngưng nhận đơn'}</span></div>
            <div className="home-restaurant-identity"><RestaurantAvatar key={restaurant.avatar_image_reference} source={restaurant.avatar_image_reference} name={restaurant.name}/><h3><a href={`/restaurants/${restaurant.id}`}>{restaurant.name}</a></h3></div>
            <p>{row.hours}<br />{restaurant.min_price_vnd === null ? 'Chưa có giá món' : `Món: ${formatVnd(restaurant.min_price_vnd)}${restaurant.max_price_vnd && restaurant.max_price_vnd !== restaurant.min_price_vnd ? ` – ${formatVnd(restaurant.max_price_vnd)}` : ''}`}</p>
            <a href={`/restaurants/${restaurant.id}`}>Xem quán & thực đơn <Icon name="arrow" /></a>
          </div>
        </article>
      })}</div>}
    {catalog.moreError && <p role="alert">Chưa tải được trang tiếp theo. Hãy thử lại.</p>}
    {catalog.hasMore && <Button className="home-load-more" disabled={catalog.loadingMore} onClick={catalog.loadMore}>{catalog.loadingMore ? 'Đang tải…' : 'Tải thêm quán'}</Button>}
  </section>
}
