import type { CSSProperties } from 'react'
import { Icon, type IconName } from '../../shared/ui/Icon'
import type { Guide } from './api'
import './owner-overview.css'

const stepIcons: Record<string, IconName> = { profile: 'shop', hours: 'clock', menu: 'book', delivery: 'delivery', commission: 'briefcase', activation: 'check', accepting: 'orders' }
function settingsLink(href: string) {
  return /^\/owner#(?:profile|hours|accepting)$/.test(href) ? href.replace('/owner#', '/owner/settings#') : href
}
export function OwnerOverview({ restaurantId, guide, error, loading, onRefresh }: {
  restaurantId: string; guide: Guide | null; error: string; loading: boolean; onRefresh: () => void
}) {
  const done = guide?.steps.filter(step => step.complete).length ?? 0
  const total = guide?.steps.length ?? 0
  const accepting = guide?.steps.find(step => step.key === 'accepting')?.complete
  const title = guide?.orderable ? 'Quán đã sẵn sàng đón đơn mới' : guide?.public_visible ? accepting ? 'Hẹn khách trong giờ mở cửa' : 'Sẵn sàng khi bạn bật nhận đơn' : 'Sẵn sàng hơn để đón đơn mới'
  const state = !guide ? 'Đang kiểm tra trạng thái' : guide.orderable ? 'Đang nhận đơn' : guide.public_visible ? accepting ? 'Ngoài giờ mở cửa' : 'Đã đủ cấu hình · Chưa nhận đơn' : 'Cần hoàn thiện thiết lập'
  const shortcuts: { href: string; icon: IconName; title: string; description: string }[] = [
    { href: '/owner/menu', icon: 'book', title: 'Quản lý thực đơn', description: 'Cập nhật món và trạng thái bán' },
    { href: '/owner/restaurants/' + restaurantId + '/orders', icon: 'orders', title: 'Xem đơn của quán', description: 'Theo dõi các đơn hiện tại' },
    { href: '/owner/settings#hours', icon: 'clock', title: 'Thiết lập giờ mở cửa', description: 'Điều chỉnh lịch nhận đơn' },
    { href: '/owner/delivery', icon: 'delivery', title: 'Kiểm tra phí giao hàng', description: 'Xem trạng thái phê duyệt' },
  ]
  return <section className="owner-overview" aria-labelledby="owner-title" aria-busy={loading}>
    <header className="workspace-page-heading owner-overview-heading"><div><span className="workspace-eyebrow">Trung tâm vận hành</span><h1 id="owner-title">Tổng quan quán</h1><p>Theo dõi điều kiện mở bán và các việc cần ưu tiên.</p></div>
      {guide && <div className="managed-restaurant"><span><Icon name="shop" /></span><div><small>Quán đang quản lý</small><strong>{guide.name}</strong></div></div>}
    </header>
    {error && <div className="overview-error" role="alert"><Icon name="alert" /><div><p>Không tải được trạng thái hiện tại. {error}</p>{guide && <p>Dữ liệu từ lần tải thành công trước; hãy cập nhật trước khi thao tác.</p>}<button onClick={onRefresh} disabled={loading}>Thử lại</button></div></div>}
    {!guide ? !error && <div className="overview-loading" role="status"><span>Đang tải điều kiện mở bán…</span><div className="overview-skeleton overview-skeleton--banner" /><div className="overview-skeleton" /><div className="overview-skeleton" /></div> : <>
      <div className="owner-status-banner"><div className="owner-banner-mark"><Icon name="shop" /></div><div className="owner-banner-copy"><span>{guide.name}</span><h2>{title}</h2><p>{total > done ? `Còn ${total - done} điều kiện cần hoàn tất để quán vận hành đầy đủ.` : 'Các điều kiện thiết lập đã hoàn tất. Khách đặt trong giờ mở cửa.'}</p></div>
        <div className="owner-banner-status"><span className={`readiness-badge readiness-badge--${guide.orderable ? 'done' : 'todo'}`}>{state}</span><button onClick={onRefresh} disabled={loading}><Icon name="reset" />{loading ? 'Đang cập nhật…' : 'Làm mới trạng thái'}</button></div>
      </div>
      <div className="owner-overview-grid">
        <section className="workspace-card owner-readiness" aria-labelledby="readiness-title">
          <div className="owner-readiness-head"><div><span className="workspace-eyebrow">Điều kiện mở bán</span><h2 id="readiness-title">Hoàn thiện thiết lập quán</h2><p>Mỗi bước đều dựa trên trạng thái hiện tại của quán.</p></div>
            {total > 0 && <div className="readiness-ring" style={{ '--readiness-progress': `${done / total * 100}%` } as CSSProperties}><div><strong>{done}/{total}</strong><span>hoàn tất</span></div></div>}
          </div>
          <progress className="readiness-progress" aria-label="Tiến độ hoàn thiện thiết lập quán" max={total || 1} value={done}>{done}/{total}</progress>
          <p className="overview-availability">{guide.public_visible ? 'Đã đủ điều kiện hiện trên trang chủ' : 'Chưa đủ điều kiện hiện trên trang chủ'} · {guide.orderable ? 'Hiện có thể nhận đơn.' : 'Chưa thể nhận đơn lúc này.'}</p>
          <ol className="readiness-steps">{guide.steps.map((step, index) => {
            const status = step.complete ? 'done' : step.assignee === 'admin' ? 'waiting' : 'todo'
            return <li key={step.key} className="readiness-step"><span className={`readiness-step-icon readiness-step-icon--${status}`}><Icon name={stepIcons[step.key] ?? 'info'} /></span>
              <div className="readiness-step-copy"><div><h3>{index + 1}. {step.title}</h3><span className={`readiness-badge readiness-badge--${status}`}>{step.status}</span></div><p>{step.description}</p></div>
              {!step.complete && step.assignee === 'owner' && <a className="readiness-action" href={settingsLink(step.href)} aria-label={'Thiết lập: ' + step.title}>Thiết lập<Icon name="chevron" /></a>}
            </li>
          })}</ol>
        </section>
        <aside className="workspace-card owner-quick-actions" aria-labelledby="quick-actions-title"><div className="workspace-card-title"><div><h2 id="quick-actions-title">Thao tác nhanh</h2><p>Đến thẳng công việc cần xử lý.</p></div></div>
          {shortcuts.map(link => <a key={link.href} className="owner-shortcut" href={link.href}><span><Icon name={link.icon} /></span><div><strong>{link.title}</strong><small>{link.description}</small></div><Icon name="chevron" /></a>)}
          <a href="/support?workspace=owner" className="owner-support-note"><Icon name="help" /><div><strong>Bạn cần trợ giúp?</strong><p>Tìm hỗ trợ theo từng đơn hàng cụ thể.</p></div></a>
        </aside>
      </div>
    </>}
  </section>
}
