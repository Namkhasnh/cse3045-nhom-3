import { formatVnd } from '../../shared/lib/format'
import type { FixtureDish } from './types'

// Display the visible catalog, including sold-out dishes, independently of filters.
export function formatDishPriceRange(dishes: readonly FixtureDish[]): string {
  const prices = dishes.filter(dish => dish.isVisible).map(dish => BigInt(dish.priceVnd))
  if (prices.length === 0) return 'Chưa có giá món'
  const min = prices.reduce((lowest, price) => price < lowest ? price : lowest)
  const max = prices.reduce((highest, price) => price > highest ? price : highest)
  return min === max
    ? `Món: ${formatVnd(min.toString())}`
    : `Món: ${formatVnd(min.toString())} – ${formatVnd(max.toString())}`
}
