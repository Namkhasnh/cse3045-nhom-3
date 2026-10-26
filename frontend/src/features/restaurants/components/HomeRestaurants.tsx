import { RestaurantAvatar } from './RestaurantAvatar'
import { Button } from '../../../shared/ui/Button'
import { ListState } from '../../../shared/ui/ListState'
import { type Restaurant } from '../api/catalog.api'
import { useCatalog } from '../hooks/use-catalog'
import type { RestaurantFilterValues } from '../types'
export function HomeRestaurants({ filters, onReset }: { filters: RestaurantFilterValues; onReset: () => void }) {
  const catalog = useCatalog<Restaurant>(filters)
  const hasFilters = Boolean(filters.query || filters.category !== 'all' || filters.priceRange !== 'all')
  return <section id="restaurants" className="home-restaurant-section section design-container" aria-labelledby="restaurant-title">
    <div className="section-heading section-heading--inline"><div><span className="kicker">Quanh khuôn viên</span><h2 id="restaurant-title">Khám phá quán ăn quanh VJU</h2></div><p>Chọn quán để xem thông tin và thực đơn.</p></div>
    <p className="home-result-count" role="status" aria-live="polite">{catalog.status === 'ready' ? `Đã tải ${catalog.data.length} quán${hasFilters ? ' phù hợp' : ''}` : catalog.status === 'loading' ? 'Đang tải danh sách quán…' : ''}</p>
    {catalog.status === 'error' ? <ListState error title="Chưa tải được danh sách quán" action="Thử lại" onAction={catalog.retry}>Kiểm tra kết nối và thử lại. Các bộ lọc của bạn vẫn được giữ.</ListState>
      : catalog.status === 'loading' ? <div className="home-restaurant-grid" aria-busy="true">{[0, 1, 2].map(n => <div key={n} className="home-restaurant-card skeleton" />)}</div>
      : !catalog.data.length ? <ListState title={hasFilters ? 'Chưa tìm thấy quán phù hợp' : 'Chưa có quán trong danh sách'} action={hasFilters ? 'Xóa bộ lọc' : undefined} onAction={onReset}>Các quán sẽ xuất hiện khi sẵn sàng công khai. Bạn có thể thử từ khóa hoặc bộ lọc khác.</ListState>
      : <div className="home-restaurant-grid" aria-label="Danh sách quán ăn">{catalog.data.map(restaurant =>
        <article className="home-restaurant-card" key={restaurant.id}>
          <a className="home-restaurant-identity" href={`/restaurants/${restaurant.id}`}>
            <RestaurantAvatar key={restaurant.avatar_image_reference} source={restaurant.avatar_image_reference} name={restaurant.name}/>
            <h3>{restaurant.name}</h3>
          </a>
        </article>
      )}</div>}
    {catalog.moreError && <p role="alert">Chưa tải được trang tiếp theo. Hãy thử lại.</p>}
    {catalog.hasMore && <Button className="home-load-more" disabled={catalog.loadingMore} onClick={catalog.loadMore}>{catalog.loadingMore ? 'Đang tải…' : 'Tải thêm quán'}</Button>}
  </section>
}
