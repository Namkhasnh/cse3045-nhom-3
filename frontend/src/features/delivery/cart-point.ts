// Only the selected public point ID crosses the cart/checkout boundary, never a quote.
const storageKey = (accountId: string) => `hlf.setup.${accountId}.cart-delivery`
export function loadCartPoint(accountId: string, restaurantId: string): string {
  try {
    const value = JSON.parse(sessionStorage.getItem(storageKey(accountId)) ?? 'null')
    return value?.restaurantId === restaurantId && typeof value.pointId === 'string' && /^[1-9][0-9]{0,18}$/.test(value.pointId) ? value.pointId : ''
  } catch { return '' }
}
export function saveCartPoint(accountId: string, restaurantId: string, pointId: string): void {
  sessionStorage.setItem(storageKey(accountId), JSON.stringify({ restaurantId, pointId }))
}
