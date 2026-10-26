import { useEffect, useRef, useState } from 'react'
import { safeReturnPath, type User } from '../../features/auth'
import { NotificationBell } from '../../features/notifications'
import { Icon } from '../../shared/ui/Icon'
import { SiteBrand } from './SiteBrand'
import { LoginBrand } from '../../shared/ui/LoginBrand'
import { initials } from '../../shared/lib/initials'

type Props = { user: User | null; pending: boolean; cartCount: number; path: string; onOpenCart?: () => void; onLogout: () => Promise<void> }
export function SiteHeader({ user, pending, cartCount, path, onOpenCart, onLogout }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [logoutBusy, setLogoutBusy] = useState(false)
  const [logoutError, setLogoutError] = useState('')
  const header = useRef<HTMLElement>(null)
  const mobileButton = useRef<HTMLButtonElement>(null)
  const accountButton = useRef<HTMLButtonElement>(null)
  const active = user?.is_active
  const admin = Boolean(user?.capabilities.includes('admin'))
  const canBuy = Boolean(user?.capabilities.includes('buy'))
  const canHistory = canBuy || Boolean(user?.capabilities.includes('obligations'))
  const returnPath = window.location.pathname + window.location.search + window.location.hash
  const authReturn = ['/login', '/register', '/verify-email', '/recover-access'].includes(path)
    ? safeReturnPath(new URLSearchParams(window.location.search).get('returnTo')) : path === '/preview' ? null : safeReturnPath(returnPath)
  const authLink = (route: string) => !authReturn || authReturn === '/' ? route : `${route}?returnTo=${encodeURIComponent(authReturn)}`
  const management = !active ? null : admin ? { href: '/admin', label: 'Quản trị' }
    : user.managed_restaurant_id ? { href: '/owner', label: 'Quán của tôi' }
    : { href: '/open-restaurant', label: 'Mở quán ăn' }
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      if (accountOpen) { setAccountOpen(false); accountButton.current?.focus() }
      else if (mobileOpen) { setMobileOpen(false); mobileButton.current?.focus() }
    }
    function outside(event: PointerEvent) {
      if (event.target instanceof Node && !header.current?.contains(event.target)) { setAccountOpen(false); setMobileOpen(false) }
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', outside)
    const query = window.matchMedia(path === '/login' ? '(min-width: 901px)' : '(min-width: 1181px)')
    const closeMobile = () => { if (query.matches) setMobileOpen(false) }
    query.addEventListener('change', closeMobile)
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('pointerdown', outside); query.removeEventListener('change', closeMobile) }
  }, [accountOpen, mobileOpen, path])
  const links = <><a href="/" aria-current={path === '/' && !window.location.hash ? 'page' : undefined}>Trang chủ</a><a href="/#dishes">Khám phá món ăn</a><a href="/#restaurants">Quán ăn</a></>
  const accountLinks = <>
    <div className="account-links-identity"><strong>{user?.display_name}</strong><span>{user?.login_identifier}</span></div>
    <a href="/account"><Icon name="user" />Tài khoản cá nhân</a>
    {active && (admin || user?.managed_restaurant_id && user.capabilities.includes('manage_restaurant')) && <a href={admin ? '/admin' : '/owner'}><Icon name="shop" />{admin ? 'Quản trị' : 'Quản lý quán'}</a>}
    {canHistory && <a href="/orders"><Icon name="orders" />Lịch sử mua hàng</a>}
    {active && <a href="/notifications">Hộp thư thông báo</a>}
    <a href={admin ? '/admin/support' : '/support'}>Trợ giúp</a>
    <a href="/privacy">Quyền riêng tư</a>
    <button type="button" disabled={logoutBusy} onClick={async () => { if (logoutBusy) return; setLogoutBusy(true); setLogoutError(''); try { await onLogout() } catch { setLogoutError('Không thể đăng xuất. Vui lòng thử lại.') } finally { setLogoutBusy(false) } }}><Icon name="logout" />{logoutBusy ? 'Đang đăng xuất…' : 'Đăng xuất'}</button>
    {logoutError && <p role="alert">{logoutError}</p>}
  </>
  return <header className="nav-shell" ref={header} onClick={event => {
    if (event.target instanceof Element && event.target.closest('a')) { setMobileOpen(false); setAccountOpen(false) }
  }}>
    <div className="nav design-container">
      {path === '/login' ? <LoginBrand /> : <SiteBrand />}
      <nav className="nav-links" aria-label="Điều hướng chính">{links}</nav>
      <div className="nav-utilities">
        <a className="nav-search" href="/#hero-search" aria-label="Tìm kiếm món ăn"><Icon name="search" /></a>
        {(!user || active && canBuy) && (onOpenCart ? <button type="button" onClick={onOpenCart} aria-haspopup="dialog" className="nav-search cart-link" aria-label={`Giỏ hàng${cartCount ? `, ${cartCount} phần` : ''}`}><Icon name="bag" />{cartCount > 0 && <span className="cart-badge">{cartCount}</span>}</button> : <a className="nav-search cart-link" href="/cart" aria-label={`Giỏ hàng${cartCount ? `, ${cartCount} phần` : ''}`}><Icon name="bag" />{cartCount > 0 && <span className="cart-badge">{cartCount}</span>}</a>)}
        {active && <NotificationBell />}
      </div>
      <div className="nav-actions header-actions">
        {pending ? <span role="status" className="session-pending">Đang kiểm tra tài khoản…</span> : user ? <>
          {management && <a className="header-link" href={management.href}>{management.label}</a>}
          <div className="account-disclosure" onBlur={event => { if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) setAccountOpen(false) }}>
            <button className="account-toggle" ref={accountButton} aria-label={'Menu tài khoản ' + user.display_name} aria-expanded={accountOpen} aria-controls="account-links" onClick={() => setAccountOpen(!accountOpen)}><span className="header-avatar" aria-hidden="true">{initials(user.display_name)}</span><span>{user.display_name}</span><span aria-hidden="true">⌄</span></button>
            {accountOpen && <nav id="account-links" className="account-links" aria-label="Tài khoản">{accountLinks}</nav>}
          </div>
        </> : <><a className="header-link login" aria-current={path === '/login' ? 'page' : undefined} href={authLink('/login')}>Đăng nhập</a><a className="design-button design-button--small" href={authLink('/register')}>Đăng ký <Icon name="arrow" /></a></>}
      </div>
      <button className="mobile-menu-button" ref={mobileButton} aria-controls="site-mobile-menu" aria-expanded={mobileOpen} aria-label={mobileOpen ? 'Đóng menu' : 'Mở menu'} onClick={() => setMobileOpen(!mobileOpen)}><Icon name={mobileOpen ? 'close' : 'menu'} /></button>
    </div>
    {mobileOpen && <nav id="site-mobile-menu" className="mobile-menu" aria-label="Menu di động">{links}<a href="/#hero-search">Tìm kiếm món ăn</a>
      {pending ? <p role="status">Đang kiểm tra tài khoản…</p> : user ? <>{management && <a href={management.href}>{management.label}</a>}{accountLinks}</> : <div className="mobile-menu__actions"><a href={authLink('/login')}>Đăng nhập</a><a className="design-button design-button--small" href={authLink('/register')}>Đăng ký</a></div>}
    </nav>}
  </header>
}
