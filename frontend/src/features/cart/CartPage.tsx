import { Button } from '../../shared/ui/Button'
import { formatVnd } from '../../shared/lib/format'
import { useCart } from './use-cart'
import { orderable } from './model'

export function CartPage({ authenticated, sessionPending,delivery }: { authenticated: boolean; sessionPending: boolean;delivery?:React.ReactNode }) {
  const cart = useCart()
  const { draft, current } = cart
  if (!draft) return <section className="cart-page"><h1>Giỏ hàng</h1><p>Giỏ hàng đang trống.</p><a className="button button--primary" href="/">Khám phá quán</a></section>
  const restaurant = current?.restaurant
  const eligible = restaurant?.status === 'ready' && orderable(restaurant.value)
  const changed = draft.items.some(item => { const d = current?.dishes[item.id]; return d?.status === 'ready' && d.value.price_vnd !== item.acceptedPriceVnd })
  const priceReadable = current && restaurant?.status === 'ready' && draft.items.every(i => current.dishes[i.id]?.status === 'ready')
  return <section className="cart-page" aria-labelledby="cart-title">
    <h1 id="cart-title">Giỏ hàng</h1>
    <a className="cart-restaurant" href={`/restaurants/${draft.restaurant.id}`}>{draft.restaurant.name}</a>
    <p>{draft.items.length} loại món · {cart.count} phần</p>
    {!current ? <p role="status">Đang kiểm tra giá và tình trạng món…</p> : restaurant?.status === 'error' ? <p role="alert">Chưa kiểm tra được quán. Giỏ được giữ nguyên.</p>
      : restaurant?.status === 'missing' ? <p role="alert">Quán không còn công khai. Giỏ được giữ để bạn xem lại.</p>
        : !eligible && <p role="alert">Quán đang đóng cửa hoặc tạm ngưng nhận đơn.</p>}
    <Button variant="neutral" onClick={cart.refresh}>Kiểm tra lại giỏ</Button>
    <ul className="cart-items">{draft.items.map(item => {
      const result = current?.dishes[item.id]
      const dish = result?.status === 'ready' ? result.value : null
      return <li key={item.id} className="cart-item">
        <h2>{item.name}</h2>
        <p>Giá đã chọn: {formatVnd(item.acceptedPriceVnd)} / phần</p>
        {dish && dish.price_vnd !== item.acceptedPriceVnd && <p className="cart-price-change">Giá thay đổi: {formatVnd(item.acceptedPriceVnd)} → {formatVnd(dish.price_vnd)}</p>}
        {result?.status === 'missing' && <p role="alert">Món không còn công khai. Bạn có thể xóa món khỏi giỏ.</p>}
        {result?.status === 'error' && <p role="alert">Chưa tải được món. Hãy thử kiểm tra lại.</p>}
        {dish && !dish.is_available && <p role="alert">Món đang tạm hết.</p>}
        <div className="cart-quantity">
          <Button variant="neutral" aria-label={`Giảm ${item.name}`} disabled={item.quantity <= 1} onClick={() => cart.quantity(item.id, item.quantity - 1)}>−</Button>
          <label>Số phần {item.name}<input type="number" inputMode="numeric" min="1" max="99" step="1" value={item.quantity} onChange={event => cart.quantity(item.id, Number(event.target.value))} /></label>
          <Button variant="neutral" aria-label={`Tăng ${item.name}`} disabled={item.quantity >= 99} onClick={() => cart.quantity(item.id, item.quantity + 1)}>+</Button>
          <Button variant="neutral" aria-label={`Xóa ${item.name}`} onClick={() => cart.remove(item.id)}>Xóa món</Button>
        </div>
        <p>Tạm tính món: {formatVnd((BigInt(item.acceptedPriceVnd) * BigInt(item.quantity)).toString())}</p>
      </li>
    })}</ul>
    {changed && <div className="cart-price-notice" role="alert"><p>Giá hiện tại đã thay đổi. Chỉ cập nhật giá đã chọn khi bạn xác nhận.</p><Button disabled={!priceReadable || !eligible} onClick={cart.acceptPrices}>Chấp nhận giá hiện tại</Button></div>}
    <div className="cart-summary"><h2>Tạm tính tiền món (ước tính)</h2><p className="restaurant-price">{formatVnd(cart.subtotal)}</p><p>Theo giá đã chọn · Chưa gồm phí giao.</p>{delivery??<p>Phí giao: Chưa xác định được phí giao</p>}
      {sessionPending ? <p role="status">Đang kiểm tra tài khoản…</p> : authenticated ? <a className="button button--primary" href="/checkout">Tiếp tục đặt món</a>
        : <a className="button button--primary" href="/login?returnTo=%2Fcart">Đăng nhập để đặt hàng</a>}
    </div>
    <div className="cart-actions"><Button variant="neutral" onClick={cart.clear}>Xóa toàn bộ giỏ</Button><a href={`/restaurants/${draft.restaurant.id}`}>Chọn thêm món</a></div>
  </section>
}
