import type { PriceRange, RestaurantFilterValues, RestaurantSummary } from './types'

function matchesPrice(priceVnd: string, range: PriceRange): boolean {
  const price = BigInt(priceVnd)
  switch (range) {
    case 'under-30': return price < 30000n
    case '30-to-50': return price >= 30000n && price <= 50000n
    case 'over-50': return price > 50000n
    default: return true
  }
}

// Local fixture filtering only; production collation/eligibility stays server-owned.
export function filterRestaurants(restaurants: readonly RestaurantSummary[], filters: RestaurantFilterValues) {
  const prefix = filters.query.trim().normalize('NFC').toLocaleLowerCase('vi-VN')
  return restaurants.filter(restaurant => {
    if (!restaurant.isActive || !restaurant.name.normalize('NFC').toLocaleLowerCase('vi-VN').startsWith(prefix)) return false
    if (filters.category === 'all' && filters.priceRange === 'all') return true
    return restaurant.dishes.some(dish => dish.isVisible
      && (filters.category === 'all' || dish.category === filters.category)
      && matchesPrice(dish.priceVnd, filters.priceRange))
  })
}
