import { useCart } from '../../features/cart'
import { catalogApi, type Dish } from '../../features/restaurants'

export function useDiscoveryCart() {
  const cart = useCart()
  return async (selected: Dish, source: HTMLElement) => {
    const [restaurant, dish] = await Promise.all([
      catalogApi.restaurant(selected.restaurant_id), catalogApi.dish(selected.id),
    ])
    if (!source.isConnected) return
    if (dish.restaurant_id !== selected.restaurant_id || dish.price_vnd !== selected.price_vnd)
      throw new Error('Catalog changed')
    if (!cart.add(restaurant, dish, source)) throw new Error('Cart addition rejected')
  }
}
