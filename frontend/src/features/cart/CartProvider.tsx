import type { ReactNode } from 'react'
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog'
import type { CartCatalog } from './model'
import { CartContext, useCartState } from './use-cart'

export function CartProvider({ catalog, children }: { catalog: CartCatalog; children: ReactNode }) {
  const cart = useCartState(catalog)
  return <CartContext.Provider value={cart}>{children}
    {cart.pending && <ConfirmDialog title="Đổi quán trong giỏ?" confirmLabel="Xóa giỏ cũ và thêm món" onCancel={cart.cancelSwitch} onConfirm={cart.confirmSwitch}>
      <p>Giỏ {cart.draft?.restaurant.name} đang có {cart.count} phần. Chọn {cart.pending.restaurant.name} sẽ xóa toàn bộ món trong giỏ cũ.</p>
    </ConfirmDialog>}
  </CartContext.Provider>
}
