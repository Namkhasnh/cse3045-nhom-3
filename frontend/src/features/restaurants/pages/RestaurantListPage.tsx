import { useState } from 'react'
import { Icon } from '../../../shared/ui/Icon'
import { RestaurantFilters } from '../components/RestaurantFilters'
import { RestaurantList } from '../components/RestaurantList'
import { filterRestaurants } from '../filter-restaurants'
import { fixtureCategories, fixturePickupPoint, restaurantFixtures } from '../fixtures/restaurants.fixture'
import type { RestaurantFilterValues } from '../types'

const defaultFilters: RestaurantFilterValues = { query: '', category: 'all', priceRange: 'all' }

function readDemoState(): 'loading' | 'empty' | 'error' | null {
  if (!import.meta.env.DEV) return null
  const value = new URLSearchParams(window.location.search).get('demo_state')
  return value === 'loading' || value === 'empty' || value === 'error' ? value : null
}

export function RestaurantListPage() {
  const [filters, setFilters] = useState(defaultFilters)
  const [demoState, setDemoState] = useState(readDemoState)
  const hasFilters = Boolean(filters.query || filters.category !== 'all' || filters.priceRange !== 'all')
  const restaurants = filterRestaurants(demoState === 'empty' ? [] : restaurantFixtures, filters)
  const status = demoState === 'loading' || demoState === 'error' ? demoState : 'ready'

  function retryFixtures() {
    setDemoState(null)
    const url = new URL(window.location.href)
    url.searchParams.delete('demo_state')
    window.history.replaceState(null, '', url)
  }

  return <>
    <section className="discovery-header" aria-labelledby="page-title">
      <div><p className="greeting">Xin chào bạn,</p><h1 id="page-title">Hôm nay ăn gì nhỉ?</h1><p className="page-intro">Khám phá những quán quen, tìm thêm một vị mới.</p></div>
      <div className="pickup-point" aria-label="Điểm nhận hàng mẫu, chỉ đọc"><span className="pickup-icon"><Icon name="pin" /></span><div><p>ĐIỂM NHẬN HÀNG MẪU</p><strong>{fixturePickupPoint} <span>· mẫu</span></strong><small>Phí giao hiển thị theo điểm nhận này</small></div></div>
    </section>
    <RestaurantFilters values={filters} categories={fixtureCategories} onChange={setFilters} onReset={() => setFilters(defaultFilters)} hasFilters={hasFilters} />
    {demoState && <p className="demo-state-note"><Icon name="info" />Đang mô phỏng trạng thái {demoState === 'loading' ? 'đang tải' : demoState === 'empty' ? 'danh sách trống' : 'lỗi'} trong môi trường phát triển.</p>}
    <section className="restaurant-section" aria-labelledby="restaurant-list-title">
      <div className="list-heading"><div><p className="eyebrow">QUANH KHUÔN VIÊN VJU</p><h2 id="restaurant-list-title">Quán ngon quanh bạn</h2></div><p className="result-count" role="status" aria-live="polite" aria-atomic="true">{status === 'ready' ? `${restaurants.length} quán${hasFilters ? ' phù hợp' : ' trong bản mẫu'}` : status === 'loading' ? 'Đang tải…' : 'Lỗi mô phỏng'}</p></div>
      <RestaurantList status={status} restaurants={restaurants} hasFilters={hasFilters} onReset={() => setFilters(defaultFilters)} onRetry={retryFixtures} />
    </section>
  </>
}
