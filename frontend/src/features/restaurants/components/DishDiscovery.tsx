import { Button } from '../../../shared/ui/Button'
import { ListState } from '../../../shared/ui/ListState'
import { formatVnd } from '../../../shared/lib/format'
import type { Dish } from '../api/catalog.api'
import { useCatalog } from '../hooks/use-catalog'
import { DishImage } from './DishImage'

const filters = { query: '', category: 'all', priceRange: 'all' as const }

export function DishDiscovery() {
  const catalog = useCatalog<Dish>(filters, undefined, 'dishes')
  return <section className="dish-discovery" aria-labelledby="dish-discovery-title">
    <div className="discovery-header"><h2 id="dish-discovery-title">Khám phá món ăn</h2></div>
    {catalog.status === 'loading' ? <p role="status">Đang tải món ăn…</p>
      : catalog.status === 'error' ? <ListState error title="Chưa tải được món ăn" action="Thử lại món ăn" onAction={catalog.retry}>Kiểm tra kết nối và thử lại.</ListState>
      : catalog.data.length === 0 ? <ListState title="Chưa có món công khai">Các món sẽ xuất hiện khi quán hoàn tất thiết lập.</ListState>
      : <div className="restaurant-grid">{catalog.data.map(dish => <article className="restaurant-card menu-dish" key={dish.id}>
        <DishImage key={dish.image_reference} name={dish.name} source={dish.image_reference} />
        <div className="restaurant-card-content">
          <h3><a href={`/restaurants/${dish.restaurant_id}`}>{dish.name}</a></h3>
          <p className="dish-seller">Quán bán: <a href={`/restaurants/${dish.restaurant_id}`}>{dish.restaurant_name}</a></p>
          <p className="restaurant-price">{formatVnd(dish.price_vnd)}</p>
          <p>{dish.is_available ? 'Còn món' : 'Tạm hết món'}</p>
          <p>{dish.description}</p>
        </div>
      </article>)}</div>}
    {catalog.moreError && <p role="alert">Chưa tải được trang món tiếp theo. Hãy thử lại.</p>}
    {catalog.hasMore && <Button disabled={catalog.loadingMore} onClick={catalog.loadMore}>{catalog.loadingMore ? 'Đang tải…' : 'Tải thêm món ăn'}</Button>}
  </section>
}
