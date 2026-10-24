import { createContext, useCallback, useContext, useEffect, useReducer, useState } from 'react'
import { cartReducer, orderable, orderabilityReason, CART_STORAGE_KEY, itemCount, parseDraft, subtotal, type CartCatalog, type CartDish, type CartRestaurant } from './model'

type Current<T> = { status: 'ready'; value: T } | { status: 'missing' | 'error' }
type Validation = { key: string; status: 'ready'; restaurant: Current<CartRestaurant>; dishes: Record<string, Current<CartDish>> }
function failure(error: unknown): { status: 'missing' | 'error' } {
  return { status: typeof error === 'object' && error !== null && 'status' in error && error.status === 404 ? 'missing' : 'error' }
}
function initialDraft() {
  try { const raw = localStorage.getItem(CART_STORAGE_KEY); const draft = parseDraft(raw)
    return { draft, warning: raw && !draft ? 'Giỏ đã lưu không hợp lệ. Bạn có thể chọn món lại.' : '' }
  } catch { return { draft: null, warning: 'Không thể lưu giỏ trên thiết bị. Giỏ chỉ giữ trong trang đang mở.' } }
}
export function useCartState(catalog: CartCatalog) {
  const [initial] = useState(initialDraft)
  const [{ draft, notice, pending, undo }, dispatch] = useReducer(cartReducer, { draft: initial.draft, notice: '', pending: null })
  useEffect(() => {
    if (!undo) return
    const timer = setTimeout(() => dispatch({ type: 'expire-undo' }), Math.max(0, undo.expiresAt - Date.now()))
    return () => clearTimeout(timer)
  }, [undo])
  const [storageWarning, setStorageWarning] = useState(initial.warning)
  const [attempt, setAttempt] = useState(0)
  const [validation, setValidation] = useState<Validation | null>(null)
  const refresh = useCallback(() => setAttempt(v => v + 1), [])
  const restaurantId = draft?.restaurant.id ?? ''
  const ids = draft?.items.map(i => i.id).sort().join(',') ?? ''
  const key = `${restaurantId}:${ids}:${attempt}`
  useEffect(() => {
    try { if (draft) localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(draft)); else localStorage.removeItem(CART_STORAGE_KEY) }
    catch { queueMicrotask(() => setStorageWarning('Không thể lưu giỏ trên thiết bị. Giỏ chỉ giữ trong trang đang mở.')) }
  }, [draft])
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === CART_STORAGE_KEY || event.key === null) {
        const next = parseDraft(event.newValue)
        if (event.newValue && !next) { setStorageWarning('Giỏ từ tab khác không hợp lệ. Giỏ hiện tại được giữ nguyên.'); return }
        dispatch({ type: 'replace', draft: next }); refresh()
      }
    }
    const onVisible = () => { if (document.visibilityState === 'visible') refresh() }
    window.addEventListener('storage', onStorage); window.addEventListener('focus', refresh); document.addEventListener('visibilitychange', onVisible)
    return () => { window.removeEventListener('storage', onStorage); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', onVisible) }
  }, [refresh])
  useEffect(() => {
    if (!restaurantId) return
    const c = new AbortController()
    const readRestaurant = catalog.restaurant(restaurantId, c.signal).then(value => ({ status: 'ready' as const, value }), failure)
    const readDishes = ids.split(',').map(async id => {
      const value = await catalog.dish(id, c.signal).then(value => value.restaurant_id === restaurantId ? { status: 'ready' as const, value } : { status: 'missing' as const }, failure)
      return [id, value] as const
    })
    Promise.all([readRestaurant, Promise.all(readDishes)]).then(([restaurant, dishes]) => {
      if (!c.signal.aborted) setValidation({ key, status: 'ready', restaurant, dishes: Object.fromEntries(dishes) })
    })
    return () => c.abort()
  }, [catalog, restaurantId, ids, key])
  const current = validation?.key === key ? validation : null
  function acceptPrices() {
    if (!draft || !current || current.restaurant.status !== 'ready' || !orderable(current.restaurant.value)) return
    const prices: Record<string, string> = {}
    for (const item of draft.items) {
      const result = current.dishes[item.id]
      if (result?.status !== 'ready') return
      if (result.value.is_available) prices[item.id] = result.value.price_vnd
    }
    dispatch({ type: 'accept-prices', restaurantId: draft.restaurant.id, prices })
  }
  const issue = !draft ? 'Giỏ hàng đang trống.' : !current ? 'Đang kiểm tra giá và tình trạng món…'
    : current.restaurant.status === 'error' ? 'Chưa kiểm tra được quán. Hãy thử kiểm tra lại giỏ.'
    : current.restaurant.status === 'missing' ? 'Quán không còn công khai. Giỏ hàng được giữ nguyên.'
    : current.restaurant.status !== 'ready' ? 'Chưa kiểm tra được quán. Hãy thử kiểm tra lại giỏ.' : orderabilityReason(current.restaurant.value) || (draft.items.some(i => current.dishes[i.id]?.status !== 'ready') ? 'Chưa xác minh được tất cả món. Hãy kiểm tra lại giỏ.'
      : draft.items.some(i => { const d = current.dishes[i.id]; return d.status === 'ready' && !d.value.is_available }) ? 'Có món đang tạm hết. Hãy xem lại giỏ.' : '')
  return { draft, undo, undoRemove: () => { dispatch({ type: 'undo-remove' }); refresh() }, current, issue, storageWarning, notice, pending, count: itemCount(draft), subtotal: subtotal(draft), refresh,
    add: (restaurant: CartRestaurant, dish: CartDish) => dispatch({ type: 'add', restaurant, dish }), acceptPrices,
    quantity: (id: string, quantity: number) => dispatch({ type: 'quantity', id, quantity }),
    remove: (id: string) => dispatch({ type: 'remove', id }), clear: () => dispatch({ type: 'clear' }),
    cancelSwitch: () => dispatch({ type: 'cancel-switch' }), confirmSwitch: () => dispatch({ type: 'confirm-switch' }) }
}
type CartState = ReturnType<typeof useCartState>
export const CartContext = createContext<CartState | null>(null)
export function useCart() {
  const cart = useContext(CartContext)
  if (!cart) throw new Error('CartProvider required')
  return cart
}
