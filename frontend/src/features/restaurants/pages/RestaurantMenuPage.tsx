import { useEffect, useState } from 'react'
import { DishImage } from '../components/DishImage'
import { Button } from '../../../shared/ui/Button'
import { Input } from '../../../shared/ui/Input'
import { ListState } from '../../../shared/ui/ListState'
import { formatVnd } from '../../../shared/lib/format'
import { catalogApi, CatalogError, type Dish, type Restaurant, type Category } from '../api/catalog.api'
import { useCatalog } from '../hooks/use-catalog'
import type { RestaurantFilterValues } from '../types'
const defaults: RestaurantFilterValues = { query: '', category: 'all', priceRange: 'all' }
export function RestaurantMenuPage({ restaurantId, onAddDish, cartSummary }: { restaurantId: string;
  onAddDish?: (restaurant: Restaurant, dish: Dish) => void; cartSummary?: { count: number; subtotal: string }
}) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'missing'>('loading')
  const [attempt, setAttempt] = useState(0)
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryError, setCategoryError] = useState(false)
  const [filters, setFilters] = useState(defaults)
  const catalog = useCatalog<Dish>(filters, restaurantId)
  useEffect(() => {
    const c = new AbortController()
    catalogApi.restaurant(restaurantId, c.signal).then(r => { setRestaurant(r); setStatus('ready') }).catch(error => {
      if (!c.signal.aborted) setStatus(error instanceof CatalogError && error.status === 404 ? 'missing' : 'error')
    })
    catalogApi.categories(c.signal).then(values => { setCategories(values); setCategoryError(false) }).catch(() => { if (!c.signal.aborted) setCategoryError(true) })
    return () => c.abort()
  }, [restaurantId, attempt])
  if (status === 'loading') return <p role="status">Đang tải thông tin quán…</p>
  if (status === 'missing') return <ListState title="Quán chưa khả dụng"><a href="/">Khám phá quán khác</a></ListState>
  if (status === 'error' || !restaurant) return <ListState error title="Chưa tải được thông tin quán" action="Thử lại" onAction={() => setAttempt(v => v + 1)}>Kiểm tra kết nối và thử lại.</ListState>
  const filtered = Boolean(filters.query || filters.category !== 'all' || filters.priceRange !== 'all')
  return <section className="restaurant-menu" aria-labelledby="menu-title">
    <a href="/">← Khám phá quán</a><h1 id="menu-title">{restaurant.name}</h1>
    <p>{restaurant.address}</p><p>{restaurant.is_open ? restaurant.is_accepting_orders ? 'Đang nhận đơn' : 'Tạm ngưng nhận đơn' : 'Đã đóng cửa'}</p>
    <p>Chưa xác định phí giao</p>
    {cartSummary && cartSummary.count > 0 && <a className="button button--primary cart-menu-link" href="/cart">Xem giỏ · {cartSummary.count} phần · {formatVnd(cartSummary.subtotal)} (ước tính)</a>}
    <div className="restaurant-filters">
      <Input id="dish-search" label="Tìm từ đầu tên món" type="search" value={filters.query} onChange={e => setFilters({ ...filters, query: e.target.value })} />
      <label htmlFor="menu-category">Danh mục</label><select id="menu-category" className="input" value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value })}>
        <option value="all">Tất cả</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <label htmlFor="menu-price">Giá món</label><select id="menu-price" className="input" value={filters.priceRange} onChange={e => setFilters({ ...filters, priceRange: e.target.value as RestaurantFilterValues['priceRange'] })}>
        <option value="all">Tất cả mức giá</option><option value="under-30">Dưới 30.000đ</option><option value="30-to-50">30.000 – 50.000đ</option><option value="over-50">Trên 50.000đ</option>
      </select><Button variant="neutral" onClick={() => setFilters(defaults)} disabled={!filtered}>Xóa bộ lọc</Button>
    </div>
    {categoryError && <p role="alert">Chưa tải được danh mục. <Button variant="neutral" onClick={() => setAttempt(v => v + 1)}>Thử lại</Button></p>}
    {catalog.status === 'loading' ? <p role="status">Đang tải menu…</p> : catalog.status === 'error' ? <ListState error title="Chưa tải được menu" action="Thử lại" onAction={catalog.retry}>Kiểm tra kết nối và thử lại.</ListState> :
      catalog.data.length === 0 ? <ListState title={filtered ? 'Chưa tìm thấy món phù hợp' : 'Quán chưa có món công khai'}>Bạn có thể đổi bộ lọc hoặc quay lại sau.</ListState> :
      <div className="restaurant-grid">{catalog.data.map(dish => <article className="restaurant-card menu-dish" key={dish.id}>
        <DishImage key={dish.image_reference} name={dish.name} source={dish.image_reference} />
        <div className="restaurant-card-content"><h2>{dish.name}</h2><p>{dish.description}</p>
          <p className="restaurant-price">{formatVnd(dish.price_vnd)}</p><p>{dish.is_available ? 'Còn món' : 'Tạm hết món'}</p>
          {onAddDish && <Button disabled={!restaurant.is_active || !restaurant.is_open || !restaurant.is_accepting_orders || !dish.is_available} onClick={() => onAddDish(restaurant, dish)}>Thêm vào giỏ<span className="sr-only"> {dish.name}</span></Button>}
        </div></article>)}</div>}
    {catalog.moreError && <p role="alert">Chưa tải được trang tiếp theo. Hãy thử lại.</p>}
    {catalog.hasMore && <Button disabled={catalog.loadingMore} onClick={catalog.loadMore}>{catalog.loadingMore ? 'Đang tải…' : 'Tải thêm món'}</Button>}
  </section>
}
