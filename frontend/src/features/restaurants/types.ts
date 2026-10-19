// Presentation models; catalog API DTOs are mapped at the feature boundary.
export type FixtureDish = {
  readonly id: string
  readonly category: string
  readonly priceVnd: string
  readonly isVisible: boolean
  readonly isAvailable: boolean
}

export type RestaurantSummary = {
  readonly fixture?: boolean
  readonly priceRange?: { min: string | null; max: string | null }
  readonly id: string
  readonly name: string
  readonly description: string
  readonly cuisine: string
  readonly hours: string
  readonly isActive: boolean
  readonly isOpen: boolean
  readonly isAcceptingOrders: boolean
  readonly imageSrc: string | null
  readonly illustrationTone: 'rice' | 'noodles' | 'bread' | 'tea'
  readonly deliveryFeeVnd: string | null
  readonly distanceMetres: number | null
  readonly dishes: readonly FixtureDish[]
}

export type PriceRange = 'all' | 'under-30' | '30-to-50' | 'over-50'
export type RestaurantFilterValues = { query: string; category: string; priceRange: PriceRange }
export type RestaurantListStatus = 'loading' | 'ready' | 'error'
