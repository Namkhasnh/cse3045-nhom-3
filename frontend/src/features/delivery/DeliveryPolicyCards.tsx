import {Icon} from '../../shared/ui/Icon'
import {formatVnd} from '../../shared/lib/format'
import type {Point, Policy} from './api'
import {metresToKilometres, rateIsUsable} from './delivery-draft'

const statuses: Record<string, string> = {submitted: 'Chờ duyệt', approved: 'Đã duyệt', rejected: 'Từ chối'}
const distance = (metres: number) => metresToKilometres(metres).replace('.', ',') + ' km'

export function DeliveryPolicyCards({kind, policy, points}: {kind: 'approved' | 'history'; policy: Policy; points: Point[]}) {
  const name = (id: string) => points.find(point => point.id === id)?.name ?? `Điểm #${id}`
  if (kind === 'approved') return <section className="delivery-panel delivery-approved" aria-labelledby="delivery-approved-heading">
    <div className="delivery-section-head"><span className="delivery-kicker">Cấu hình hiện tại</span><h2 id="delivery-approved-heading">Điểm giao hàng đang áp dụng</h2><p>Chỉ áp dụng các điểm có khảo sát được phê duyệt và còn hợp lệ.</p></div>
    {!policy.pickup_rates.length ? <div className="delivery-empty"><span className="delivery-stat-icon"><Icon name="pin"/></span><h3>Chưa có điểm giao hàng được duyệt</h3><p>Đề xuất đã gửi cần được quản trị viên phê duyệt trước khi phí giao hàng có hiệu lực.</p></div> : <ul className="delivery-approved-list">{policy.pickup_rates.map(rate => <li key={rate.pickup_point_id} className="delivery-approved-item"><span className="delivery-pin"><Icon name="pin"/></span><div><strong>{name(rate.pickup_point_id)}</strong><p>{distance(rate.distance_m)} <span aria-hidden="true">·</span> {formatVnd(rate.delivery_fee_vnd)}</p><span className={`delivery-badge ${rateIsUsable(rate, points) ? 'is-approved' : 'is-inactive'}`}>{rateIsUsable(rate, points) ? 'Đã xác minh' : !rate.is_enabled ? 'Đã tắt phục vụ' : 'Cần xác minh lại'}</span></div></li>)}</ul>}
    <div className="delivery-info"><Icon name="help"/><div><strong>Quy trình phê duyệt</strong><p>Khoảng cách và mức phí bạn khảo sát sẽ được kiểm tra trước khi áp dụng cho khách hàng.</p></div></div>
  </section>
  return <section className="delivery-panel delivery-history" aria-labelledby="delivery-history-heading">
    <div className="delivery-section-head"><h2 id="delivery-history-heading">Trạng thái đề xuất</h2><p>Theo dõi tiến trình xét duyệt tối đa 100 cấu hình gần nhất đã gửi.</p></div>
    {!policy.proposals.length ? <div className="delivery-compact-empty"><Icon name="clock"/><div><strong>Chưa có đề xuất nào</strong><p>Các đề xuất bạn gửi sẽ được hiển thị tại đây để tiện theo dõi.</p></div></div> : <ol className="delivery-proposal-list">{policy.proposals.map(proposal => <li key={proposal.id} className="delivery-history-item"><span className={`delivery-timeline-icon delivery-badge is-${proposal.status}`}><Icon name={proposal.status === 'approved' ? 'check' : proposal.status === 'rejected' ? 'close' : 'clock'}/></span><div><div className="delivery-proposal-meta"><h3>Đề xuất #{proposal.id}</h3><span className={`delivery-badge is-${proposal.status}`}>{statuses[proposal.status] ?? 'Chưa xác định trạng thái'}</span></div><div className="delivery-proposal-points">{proposal.pickup_rates.length ? proposal.pickup_rates.map(rate => <div key={rate.pickup_point_id}><strong>{name(rate.pickup_point_id)}</strong><span>{distance(rate.distance_m)} · {formatVnd(rate.delivery_fee_vnd)}{!rate.is_enabled && ' · Ngừng phục vụ'}</span></div>) : <p>Đề xuất ngừng phục vụ toàn bộ điểm giao.</p>}</div>{proposal.review && <div className="delivery-review"><p><strong>Phản hồi quản trị viên:</strong> {proposal.review.note}</p><time dateTime={proposal.review.created_at}>Xét duyệt lúc {new Date(proposal.review.created_at).toLocaleString('vi-VN', {timeZone: 'Asia/Ho_Chi_Minh'})}</time></div>}</div></li>)}</ol>}
  </section>
}
