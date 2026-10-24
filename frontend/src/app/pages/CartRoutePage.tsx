import { useState } from 'react'
import { CartPage, useCart } from '../../features/cart'
import { useCartDelivery } from '../../features/delivery'
import { Button } from '../../shared/ui/Button'
import { Icon } from '../../shared/ui/Icon'

export function CartRoutePage({ accountId, sessionPending, canQuote }: { accountId: string | null; sessionPending: boolean; canQuote: boolean }) {
  const cart = useCart()
  const changed = cart.draft?.items.some(item => { const result = cart.current?.dishes[item.id]; return result?.status === 'ready' && result.value.price_vnd !== item.acceptedPriceVnd })
  const delivery = useCartDelivery(accountId, cart.draft?.restaurant.id ?? '', cart.draft ? JSON.stringify(cart.draft) : '', canQuote)
  const [handoffError, setHandoffError] = useState('')
  const ready = !cart.issue && !changed && Boolean(delivery.quote) && !sessionPending && canQuote
  const hint = sessionPending ? 'Đang kiểm tra tài khoản…' : !accountId ? 'Đăng nhập để kiểm tra phí giao và tiếp tục đặt món.' : !canQuote ? 'Tài khoản này không có quyền lấy báo phí đặt hàng.' : cart.issue || (changed ? 'Vui lòng xác nhận giá mới trước khi tiếp tục.' : delivery.busy ? 'Đang kiểm tra phí giao…' : delivery.expired ? 'Báo phí đã hết hạn. Hãy kiểm tra lại phí giao.' : delivery.error ? 'Chưa kiểm tra được phí giao. Vui lòng thử lại.' : !delivery.quote ? 'Vui lòng chọn điểm nhận và chờ phí giao hàng được xác nhận.' : 'Bạn sẽ xác nhận thông tin nhận món ở bước tiếp theo.')
  const action = !accountId && !sessionPending ? <a className="button button--primary" href="/login?returnTo=%2Fcart">Đăng nhập để đặt hàng <Icon name="arrow" /></a> : <Button disabled={!ready} onClick={() => {
    try { delivery.remember(); window.location.assign('/checkout') }
    catch { setHandoffError('Không lưu được điểm nhận trong phiên. Hãy thử lại hoặc mở trang xác nhận để chọn lại điểm nhận.') }
  }}>{ready ? 'Tiếp tục đặt món' : sessionPending ? 'Đang kiểm tra tài khoản…' : cart.issue ? 'Vui lòng xem lại giỏ' : changed ? 'Cần xác nhận giá mới' : delivery.busy ? 'Đang kiểm tra phí…' : !delivery.point ? 'Chọn điểm nhận để tiếp tục' : 'Chưa thể tiếp tục'}<Icon name="arrow" /></Button>
  const selector = <div className="cart-delivery"><div className="cart-delivery-heading"><Icon name="pin" /><div><h3>Điểm nhận hàng</h3><p>Chọn điểm nhận tại VJU</p></div></div>
    <label htmlFor="cart-point">Chọn điểm nhận</label><select id="cart-point" value={delivery.point} disabled={delivery.pointsLoading || Boolean(delivery.pointsError)} onChange={e => { delivery.setPoint(e.target.value); setHandoffError('') }}><option value="">Chọn điểm nhận hàng</option>{delivery.points.filter(p => p.is_active).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
    {delivery.pointsLoading ? <p role="status">Đang tải điểm nhận…</p> : delivery.pointsError ? <p role="alert">Chưa tải được điểm nhận: {delivery.pointsError}</p> : !delivery.points.length ? <p>Chưa có điểm nhận khả dụng.</p> : <p>Phí giao hàng được quán tính theo điểm nhận đã chọn.</p>}
    {(delivery.pointsError || !delivery.pointsLoading && !delivery.points.length) && <Button variant="neutral" onClick={delivery.reloadPoints}>Tải lại điểm nhận</Button>}
    {delivery.busy && <p role="status">Đang kiểm tra phí giao…</p>}{delivery.error && <p role="alert">{delivery.error} Chưa xác định được phí giao.</p>}
    {delivery.expired && <p role="alert">Báo phí đã hết hạn.</p>}{delivery.quote && <p className="cart-delivery-confirmed" role="status">✓ Đã kiểm tra phí giao cho điểm nhận này.</p>}
    {(delivery.error || delivery.expired) && <Button variant="neutral" onClick={delivery.retry}>Kiểm tra lại phí giao</Button>}
    {handoffError && <p role="alert">{handoffError}</p>}
  </div>
  const fee = delivery.quote?.delivery_fee_vnd ?? null
  return <CartPage delivery={selector} action={action} fee={fee} total={fee === null ? null : (BigInt(cart.subtotal) + BigInt(fee)).toString()} hint={hint} />
}
