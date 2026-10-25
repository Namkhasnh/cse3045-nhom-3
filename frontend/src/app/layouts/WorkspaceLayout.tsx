import { useEffect, useRef, useState, type ReactNode, type MouseEvent } from 'react'
import type { User } from '../../features/auth'
import { Icon, type IconName } from '../../shared/ui/Icon'
import './workspace.css'

type Item = { href: string; label: string; icon: IconName }
type Group = { title?: string; items: Item[] }
export function WorkspaceLayout({ user, path, owner = false, admin = false, children }: {
  user: User; path: string; owner?: boolean; admin?: boolean; children: ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [tooltip, setTooltip] = useState<{ label: string; top: number; left: number } | null>(null)
  const drawer = useRef<HTMLDialogElement>(null)
  const opener = useRef<HTMLButtonElement>(null)
  const label = admin ? 'Quản trị hệ thống' : owner ? 'Quản lý quán' : 'Tài khoản cá nhân'
  const canAdmin = user.is_active && user.capabilities.includes('admin')
  const canManage = Boolean(user.managed_restaurant_id && user.is_active && user.capabilities.includes('manage_restaurant'))
  const orders: Item = { href: '/owner/restaurants/' + user.managed_restaurant_id + '/orders', label: 'Đơn của quán', icon: 'orders' }
  const support: Item = { href: '/support?workspace=owner', label: 'Hỗ trợ theo đơn', icon: 'help' }
  const groups: Group[] = admin ? user.is_active ? [
    { title: 'Tổng quan', items: [{ href: '/admin', label: 'Tổng quan', icon: 'home' }] },
    { title: 'Đối tác và danh mục', items: [{ href: '/admin/applications', label: 'Hồ sơ mở quán', icon: 'briefcase' }, { href: '/admin/restaurants', label: 'Quản lý quán', icon: 'shop' }, { href: '/admin/categories', label: 'Danh mục món', icon: 'book' }] },
    { title: 'Vận hành', items: [{ href: '/admin/delivery', label: 'Giao hàng VJU', icon: 'delivery' }, { href: '/admin/payments', label: 'Thanh toán đơn cũ', icon: 'qr' }, { href: '/notifications?workspace=admin', label: 'Hộp thư thông báo', icon: 'inbox' }] },
    { title: 'Tài chính', items: [{ href: '/admin/commissions', label: 'Thỏa thuận hoa hồng', icon: 'briefcase' }, { href: '/admin/settlements', label: 'Công nợ và báo cáo', icon: 'wallet' }] },
    { title: 'Quản trị', items: [{ href: '/admin/users', label: 'Quản trị tài khoản', icon: 'user' }, { href: '/admin/audit', label: 'Tra cứu audit', icon: 'search' }, { href: '/admin/support', label: 'Hỗ trợ theo đơn', icon: 'help' }] },
  ] : [{ items: [{ href: '/support', label: 'Hỗ trợ theo đơn', icon: 'help' }] }] : owner ? user.is_active ? [
    { title: 'Tổng quan', items: [{ href: '/owner', label: 'Tổng quan', icon: 'home' }] },
    { title: 'Quản lý quán', items: [{ href: '/owner/settings', label: 'Cài đặt quán', icon: 'settings' }, { href: '/owner/menu', label: 'Thực đơn', icon: 'book' }, orders] },
    { title: 'Vận hành', items: [{ href: '/owner/delivery', label: 'Giao hàng VJU', icon: 'delivery' }, { href: '/owner/payments', label: 'Thanh toán đơn cũ', icon: 'qr' }] },
    { title: 'Tài chính', items: [{ href: '/owner/vouchers', label: 'Mã ưu đãi', icon: 'briefcase' }, { href: '/owner/commission', label: 'Thỏa thuận hoa hồng', icon: 'briefcase' }, { href: '/owner/finance', label: 'Công nợ và báo cáo', icon: 'wallet' }] },
    { title: 'Hỗ trợ', items: [support] },
  ] : [{ title: 'Nghĩa vụ hiện có', items: [orders, { href: '/owner/finance', label: 'Công nợ và báo cáo', icon: 'wallet' }, support] }] : [{ items: [
    { href: '/account', label: 'Hồ sơ cá nhân', icon: 'user' },
    ...(user.capabilities.some(c => c === 'buy' || c === 'obligations') ? [{ href: '/orders', label: 'Đơn mua của tôi', icon: 'orders' as const }] : []),
    { href: '/support', label: 'Hỗ trợ đơn hàng', icon: 'help' },
    { href: '/privacy', label: 'Quyền riêng tư', icon: 'settings' },
  ] }]

  useEffect(() => {
    const query = window.matchMedia('(min-width: 1024px)')
    const closeOnDesktop = () => { if (query.matches) drawer.current?.close() }
    query.addEventListener('change', closeOnDesktop)
    return () => { query.removeEventListener('change', closeOnDesktop); document.body.classList.remove('workspace-drawer-open') }
  }, [])
  useEffect(() => { drawer.current?.close() }, [path, owner, admin])

  function closeDrawer() { drawer.current?.close(); document.body.classList.remove('workspace-drawer-open'); opener.current?.focus() }
  function navigate(event: MouseEvent<HTMLElement>) {
    const link = event.target instanceof Element ? event.target.closest('a') : null
    if (!link || event.defaultPrevented || event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target || link.hasAttribute('download')) return
    const url = new URL(link.href)
    if (url.origin !== location.origin || url.pathname === location.pathname && url.search === location.search && url.hash) return
    event.preventDefault()
    setTooltip(null)
    closeDrawer()
    window.history.pushState(null, '', url.pathname + url.search + url.hash)
    window.dispatchEvent(new PopStateEvent('popstate'))
    window.scrollTo({ top: 0, behavior: 'instant' })
    if (!url.hash) requestAnimationFrame(() => document.getElementById('main-content')?.focus({ preventScroll: true }))
  }
  function showTip(element: HTMLElement, text: string) {
    if (!collapsed || !window.matchMedia('(min-width: 1024px)').matches) return
    const rect = element.getBoundingClientRect()
    setTooltip({ label: text, top: rect.top + rect.height / 2, left: rect.right + 12 })
  }
  function navLink(item: Item) {
    const current = path === item.href.split('?')[0] || item.href === '/orders' && /^\/orders\/[1-9][0-9]*$/.test(path) || item.href === '/admin/settlements' && path === '/admin/reports'
    return <a key={item.href} href={item.href} aria-label={item.label} aria-current={current ? 'page' : undefined}
      onMouseEnter={e => showTip(e.currentTarget, item.label)} onMouseLeave={() => setTooltip(null)}
      onFocus={e => showTip(e.currentTarget, item.label)} onBlur={() => setTooltip(null)}>
      <Icon name={item.icon} /><span className="workspace-link-label">{item.label}</span>
    </a>
  }
  function navigation(mobile = false) {
    return <>
      <div className="workspace-head"><span className="workspace-icon"><Icon name={admin ? 'settings' : owner ? 'shop' : 'user'} /></span><div className="workspace-copy"><small>Không gian làm việc</small><strong>{label}</strong></div>
        {mobile && <button className="workspace-close" aria-label="Đóng điều hướng" onClick={closeDrawer}><Icon name="close" /></button>}
      </div>
      <nav className="workspace-nav" aria-label={label} onScroll={() => setTooltip(null)}>{groups.map((group, i) => <div className="workspace-nav-group" key={group.title ?? i}>
        {group.title && <p className="workspace-nav-heading">{group.title}</p>}{group.items.map(navLink)}
      </div>)}</nav>
      <div className="workspace-bottom">
        {admin || owner ? navLink({ href: '/account', label: 'Tài khoản cá nhân', icon: 'user' }) : canAdmin ? navLink({ href: '/admin', label: 'Chuyển sang quản trị', icon: 'settings' }) : canManage ? navLink({ href: '/owner', label: 'Chuyển sang quản lý quán', icon: 'shop' }) : user.is_active && user.capabilities.includes('apply_for_restaurant') ? navLink({ href: '/open-restaurant', label: 'Hồ sơ mở quán', icon: 'shop' }) : null}
        {!mobile && <button className="workspace-collapse" aria-label={collapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'} aria-expanded={!collapsed}
          onClick={() => { setCollapsed(!collapsed); setTooltip(null) }}><Icon name="chevron" /><span className="workspace-link-label">Thu gọn</span></button>}
      </div>
    </>
  }
  return <div className={`workspace-layout${collapsed ? ' workspace-layout--collapsed' : ''}${admin ? ' workspace-layout--admin' : ''}`} data-workspace={admin ? 'admin' : owner ? 'owner' : 'personal'} onClick={navigate}>
    <aside className="workspace-sidebar">{navigation()}</aside>
    <button ref={opener} className="workspace-mobile-trigger" aria-haspopup="dialog" onClick={() => { drawer.current?.showModal(); document.body.classList.add('workspace-drawer-open') }}><Icon name="menu" /><span>{label}</span></button>
    <dialog ref={drawer} className="workspace-drawer" aria-label={'Điều hướng ' + label} onClose={closeDrawer}
      onKeyDown={event => {
        if (event.key !== 'Tab') return
        const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('a[href],button:not(:disabled),[tabindex="0"]')).filter(element => element.getClientRects().length > 0)
        const first = controls[0], last = controls.at(-1)
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
      }}
      onClick={e => { if (e.target === drawer.current) { const rect = e.currentTarget.getBoundingClientRect(); if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) closeDrawer() } }}>
      {navigation(true)}
    </dialog>
    <main id="main-content" className="workspace-main" tabIndex={-1}>
      {!user.is_active && <p className="form-notice" role="alert">Tài khoản đã đình chỉ. Chỉ xử lý đơn cũ, hoàn tiền, công nợ và hỗ trợ.</p>}
      <div key={path} className="workspace-page">{children}</div>
    </main>
    {tooltip && <span className="workspace-tooltip" role="tooltip" style={{ top: tooltip.top, left: tooltip.left }}>{tooltip.label}</span>}
  </div>
}
