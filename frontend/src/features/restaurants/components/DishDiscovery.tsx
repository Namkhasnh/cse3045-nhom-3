import { useState } from 'react'
import { Button } from '../../../shared/ui/Button'
import { ListState } from '../../../shared/ui/ListState'
import { Icon } from '../../../shared/ui/Icon'
import { formatVnd } from '../../../shared/lib/format'
import type { Dish } from '../api/catalog.api'
import type { RestaurantFilterValues } from '../types'
import { useCatalog } from '../hooks/use-catalog'
import { DishImage } from './DishImage'
export function DishDiscovery({ filters, onReset, onAddDish }: { filters: RestaurantFilterValues; onReset: () => void; onAddDish?: (dish: Dish, source: HTMLElement) => Promise<void> }) {
  const [adding, setAdding] = useState<string | null>(null)
  const [addError, setAddError] = useState('')
  const catalog = useCatalog<Dish>(filters, undefined, 'dishes', true)
  const filtered = Boolean(filters.query || filters.category !== 'all' || filters.priceRange !== 'all')
  return <section className="dishes-section section" id="dishes" aria-labelledby="dish-discovery-title"><div className="design-container">
    <div className="section-heading section-heading--inline"><div><span className="kicker">Món ngon gần bạn</span><h2 id="dish-discovery-title">Ăn gì hôm nay?</h2></div>{filtered && <button className="view-all" onClick={onReset}>Xem tất cả <Icon name="arrow" /></button>}</div>
    {catalog.status === 'loading' ? <div role="status" aria-busy="true"><p>Đang tải món ăn…</p><div className="dish-grid" aria-hidden="true">{[0, 1, 2, 3, 4, 5].map(n => <div className="dish-card" key={n}><div className="home-dish-image skeleton" /><div className="dish-content"><div className="skeleton skeleton-title" /><div className="skeleton skeleton-line" /></div></div>)}</div></div>
      : catalog.status === 'error' ? <ListState error title="Chưa tải được món ăn" action="Thử lại món ăn" onAction={catalog.retry}>Kiểm tra kết nối và thử lại.</ListState>
      : catalog.data.length === 0 ? <ListState title={filtered ? 'Chưa tìm thấy món phù hợp' : 'Chưa có món công khai'} action={filtered ? 'Xóa bộ lọc' : undefined} onAction={onReset}>Thử từ khóa khác hoặc khám phá các nhóm món đang có.</ListState>
      : <div className="dish-grid">{catalog.data.map(dish => {
        const label = catalog.refreshError ? 'Chưa xác minh giờ bán' : !dish.restaurant_is_open ? 'Ngoài giờ bán' : !dish.restaurant_is_accepting_orders ? 'Tạm ngưng nhận đơn' : !dish.is_available ? 'Tạm hết món' : 'Còn món'
        const available = !catalog.refreshError && dish.restaurant_is_open && dish.restaurant_is_accepting_orders && dish.is_available
        return <article className="dish-card" key={dish.id}>
        <a className="home-dish-image" href={`/restaurants/${dish.restaurant_id}`} aria-label={`Xem món ${dish.name}`}><DishImage key={dish.image_reference} name={dish.name} source={dish.image_reference} /></a>
        <div className="dish-content"><div className="dish-title-row"><h3><a href={`/restaurants/${dish.restaurant_id}`}>{dish.name}</a></h3><strong>{formatVnd(dish.price_vnd)}</strong></div><p className="dish-seller">Quán bán: <a href={`/restaurants/${dish.restaurant_id}`}>{dish.restaurant_name}</a></p><div className="dish-footer"><span className={`status${available ? '' : ' status--closed'}`}><i />{label}</span>{onAddDish && <Button disabled={!available || adding !== null} onClick={async event => {
          const source = event.currentTarget
          setAdding(dish.id); setAddError('')
          try { await onAddDish(dish, source) } catch { setAddError('Chưa thêm được món. Hãy kiểm tra lại món và trạng thái quán rồi thử lại.') }
          finally { setAdding(null) }
        }}>{adding === dish.id ? 'Đang kiểm tra…' : '＋ Thêm vào giỏ'}<span className="sr-only"> {dish.name}</span></Button>}<a href={`/restaurants/${dish.restaurant_id}`}>Xem chi tiết <Icon name="arrow" /></a></div></div>
      </article>})}</div>}
    {catalog.refreshError && <p role="status">Chưa cập nhật được trạng thái quán. Hệ thống sẽ kiểm tra lại khi có kết nối.</p>}
    {addError && <p role="alert">{addError}</p>}
    {catalog.moreError && <p role="alert">Chưa tải được trang món tiếp theo. Hãy thử lại.</p>}
    {catalog.hasMore && <Button className="home-load-more" disabled={catalog.loadingMore} onClick={catalog.loadMore}>{catalog.loadingMore ? 'Đang tải…' : 'Tải thêm món ăn'}</Button>}
  </div></section>
}
