import type { ReactNode } from 'react'
import { Button } from '../../shared/ui/Button'
import { Icon } from '../../shared/ui/Icon'
import { Photo } from '../../shared/ui/Photo'
import { formatVnd } from '../../shared/lib/format'
import { useCart } from './use-cart'
import { orderable } from './model'
import './cart-page.css'

export function CartPage({ delivery, action, fee, total, hint }: {
  delivery: ReactNode; action: ReactNode; fee: string | null; total: string | null; hint: string
}) {
  const cart = useCart()
  const { draft, current } = cart
  const restaurant = current?.restaurant
  const eligible = restaurant?.status === 'ready' && orderable(restaurant.value)
  const changed = draft?.items.some(item => { const d = current?.dishes[item.id]; return d?.status === 'ready' && d.value.price_vnd !== item.acceptedPriceVnd })
  const priceReadable = current && restaurant?.status === 'ready' && draft?.items.every(i => current.dishes[i.id]?.status === 'ready')
  const focusTitle = () => requestAnimationFrame(() => document.getElementById('cart-title')?.focus())
  return <section className="cart-redesign" aria-labelledby="cart-title">
    <nav className="cart-breadcrumb" aria-label="Đường dẫn"><a href="/">Trang chủ</a><span>/</span><span aria-current="page">Giỏ hàng</span></nav>
    <header className="cart-intro"><div><p className="cart-eyebrow">BỮA NGON SẮP SẴN SÀNG</p><h1 id="cart-title" tabIndex={-1}>Giỏ hàng của bạn</h1><p>Kiểm tra món ngon trước khi đặt nhé!</p></div>{draft && <div className="cart-count"><Icon name="bag" /><div><strong>{draft.items.length} loại món · {cart.count} phần</strong><small>Đơn từ một quán</small></div></div>}</header>
    {!draft ? <div className="cart-empty"><span className="cart-empty-icon"><Icon name="bag" /></span><h2>Giỏ hàng đang trống</h2><p>Chọn món bạn thích để bắt đầu bữa ngon.</p><a className="button button--primary" href="/">Khám phá quán <Icon name="arrow" /></a></div> : <div className="cart-grid">
      <div className="cart-main">
        <div className="cart-shop"><span className="cart-shop-icon"><Icon name="bowl" /></span><div><small>Đơn hàng từ</small><h2>{draft.restaurant.name}</h2></div><a href={`/restaurants/${draft.restaurant.id}`}>Xem quán <Icon name="arrow" /></a></div>
        <div className="cart-list-heading"><h2>Món đã chọn</h2><small>Giá hiển thị là tạm tính</small></div>
        {cart.issue && <div className="cart-warning" role="status"><Icon name="alert" /><p>{cart.issue}</p></div>}
        <ul className="cart-product-list">{draft.items.map(item => {
          const result = current?.dishes[item.id]
          const dish = result?.status === 'ready' ? result.value : null
          return <li key={item.id} className="cart-product" data-dish-id={item.id}>
            <div className="cart-product-photo">{dish?.image_reference ? <Photo key={dish.image_reference} src={dish.image_reference} alt={item.name} /> : <div className="cart-photo-fallback" role="img" aria-label={`Chưa có ảnh ${item.name}`}><Icon name="bowl" /><span>Chưa có ảnh món</span></div>}</div>
            <div className="cart-product-content"><div className="cart-product-heading"><h3>{item.name}</h3><button className="cart-remove" type="button" aria-label={`Xóa ${item.name}`} onClick={() => { cart.remove(item.id); requestAnimationFrame(() => document.querySelector<HTMLButtonElement>('.cart-undo button')?.focus()) }}><Icon name="trash" /></button></div>
              {dish?.description && <p className="cart-description">{dish.description}</p>}
              <p className="cart-unit-price"><strong>{formatVnd(item.acceptedPriceVnd)}</strong> / phần</p>
              {dish && dish.price_vnd !== item.acceptedPriceVnd && <p className="cart-warning" role="alert">Giá thay đổi: {formatVnd(item.acceptedPriceVnd)} → {formatVnd(dish.price_vnd)}</p>}
              {result?.status === 'missing' && <p className="cart-warning" role="alert">Món không còn công khai. Bạn có thể xóa món khỏi giỏ.</p>}
              {result?.status === 'error' && <p className="cart-warning" role="alert">Chưa tải được món. Hãy thử kiểm tra lại.</p>}
              {dish && !dish.is_available && <p className="cart-warning" role="alert">Món đang tạm hết.</p>}
              <div className="cart-product-bottom"><div className="cart-stepper" role="group" aria-label={`Số lượng ${item.name}`}>
                <button type="button" aria-label={`Giảm ${item.name}`} disabled={item.quantity <= 1} onClick={() => cart.quantity(item.id, item.quantity - 1)}>−</button>
                <input aria-label={`Số phần ${item.name}`} type="number" inputMode="numeric" min="1" max="99" step="1" value={item.quantity} onChange={e => cart.quantity(item.id, Number(e.target.value))} />
                <button type="button" aria-label={`Tăng ${item.name}`} disabled={item.quantity >= 99 || cart.count >= 200} onClick={() => cart.quantity(item.id, item.quantity + 1)}>+</button>
              </div><div className="cart-line-total"><small>Thành tiền</small><strong>{formatVnd((BigInt(item.acceptedPriceVnd) * BigInt(item.quantity)).toString())}</strong></div></div>
            </div>
          </li>
        })}</ul>
        {changed && <div className="cart-warning cart-consent" role="alert"><p>Giá hiện tại đã thay đổi. Chỉ cập nhật giá đã chọn khi bạn xác nhận.</p><Button disabled={!priceReadable || !eligible} onClick={cart.acceptPrices}>Chấp nhận giá hiện tại</Button></div>}
        <div className="cart-bottom-actions"><a href={`/restaurants/${draft.restaurant.id}`}>← Chọn thêm món tại {draft.restaurant.name}</a><Button variant="neutral" onClick={cart.refresh}>Kiểm tra lại giỏ</Button><Button variant="neutral" onClick={() => { cart.clear(); focusTitle() }}>Xóa toàn bộ giỏ</Button></div>
      </div>
      <aside className="cart-order-summary" aria-labelledby="cart-summary-title"><div className="cart-summary-heading"><span><Icon name="bag" /></span><div><p className="cart-eyebrow">ĐƠN HÀNG CỦA BẠN</p><h2 id="cart-summary-title">Tóm tắt đơn hàng</h2></div></div>
        {delivery}
        <dl className="cart-totals"><div><dt>Tạm tính món</dt><dd>{formatVnd(cart.subtotal)}</dd></div><div><dt>Phí giao hàng</dt><dd>{fee === null ? 'Chưa xác định' : formatVnd(fee)}</dd></div><div className="cart-grand-total"><dt>Tổng ước tính<small>{total === null ? 'Chọn điểm nhận để xem tổng' : 'Theo giá và phí đã kiểm tra'}</small></dt><dd>{total === null ? '—' : formatVnd(total)}</dd></div></dl>
        <p className="cart-estimate-note"><Icon name="info" />Giá và phí giao hàng sẽ được hệ thống kiểm tra lại trước khi tạo đơn.</p>
        <div className="cart-summary-action">{action}</div><p className="cart-action-hint">{hint}</p>
        <a className="cart-recovery-link" href="/checkout">Mở trang xác nhận / khôi phục</a>
      </aside>
      <div className="cart-mobile-bar"><div><small>Tổng ước tính</small><strong>{total === null ? 'Chưa xác định' : formatVnd(total)}</strong></div>{action}</div>
    </div>}
    {cart.undo && <div className="cart-undo"><span role="status">Đã xóa {cart.undo.name}</span><button type="button" onClick={() => { cart.undoRemove(); focusTitle() }}>Hoàn tác</button><small>Trong 5 giây</small></div>}
  </section>
}
