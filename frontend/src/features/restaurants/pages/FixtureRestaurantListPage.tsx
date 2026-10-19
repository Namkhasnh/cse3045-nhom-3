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

export function FixtureRestaurantListPage() {
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
    <section className="home-intro" aria-labelledby="page-title">
      <p className="home-location"><Icon name="pin" />Dành cho cộng đồng VJU · Hòa Lạc</p>
      <h1 id="page-title">Hôm nay, <span>ăn gì ở VJU?</span></h1>
      <p className="home-description">Tìm quán hợp khẩu vị, xem giá món và lựa chọn bữa ăn của bạn. Khám phá ngay, không cần đăng nhập.</p>
      <a className="home-discover-link" href="#kham-pha">Khám phá quán <span aria-hidden="true">↓</span></a>
    </section>
    <aside className="home-sample-notice" aria-label="Thông báo dữ liệu mẫu"><Icon name="info" /><p><strong>Bản xem trước trang chủ.</strong> Dữ liệu quán là mẫu — chưa kết nối hệ thống đặt món. Giá, phí và trạng thái dưới đây chỉ để minh họa.</p></aside>
    <section id="kham-pha" className="discovery-header" aria-labelledby="discovery-title">
      <div className="discovery-heading"><h2 id="discovery-title">Quán quanh VJU</h2><span className="sample-label">Danh sách mẫu</span></div>
      <p className="pickup-point" aria-label="Điểm nhận hàng mẫu, chỉ đọc"><Icon name="pin" /><span>Nhận tại: <strong>{fixturePickupPoint}</strong> · mẫu</span></p>
    </section>
    <RestaurantFilters values={filters} categories={fixtureCategories} onChange={setFilters} onReset={() => setFilters(defaultFilters)} hasFilters={hasFilters} />
    {demoState && <p className="demo-state-note"><Icon name="info" />Đang mô phỏng trạng thái {demoState === 'loading' ? 'đang tải' : demoState === 'empty' ? 'danh sách trống' : 'lỗi'} trong môi trường phát triển.</p>}
    <section className="restaurant-section" aria-label="Danh sách quán">
      <p className="result-count" role="status" aria-live="polite" aria-atomic="true">{status === 'ready' ? `${restaurants.length} quán${hasFilters ? ' phù hợp' : ' trong bản mẫu'}` : status === 'loading' ? 'Đang tải…' : 'Lỗi mô phỏng'}</p>
      <RestaurantList status={status} restaurants={restaurants} hasFilters={hasFilters} onReset={() => setFilters(defaultFilters)} onRetry={retryFixtures} />
    </section>
  </>
}
