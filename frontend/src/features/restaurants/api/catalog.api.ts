import type { RestaurantFilterValues, RestaurantSummary } from '../types'
export type Page<T> = { data: T[]; page: { has_more: boolean; next_cursor: string | null } }
export type Category = { id: string; name: string }
export type Restaurant = { description?: string | null; cover_image_reference?: string | null; id: string; name: string; address: string; is_active: boolean; is_open: boolean;
  is_accepting_orders: boolean; min_price_vnd: string | null; max_price_vnd: string | null;
  hours: { weekday: number; opens_at: string; closes_at: string; closes_next_day: boolean }[] }
export type Dish = { category_id?: string; id: string; restaurant_id: string; restaurant_name: string; name: string; description: string;
  price_vnd: string; image_reference: string | null; is_available: boolean }
export class CatalogError extends Error { readonly status: number; constructor(status: number) { super('Không tải được danh mục'); this.status = status } }
async function get<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`/api/v1${path}`, { signal, credentials: 'omit' })
  if (!response.ok) throw new CatalogError(response.status)
  return response.json() as Promise<T>
}
export function filterQuery(filters: RestaurantFilterValues, cursor?: string | null) {
  const q = new URLSearchParams()
  if (filters.query.trim()) q.set('q', filters.query.trim())
  if (filters.category !== 'all') q.set('category_id', filters.category)
  if (filters.priceRange === 'under-30') q.set('max_price_vnd', '29999')
  if (filters.priceRange === '30-to-50') { q.set('min_price_vnd', '30000'); q.set('max_price_vnd', '50000') }
  if (filters.priceRange === 'over-50') q.set('min_price_vnd', '50001')
  if (cursor) q.set('cursor', cursor)
  return q
}
export const catalogApi = {
  restaurants: (query: URLSearchParams, signal?: AbortSignal) => get<Page<Restaurant>>(`/restaurants?${query}`, signal),
  restaurant: async (id: string, signal?: AbortSignal) => (await get<{ data: Restaurant }>(`/restaurants/${id}`, signal)).data,
  dish: async (id: string, signal?: AbortSignal) => (await get<{ data: Dish }>(`/dishes/${id}`, signal)).data,
  dishes: (query: URLSearchParams, signal?: AbortSignal) => get<Page<Dish>>(`/dishes?${query}`, signal),
  categories: async (signal?: AbortSignal): Promise<Category[]> => {
    const result: Category[] = []; let cursor: string | null = null
    do { const page: Page<Category> = await get(`/dish-categories?limit=100&public_only=true${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`, signal)
      result.push(...page.data); cursor = page.page.next_cursor
    } while (cursor)
    return result
  },
}
export function summary(r: Restaurant): RestaurantSummary {
  const day = new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date())
  const weekday = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(day) + 1
  const intervals = r.hours.filter(h => h.weekday === weekday)
  return { id: r.id, name: r.name, description: '', cuisine: '', isActive: r.is_active, isOpen: r.is_open,
    isAcceptingOrders: r.is_accepting_orders, imageSrc: null, illustrationTone: 'rice',
    deliveryFeeVnd: null, distanceMetres: null, dishes: [], priceRange: { min: r.min_price_vnd, max: r.max_price_vnd },
    hours: intervals.length ? `Hôm nay: ${intervals.map(h => `${h.opens_at.slice(0, 5)}–${h.closes_at.slice(0, 5)}${h.closes_next_day ? ' (hôm sau)' : ''}`).join(', ')}` : 'Hôm nay không có giờ mở cửa' }
}
