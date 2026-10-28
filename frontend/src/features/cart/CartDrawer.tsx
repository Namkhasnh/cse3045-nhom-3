import { useEffect, useRef } from 'react'
import { useCart } from './use-cart'
import { formatVnd } from '../../shared/lib/format'
import { Icon } from '../../shared/ui/Icon'
import './cart-drawer.css'
export function CartDrawer({ onClose, recentOnly = false }: { onClose: () => void; recentOnly?: boolean }) {
  const cart = useCart(), ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current!, previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog.showModal()
    return () => { dialog.close(); document.body.style.overflow = overflow; if (previous?.isConnected) previous.focus() }
  }, [])
  const groups = recentOnly ? cart.recentGroups : cart.groups
  const count = recentOnly ? cart.recentCount : cart.count
  const subtotal = recentOnly ? cart.recentSubtotal : cart.subtotal
  const changed = groups.flatMap(g=>g.items).some(item => { const d = cart.current?.dishes[item.id]; return d?.status === 'ready' && d.value.price_vnd !== item.acceptedPriceVnd })
  return <dialog className="cart-drawer" ref={ref} aria-labelledby="drawer-title" onCancel={event => { event.preventDefault(); onClose() }} onClick={event => { if (event.target === event.currentTarget) { const r = event.currentTarget.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) onClose() } }}>
    <div className="cart-drawer-inner"><div className="cart-drawer-heading"><div><p>BỮA NGON BẠN CHỌN</p><h2 id="drawer-title">{recentOnly ? 'Món vừa thêm' : 'Giỏ hàng'} <span>({count})</span></h2></div><button autoFocus type="button" aria-label="Đóng giỏ hàng" onClick={onClose}><Icon name="close" /></button></div>
    {!groups.length ? <div className="cart-drawer-empty"><Icon name="bag" /><h3>Giỏ hàng đang trống</h3><p>Chọn món bạn thích để bắt đầu bữa ngon.</p><button className="button button--primary" onClick={onClose}>Tiếp tục xem món</button></div> : <>
      <div className="cart-drawer-scroll"><a className="cart-drawer-restaurant" href={`/cart`}><Icon name="bowl" />{groups.length} quán trong giỏ</a>
        {cart.issue && <p className="cart-drawer-warning" role="status">{cart.issue}</p>}{cart.storageWarning && <p role="alert">{cart.storageWarning}</p>}
        <ul>{groups.flatMap(g=>g.items).map(item => { const result = cart.current?.dishes[item.id], dish = result?.status === 'ready' ? result.value : null
          return <li key={item.id}><div className="cart-drawer-item-title"><h3>{item.name}</h3>{!recentOnly && <button aria-label={`Xóa ${item.name}`} onClick={() => cart.remove(item.id)}>Xóa</button>}</div><p>{formatVnd(item.acceptedPriceVnd)} / phần</p>
            {dish && dish.price_vnd !== item.acceptedPriceVnd && <p className="cart-drawer-warning">Giá hiện tại: {formatVnd(dish.price_vnd)}. Cần xác nhận lại trong trang giỏ.</p>}
            {dish && !dish.is_available && <p role="alert">Món đang tạm hết.</p>}{result?.status === 'missing' && <p role="alert">Món không còn công khai.</p>}{result?.status === 'error' && <p role="alert">Chưa tải được món.</p>}
            <div className="cart-drawer-item-bottom">{recentOnly ? <span>{item.quantity} phần vừa thêm</span> : <div className="cart-drawer-quantity"><button aria-label={`Giảm ${item.name}`} disabled={item.quantity <= 1} onClick={() => cart.quantity(item.id, item.quantity - 1)}>−</button><span aria-label={`Số phần ${item.name}: ${item.quantity}`}>{item.quantity}</span><button aria-label={`Tăng ${item.name}`} disabled={item.quantity >= 99} onClick={() => cart.quantity(item.id, item.quantity + 1)}>+</button></div>}<strong>{formatVnd((BigInt(item.acceptedPriceVnd) * BigInt(item.quantity)).toString())}</strong></div>
          </li> })}</ul><button className="cart-drawer-refresh" onClick={cart.refresh}>Kiểm tra lại giá và tình trạng món</button>
      </div>
      <div className="cart-drawer-summary">{changed && <p role="alert">Giá món đã thay đổi. Giỏ giữ giá đã chọn đến khi bạn xác nhận.</p>}<div><span>{recentOnly ? 'Tiền món vừa thêm' : 'Tạm tính tiền món'}</span><strong>{formatVnd(subtotal)}</strong></div><p>Ước tính theo giá đã chọn · Chưa xác định phí giao.</p><a className="button button--primary" href="/cart">{recentOnly ? 'Xem toàn bộ giỏ hàng' : 'Tiếp tục đến giỏ hàng'} <Icon name="arrow" /></a><button onClick={onClose}>Chọn thêm món</button></div>
    </>}
    </div>
  </dialog>
}
