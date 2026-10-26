import { useEffect, useState } from 'react'

import { DishImage } from '../components/DishImage'
import { Button } from '../../../shared/ui/Button'
import { Icon } from '../../../shared/ui/Icon'
import { RestaurantAvatar } from '../components/RestaurantAvatar'
import { RestaurantCover, defaultIntroduction } from '../components/RestaurantCover'
import '../storefront.css'
import { ListState } from '../../../shared/ui/ListState'
import { formatVnd } from '../../../shared/lib/format'
import { catalogApi, summary, CatalogError, type Dish, type Restaurant, type Category } from '../api/catalog.api'
import { useCatalog } from '../hooks/use-catalog'
import type { RestaurantFilterValues } from '../types'
const defaults: RestaurantFilterValues = { query: '', category: 'all', priceRange: 'all' }
export function RestaurantMenuPage({ restaurantId, onAddDish, cartSummary, onOpenCart }: { restaurantId: string;
  onAddDish?: (restaurant: Restaurant, dish: Dish) => void; cartSummary?: { count: number; subtotal: string }; onOpenCart?: () => void
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
  if (status === 'loading') return <section className="storefront storefront-loading" aria-busy="true"><p role="status">Đang tải thông tin quán…</p><div className="storefront-skeleton storefront-skeleton--hero" /><div className="storefront-grid">{[1,2,3].map(n=><div key={n} className="storefront-skeleton storefront-skeleton--dish" />)}</div></section>
  if (status === 'missing') return <ListState title="Quán chưa khả dụng"><a href="/">Khám phá quán khác</a></ListState>
  if (status === 'error' || !restaurant) return <ListState error title="Chưa tải được thông tin quán" action="Thử lại" onAction={() => setAttempt(v => v + 1)}>Kiểm tra kết nối và thử lại.</ListState>
  const filtered = Boolean(filters.query || filters.category !== 'all' || filters.priceRange !== 'all')
  const receiving = restaurant.is_active && restaurant.is_open && restaurant.is_accepting_orders
  return <section className="restaurant-menu storefront" aria-labelledby="menu-title">
    <a className="storefront-back" href="/#restaurants">← Khám phá quán</a>
    <div className="storefront-hero">
      <RestaurantCover key={restaurant.cover_image_reference} source={restaurant.cover_image_reference} name={restaurant.name} />
      <div className="storefront-hero-content">
        <span className={`storefront-status${receiving ? '' : ' storefront-status--closed'}`}>{receiving ? 'Đang nhận đơn' : !restaurant.is_open ? 'Đã đóng cửa' : 'Tạm ngưng nhận đơn'}</span>
        <div className="storefront-identity"><RestaurantAvatar key={restaurant.avatar_image_reference} source={restaurant.avatar_image_reference} name={restaurant.name}/><h1 id="menu-title">{restaurant.name}</h1></div>
        <p className="storefront-introduction">{restaurant.description?.trim() || defaultIntroduction}</p>
        <div className="storefront-meta">
          <div><Icon name="clock" /><span><small>Giờ Việt Nam</small>{summary(restaurant).hours}</span></div>
          <div><Icon name="delivery" /><span><small>Nhận món</small>Quán tự giao · Phí theo điểm nhận</span></div>
          <div><Icon name="pin" /><span><small>Địa chỉ quán</small>{restaurant.address}</span></div>
        </div>
      </div>
    </div>
    {!receiving && <div className="storefront-alert" role="status"><p>{!restaurant.is_open ? 'Quán đã đóng cửa theo giờ mở cửa.' : 'Quán đang tạm ngưng nhận đơn.'} Bạn có thể xem món và quay lại khi quán nhận đơn.</p><Button variant="neutral" onClick={() => setAttempt(v => v + 1)}>Kiểm tra trạng thái quán</Button></div>}
    <div className="storefront-menu-heading"><div><p>CHỌN MÓN BẠN THÍCH</p><h2>Thực đơn của quán</h2></div>{catalog.status === 'ready' && <span>{catalog.data.length} món đã tải{catalog.hasMore ? ' · Còn món khác' : ''}</span>}</div>
    <div className="storefront-filters">
      <label className="storefront-search" htmlFor="dish-search"><Icon name="search" /><span className="sr-only">Tìm từ đầu tên món</span><input id="dish-search" type="search" placeholder="Bạn muốn ăn món gì?" value={filters.query} onChange={e => setFilters({ ...filters, query: e.target.value })} /></label>
      <div className="storefront-categories" role="group" aria-label="Danh mục món"><button aria-pressed={filters.category === 'all'} onClick={() => setFilters({ ...filters, category: 'all' })}>Tất cả</button>{categories.map(c => <button key={c.id} aria-pressed={filters.category === c.id} onClick={() => setFilters({ ...filters, category: c.id })}>{c.name}</button>)}</div>
      <label className="storefront-price" htmlFor="menu-price"><span className="sr-only">Giá món</span><select id="menu-price" value={filters.priceRange} onChange={e => setFilters({ ...filters, priceRange: e.target.value as RestaurantFilterValues['priceRange'] })}><option value="all">Tất cả mức giá</option><option value="under-30">Dưới 30.000đ</option><option value="30-to-50">30.000 – 50.000đ</option><option value="over-50">Trên 50.000đ</option></select></label>
      {filtered && <button className="storefront-reset" onClick={() => setFilters(defaults)}>Xóa bộ lọc</button>}
    </div>
    {categoryError && <p role="alert">Chưa tải được danh mục. <Button variant="neutral" onClick={() => setAttempt(v => v + 1)}>Thử lại</Button></p>}
    {catalog.status === 'loading' ? <div aria-busy="true"><p role="status">Đang tải menu…</p><div className="storefront-grid">{[1,2,3].map(n=><div key={n} className="storefront-skeleton storefront-skeleton--dish" />)}</div></div> : catalog.status === 'error' ? <ListState error title="Chưa tải được menu" action="Thử lại" onAction={catalog.retry}>Kiểm tra kết nối và thử lại.</ListState> :
      catalog.data.length === 0 ? <ListState title={filtered ? 'Chưa tìm thấy món phù hợp' : 'Quán chưa có món công khai'}>Bạn có thể đổi bộ lọc hoặc quay lại sau.</ListState> :
      <div className="storefront-grid">{catalog.data.map(dish => <article className={`storefront-dish${dish.is_available ? '' : ' storefront-dish--unavailable'}`} key={dish.id}>
        <div className="storefront-dish-media"><DishImage key={dish.image_reference} name={dish.name} source={dish.image_reference} /><span className="storefront-availability">{dish.is_available ? 'Còn món' : 'Tạm hết món'}</span></div>
        <div className="storefront-dish-content">{categories.find(c => c.id === dish.category_id) && <span className="storefront-dish-category">{categories.find(c => c.id === dish.category_id)!.name}</span>}<h3>{dish.name}</h3><p>{dish.description}</p><div className="storefront-dish-bottom">
          <p className="restaurant-price">{formatVnd(dish.price_vnd)}</p>
          {onAddDish && <Button disabled={!restaurant.is_active || !restaurant.is_open || !restaurant.is_accepting_orders || !dish.is_available} onClick={() => onAddDish(restaurant, dish)}><span aria-hidden="true">＋</span> Thêm vào giỏ<span className="sr-only"> {dish.name}</span></Button>}
        </div></div></article>)}</div>}
    {catalog.moreError && <p role="alert">Chưa tải được trang tiếp theo. Hãy thử lại.</p>}
    {catalog.hasMore && <Button disabled={catalog.loadingMore} onClick={catalog.loadMore}>{catalog.loadingMore ? 'Đang tải…' : 'Tải thêm món'}</Button>}
    {cartSummary && cartSummary.count > 0 && <button className="storefront-cart-trigger" onClick={onOpenCart}><Icon name="bag" /><span>Xem giỏ · {cartSummary.count} phần</span><strong>{formatVnd(cartSummary.subtotal)}</strong></button>}
  </section>
}
