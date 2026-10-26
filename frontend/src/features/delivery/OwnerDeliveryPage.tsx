import {useState, type FormEvent} from 'react'
import {Icon, type IconName} from '../../shared/ui/Icon'
import {Input} from '../../shared/ui/Input'
import {availableDrafts, draftErrors, rateIsUsable} from './delivery-draft'
import {useOwnerDelivery} from './use-owner-delivery'
import {DeliveryPolicyCards} from './DeliveryPolicyCards'
import './owner-delivery.css'

export function OwnerDeliveryPage(props: {actor: string; restaurantId: string}) {
  return <OwnerDelivery key={`${props.actor}:${props.restaurantId}`} {...props}/>
}

function OverviewCard({icon, label, value, detail, tone = ''}: {icon: IconName; label: string; value: string | number; detail: string; tone?: string}) {
  return <article className={`delivery-stat ${tone}`}><span className="delivery-stat-icon"><Icon name={icon}/></span><div><span>{label}</span><strong>{value}</strong><p>{detail}</p></div></article>
}

function OwnerDelivery({actor, restaurantId}: {actor: string; restaurantId: string}) {
  const state = useOwnerDelivery(actor, restaurantId)
  const {points, policy, drafts, setDrafts, loading, error, notice, needsReview, fresh, command, pendingHere} = state
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [allowStop, setAllowStop] = useState(false)
  const selected = availableDrafts(points, drafts)
  const usable = policy?.pickup_rates.filter(rate => rateIsUsable(rate, points)) ?? []
  const pendingCount = policy?.proposals.filter(proposal => proposal.status === 'submitted').length ?? 0
  const invalid = selected.some(draft => Object.values(draftErrors(draft)).some(Boolean))
  const stopping = Boolean(policy?.pickup_rates.some(rate => rate.is_enabled)) && !selected.some(draft => draft.enabled)
  const disabled = command.busy || Boolean(command.pending) || loading || !fresh || needsReview
  const unavailable = drafts.length !== selected.length
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (disabled) return
    if (invalid) {
      setTouched(Object.fromEntries(selected.flatMap(draft => [[`km-${draft.pickup_point_id}`, true], [`fee-${draft.pickup_point_id}`, true]])))
      requestAnimationFrame(() => document.querySelector<HTMLInputElement>('.owner-delivery [aria-invalid="true"]')?.focus())
      return
    }
    if (stopping && !allowStop) return
    void state.send()
  }
  return <section className="owner-delivery" aria-labelledby="delivery-heading">
    <header className="delivery-heading">
      <div><span className="delivery-kicker">Vận hành giao hàng</span><h1 id="delivery-heading">Quản lý giao hàng</h1><p>Thiết lập điểm giao, khoảng cách và phí vận chuyển tại VJU.</p></div>
      <div className="delivery-head-actions"><span className={`delivery-config ${usable.length ? 'is-ready' : ''}`}><i/>{!policy ? loading ? 'Đang tải cấu hình' : 'Chưa tải được cấu hình' : usable.length ? 'Đã có cấu hình được duyệt' : policy.pickup_rates.length ? 'Cấu hình chưa dùng được' : 'Chưa có cấu hình được duyệt'}</span><button className="delivery-button delivery-refresh" disabled={loading || command.busy} onClick={() => void state.refresh()}><Icon name="reset" className={loading ? 'is-spinning' : ''}/>{loading ? 'Đang cập nhật' : 'Cập nhật'}</button></div>
    </header>
    {notice && <p className="delivery-feedback is-success" role="status"><Icon name="check"/>{notice}</p>}
    {error && <div className="delivery-feedback is-error" role="alert"><Icon name="alert"/><div>{error}{policy && <p>Dữ liệu có thể đã cũ. Bản nháp của bạn được giữ nguyên.{notice && ' Đề xuất đã được ghi nhận; chỉ cần tải lại dữ liệu.'}</p>}</div><button className="delivery-button" disabled={loading || command.busy} onClick={() => void state.refresh()}>Thử lại</button></div>}
    {command.pending && <div className="delivery-feedback" role="status"><Icon name="info"/><div>{pendingHere ? 'Chưa rõ kết quả gửi đề xuất. Hãy cập nhật trạng thái hoặc thử lại đúng yêu cầu; không tạo yêu cầu mới.' : 'Có yêu cầu giao hàng chưa rõ kết quả của ngữ cảnh quán trước. Hãy mở lại đúng quán để khôi phục.'}</div>{pendingHere && <button className="delivery-button" disabled={command.busy || loading} onClick={() => void state.send(true)}>Thử lại đúng yêu cầu</button>}</div>}
    {needsReview && <div className="delivery-feedback delivery-conflict" role="alert"><Icon name="alert"/><div><strong>Cấu hình đã thay đổi. Kiểm tra trước khi gửi lại.</strong><p>Bản nháp được giữ nguyên. Đối chiếu với cấu hình hiện tại ở phần điểm giao đang áp dụng.</p></div><button className="delivery-button" disabled={!fresh || loading || command.busy || Boolean(command.pending)} onClick={state.acknowledge}>Đã kiểm tra, tiếp tục với bản nháp</button></div>}
    {!policy ? loading ? <div className="delivery-loading" role="status"><span className="sr-only">Đang tải cấu hình giao hàng…</span><div className="delivery-overview">{[0,1,2].map(i => <div key={i} className="delivery-skeleton"/>)}</div><div className="delivery-skeleton delivery-skeleton-panel"/></div> : <div className="delivery-panel delivery-empty"><span className="delivery-stat-icon"><Icon name="delivery"/></span><h2>Chưa tải được cấu hình giao hàng</h2><p>Hãy thử lại khi kết nối và quyền quản lý quán đã sẵn sàng.</p></div> : <>
      <div className="delivery-overview" aria-label="Tổng quan giao hàng">
        <OverviewCard icon="pin" label="Điểm giao đang áp dụng" value={usable.length} detail={usable.length ? 'Điểm có khảo sát hợp lệ' : 'Chưa có điểm được duyệt'}/>
        <OverviewCard icon="clock" label="Đề xuất chờ duyệt" value={pendingCount} detail={pendingCount ? 'Đang chờ quản trị viên xét duyệt' : 'Không có đề xuất chờ duyệt'} tone="is-amber"/>
        <OverviewCard icon="delivery" label="Trạng thái giao hàng" value={usable.length ? 'Đã thiết lập' : policy.pickup_rates.length ? 'Cần kiểm tra' : 'Chưa thiết lập'} detail={usable.length ? 'Đã có điểm giao hợp lệ' : 'Cần cấu hình được phê duyệt'} tone={usable.length ? 'is-green' : ''}/>
      </div>
      <div className="delivery-content-grid">
        <div className="delivery-primary-column">
          <section className="delivery-panel delivery-proposal" aria-labelledby="delivery-proposal-heading">
            <div className="delivery-section-head"><span className="delivery-kicker">Khảo sát thực tế</span><h2 id="delivery-proposal-heading">Đề xuất điểm giao hàng</h2><p>Cập nhật khoảng cách và phí vận chuyển thực tế để gửi quản trị viên xét duyệt.</p></div>
            <form noValidate onSubmit={submit}>
              <fieldset disabled={disabled}><legend className="sr-only">Chọn điểm và nhập khảo sát giao hàng</legend>
                {!points.some(point => point.is_active) && <div className="delivery-compact-empty"><Icon name="pin"/><div><strong>Chưa có điểm giao khả dụng</strong><p>Điểm giao cố định sẽ xuất hiện khi được quản trị viên thiết lập.</p></div></div>}
                <div className="delivery-location-options">{points.filter(point => point.is_active).map(point => {
                  const draft = drafts.find(row => row.pickup_point_id === point.id), errors = draft ? draftErrors(draft) : null
                  const patch = (value: Partial<NonNullable<typeof draft>>) => setDrafts(rows => rows.map(row => row.pickup_point_id === point.id ? {...row, ...value} : row))
                  return <div className={`delivery-location${draft ? ' is-selected' : ''}`} key={point.id}>
                    <label className="delivery-location-choice"><span className="delivery-pin"><Icon name="pin"/></span><span><strong>{point.name}</strong><small>Điểm giao cố định tại VJU</small></span><input className="delivery-location-check" type="checkbox" aria-label={`Chọn ${point.name}`} checked={Boolean(draft)} onChange={event => {setAllowStop(false); setDrafts(rows => event.target.checked ? [...rows, {pickup_point_id: point.id, km: '', fee: '', enabled: true}] : rows.filter(row => row.pickup_point_id !== point.id))}}/></label>
                    {draft && <div className="delivery-location-fields">
                      <div><Input id={`delivery-km-${point.id}`} label="Khoảng cách (km)" inputMode="decimal" value={draft.km} placeholder="Ví dụ: 1,25" error={touched[`km-${point.id}`] ? errors?.km : ''} onBlur={() => setTouched(old => ({...old, [`km-${point.id}`]: true}))} onChange={event => patch({km: event.target.value})}/><small>Từ 0 đến 1.000 km · chính xác đến mét</small></div>
                      <div><Input id={`delivery-fee-${point.id}`} label="Phí giao (VND)" inputMode="numeric" value={draft.fee} placeholder="Ví dụ: 5000" error={touched[`fee-${point.id}`] ? errors?.fee : ''} onBlur={() => setTouched(old => ({...old, [`fee-${point.id}`]: true}))} onChange={event => patch({fee: event.target.value})}/><small>Nhập số nguyên; phí 0 VND hợp lệ</small></div>
                      <label className="delivery-enable"><input type="checkbox" checked={draft.enabled} onChange={event => {setAllowStop(false); patch({enabled: event.target.checked})}}/>Phục vụ điểm này</label>
                    </div>}
                  </div>
                })}</div>
                {unavailable && <p className="delivery-warning">Một số điểm trong bản nháp không còn hoạt động. Các điểm này sẽ không được gửi trong đề xuất mới.</p>}
                {stopping && <label className="delivery-stop delivery-warning"><input type="checkbox" checked={allowStop} onChange={event => setAllowStop(event.target.checked)}/><span>Tôi hiểu đề xuất này sẽ ngừng phục vụ toàn bộ điểm giao nếu được duyệt. Cấu hình hiện tại vẫn áp dụng trong thời gian chờ.</span></label>}
                <footer className="delivery-submit-row"><div><strong>{selected.length} điểm đã chọn</strong><p>Đề xuất chỉ có hiệu lực sau khi quản trị viên phê duyệt.</p></div><button className="delivery-button delivery-submit" type="submit" disabled={disabled || invalid || stopping && !allowStop || !selected.length && !policy.pickup_rates.length}><Icon name={command.busy ? 'reset' : 'check'} className={command.busy ? 'is-spinning' : ''}/>{command.busy ? 'Đang gửi đề xuất…' : 'Gửi đề xuất phê duyệt'}</button></footer>
              </fieldset>
            </form>
          </section>
          <DeliveryPolicyCards kind="history" policy={policy} points={points}/>
        </div>
        <DeliveryPolicyCards kind="approved" policy={policy} points={points}/>
      </div>
      <span className="sr-only" aria-live="polite">{loading ? 'Đang cập nhật cấu hình giao hàng' : ''}</span>
    </>}
  </section>
}
