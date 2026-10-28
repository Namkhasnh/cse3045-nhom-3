import { useEffect, useState } from 'react'
import { Button } from '../../../shared/ui/Button'
import { Reveal } from '../../../shared/ui/Reveal'
import { catalogApi, type Category, type Dish } from '../api/catalog.api'
import type { PriceRange, RestaurantFilterValues } from '../types'
import { FixtureRestaurantListPage } from './FixtureRestaurantListPage'
import { DishDiscovery } from '../components/DishDiscovery'
import { HomeHero } from '../components/HomeHero'
import { HomeCategories } from '../components/HomeCategories'
import { HomeRestaurants } from '../components/HomeRestaurants'
import { HomeRecommendation } from '../components/HomeRecommendation'
const defaults: RestaurantFilterValues = { query: '', category: 'all', priceRange: 'all' }
export function RestaurantListPage({ preview = false, onAddDish }: { preview?: boolean; onAddDish?: (dish: Dish, source: HTMLElement) => Promise<void> }) {
  return preview && import.meta.env.DEV ? <FixtureRestaurantListPage /> : <ConnectedRestaurants onAddDish={onAddDish} />
}
function ConnectedRestaurants({ onAddDish }: { onAddDish?: (dish: Dish, source: HTMLElement) => Promise<void> }) {
  const [filters, setFilters] = useState(defaults)
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryStatus, setCategoryStatus] = useState('loading')
  const [categoryAttempt, setCategoryAttempt] = useState(0)
  useEffect(() => {
    const c = new AbortController()
    catalogApi.categories(c.signal).then(values => { if (!c.signal.aborted) { setCategories(values); setCategoryStatus('ready') } }).catch(() => { if (!c.signal.aborted) setCategoryStatus('error') })
    return () => c.abort()
  }, [categoryAttempt])
  const reset = () => setFilters(defaults)
  const hasFilters = Boolean(filters.query || filters.category !== 'all' || filters.priceRange !== 'all')
  return <div className="home-design">
    <HomeHero query={filters.query} onQuery={query => setFilters(current => ({ ...current, query }))} />
    <Reveal><HomeCategories categories={categories} selected={filters.category} onSelect={category => { setFilters(current => ({ ...current, category })); document.getElementById('dishes')?.scrollIntoView({ block: 'start' }) }} loading={categoryStatus === 'loading'} error={categoryStatus === 'error'} onRetry={() => { setCategoryStatus('loading'); setCategoryAttempt(v => v + 1) }} /></Reveal>
    <div className="design-container home-filter-bar"><label htmlFor="home-price">Giá một món</label><select id="home-price" className="input" value={filters.priceRange} onChange={event => setFilters(current => ({ ...current, priceRange: event.target.value as PriceRange }))}><option value="all">Tất cả mức giá</option><option value="under-30">Dưới 30.000đ</option><option value="30-to-50">30.000 – 50.000đ</option><option value="over-50">Trên 50.000đ</option></select><Button variant="neutral" disabled={!hasFilters} onClick={reset}>Xóa bộ lọc</Button></div>
    <Reveal><DishDiscovery onAddDish={onAddDish} filters={filters} onReset={reset} /></Reveal>
    <Reveal><HomeRestaurants filters={filters} onReset={reset} /></Reveal>
    <Reveal><HomeRecommendation /></Reveal>
  </div>
}
