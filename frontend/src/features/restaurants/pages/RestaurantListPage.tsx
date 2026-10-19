import { useEffect, useState } from 'react'
import { Button } from '../../../shared/ui/Button'
import { Icon } from '../../../shared/ui/Icon'
import { RestaurantFilters } from '../components/RestaurantFilters'
import { RestaurantList } from '../components/RestaurantList'
import { catalogApi, summary, type Category, type Restaurant } from '../api/catalog.api'
import { useCatalog } from '../hooks/use-catalog'
import type { RestaurantFilterValues } from '../types'
import { FixtureRestaurantListPage } from './FixtureRestaurantListPage'
const defaults: RestaurantFilterValues = { query: '', category: 'all', priceRange: 'all' }
export function RestaurantListPage({ preview = false }: { preview?: boolean }) {
  return preview && import.meta.env.DEV ? <FixtureRestaurantListPage /> : <ConnectedRestaurants />
}
function ConnectedRestaurants() {
  const [filters, setFilters] = useState(defaults)
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryError, setCategoryError] = useState(false)
  const [categoryAttempt, setCategoryAttempt] = useState(0)
  useEffect(() => {
    const c = new AbortController()
    catalogApi.categories(c.signal).then(values => { setCategories(values); setCategoryError(false) }).catch(() => { if (!c.signal.aborted) setCategoryError(true) })
    return () => c.abort()
  }, [categoryAttempt])
  const catalog = useCatalog<Restaurant>(filters)
  const hasFilters = Boolean(filters.query || filters.category !== 'all' || filters.priceRange !== 'all')
  return <>
    <section className="home-intro" aria-labelledby="page-title">
      <p className="home-location"><Icon name="pin" />Dành cho cộng đồng VJU · Hòa Lạc</p>
      <h1 id="page-title">Hôm nay, <span>ăn gì ở VJU?</span></h1>
      <p className="home-description">Tìm quán hợp khẩu vị, xem giá món và lựa chọn bữa ăn của bạn. Khám phá ngay, không cần đăng nhập.</p>
      <a className="home-discover-link" href="#kham-pha">Khám phá quán <span aria-hidden="true">↓</span></a>
    </section>
    <section id="kham-pha" className="discovery-header" aria-labelledby="discovery-title">
      <div className="discovery-heading"><h2 id="discovery-title">Quán quanh VJU</h2></div>
    </section>
    <RestaurantFilters values={filters} categories={categories} onChange={setFilters} onReset={() => setFilters(defaults)} hasFilters={hasFilters} />
    {categoryError && <p role="alert">Chưa tải được danh mục. <Button variant="neutral" onClick={() => setCategoryAttempt(v => v + 1)}>Thử lại danh mục</Button></p>}
    <section className="restaurant-section" aria-label="Danh sách quán">
      <p className="result-count" role="status" aria-live="polite">{catalog.status === 'loading' ? 'Đang tải…' : catalog.status === 'error' ? 'Chưa tải được dữ liệu' : `Đã tải ${catalog.data.length} quán${hasFilters ? ' phù hợp' : ''}`}</p>
      <RestaurantList status={catalog.status} restaurants={catalog.data.map(summary)} hasFilters={hasFilters} onReset={() => setFilters(defaults)} onRetry={catalog.retry} />
      {catalog.moreError && <p role="alert">Chưa tải được trang tiếp theo. Hãy thử lại.</p>}
      {catalog.hasMore && <Button disabled={catalog.loadingMore} onClick={catalog.loadMore}>{catalog.loadingMore ? 'Đang tải…' : 'Tải thêm quán'}</Button>}
    </section>
  </>
}
