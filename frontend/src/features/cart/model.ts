// Non-sensitive purchase intent only. This model never creates an order or a key.
export const CART_STORAGE_KEY = 'hlf.cart.v1'
export type CartItem = { id: string; name: string; quantity: number; acceptedPriceVnd: string }
export type CartDraft = { version: 1; restaurant: { id: string; name: string }; items: CartItem[] }
export type CartRestaurant = { id: string; name: string; is_active: boolean; is_open: boolean; is_accepting_orders: boolean }
export type CartDish = { id: string; restaurant_id: string; name: string; price_vnd: string; is_available: boolean }
export type CartCatalog = { restaurant(id: string, signal?: AbortSignal): Promise<CartRestaurant>; dish(id: string, signal?: AbortSignal): Promise<CartDish> }
const id = (v: unknown): v is string => typeof v === 'string' && /^[1-9][0-9]{0,18}$/.test(v) && BigInt(v) <= 9223372036854775807n
const money = (v: unknown): v is string => typeof v === 'string' && /^(0|[1-9][0-9]{0,9})$/.test(v) && BigInt(v) <= 1000000000n
const name = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0 && [...v].length <= 200
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
const keys = (v: Record<string, unknown>, expected: string[]) => Object.keys(v).length === expected.length && expected.every(k => k in v)
export function parseDraft(raw: string | null): CartDraft | null {
  if (!raw || raw.length > 128000) return null
  try {
    const v: unknown = JSON.parse(raw)
    if (!record(v) || !keys(v, ['version', 'restaurant', 'items']) || v.version !== 1 || !record(v.restaurant) ||
      !keys(v.restaurant, ['id', 'name']) || !id(v.restaurant.id) || !name(v.restaurant.name) || !Array.isArray(v.items) || v.items.length < 1 || v.items.length > 50) return null
    const items: CartItem[] = []
    for (const item of v.items) {
      if (!record(item) || !keys(item, ['id', 'name', 'quantity', 'acceptedPriceVnd']) || !id(item.id) || !name(item.name) || !money(item.acceptedPriceVnd) ||
        !Number.isInteger(item.quantity) || (item.quantity as number) < 1 || (item.quantity as number) > 99 || items.some(i => i.id === item.id)) return null
      items.push({ id: item.id, name: item.name, quantity: item.quantity as number, acceptedPriceVnd: item.acceptedPriceVnd })
    }
    if (items.reduce((n, i) => n + i.quantity, 0) > 200) return null
    return { version: 1, restaurant: { id: v.restaurant.id, name: v.restaurant.name }, items }
  } catch { return null }
}
export function itemCount(draft: CartDraft | null) { return draft?.items.reduce((n, i) => n + i.quantity, 0) ?? 0 }
export function subtotal(draft: CartDraft | null): string {
  return (draft?.items.reduce((n, i) => n + BigInt(i.acceptedPriceVnd) * BigInt(i.quantity), 0n) ?? 0n).toString()
}
export function orderable(restaurant: CartRestaurant) { return restaurant.is_active && restaurant.is_open && restaurant.is_accepting_orders }
function checked(draft: CartDraft): CartDraft {
  const valid = parseDraft(JSON.stringify(draft))
  if (!valid) throw new Error('Giỏ tối đa 50 món khác nhau, 200 phần và 99 phần mỗi món. Hãy kiểm tra số lượng.')
  return valid
}
export function addDish(draft: CartDraft | null, restaurant: CartRestaurant, dish: CartDish): CartDraft {
  if (!orderable(restaurant) || !dish.is_available || dish.restaurant_id !== restaurant.id) throw new Error('Món hoặc quán hiện chưa nhận thêm món vào giỏ.')
  if (draft && draft.restaurant.id !== restaurant.id) throw new Error('Cần xác nhận thay giỏ trước khi chọn quán khác.')
  const items = draft?.items ?? []
  const existing = items.find(i => i.id === dish.id)
  return checked({ version: 1, restaurant: draft?.restaurant ?? { id: restaurant.id, name: restaurant.name },
    items: existing ? items.map(i => i.id === dish.id ? { ...i, quantity: i.quantity + 1 } : i)
      : [...items, { id: dish.id, name: dish.name, quantity: 1, acceptedPriceVnd: dish.price_vnd }] })
}
export function setQuantity(draft: CartDraft, id: string, quantity: number): CartDraft {
  return checked({ ...draft, items: draft.items.map(i => i.id === id ? { ...i, quantity } : i) })
}
export function removeItem(draft: CartDraft, id: string): CartDraft | null {
  const items = draft.items.filter(i => i.id !== id)
  return items.length ? { ...draft, items } : null
}

export type CartState = { draft: CartDraft | null; notice: string; pending: { restaurant: CartRestaurant; dish: CartDish } | null }
export type CartAction = { type: 'add'; restaurant: CartRestaurant; dish: CartDish }
  | { type: 'quantity'; id: string; quantity: number } | { type: 'remove'; id: string }
  | { type: 'replace'; draft: CartDraft | null } | { type: 'clear' | 'cancel-switch' | 'confirm-switch' }
  | { type: 'accept-prices'; restaurantId: string; prices: Record<string, string> }
// Resolve queued actions against the latest state, including rapid repeated clicks.
export function cartReducer(state: CartState, action: CartAction): CartState {
  const { draft } = state
  try {
    switch (action.type) {
      case 'add': {
        addDish(null, action.restaurant, action.dish) // Validate eligibility before asking for a switch.
        if (draft && draft.restaurant.id !== action.restaurant.id) return { ...state, pending: { restaurant: action.restaurant, dish: action.dish } }
        return { ...state, draft: addDish(draft, action.restaurant, action.dish), notice: `Đã thêm ${action.dish.name} vào giỏ.` }
      }
      case 'quantity': return draft ? { ...state, draft: setQuantity(draft, action.id, action.quantity), notice: '' } : state
      case 'remove': return draft ? { ...state, draft: removeItem(draft, action.id), notice: '' } : state
      case 'clear': return { draft: null, notice: 'Đã xóa giỏ.', pending: null }
      case 'replace': return { draft: action.draft, notice: '', pending: null }
      case 'cancel-switch': return { ...state, pending: null }
      case 'confirm-switch': return state.pending ? { draft: addDish(null, state.pending.restaurant, state.pending.dish), pending: null, notice: 'Đã đổi quán trong giỏ.' } : state
      case 'accept-prices': return draft?.restaurant.id === action.restaurantId ? { ...state,
        draft: checked({ ...draft, items: draft.items.map(i => action.prices[i.id] !== undefined ? { ...i, acceptedPriceVnd: action.prices[i.id] } : i) }),
        notice: 'Đã xác nhận giá hiện tại. Chưa có đơn hàng nào được gửi.' } : state
    }
  } catch (error) { return { ...state, pending: null, notice: error instanceof Error ? error.message : 'Chưa cập nhật được giỏ.' } }
}
