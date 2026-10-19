import type { ReactNode } from 'react'
import { Icon, type IconName } from '../../shared/ui/Icon'

const unavailableNavigation: { label: string; icon: IconName }[] = [
  { label: 'Giỏ hàng', icon: 'bag' },
  { label: 'Đơn hàng', icon: 'orders' },
]

export function StudentLayout({ children, path = '/', preview = false, accountName, sessionPending = false, management, authReturnPath }: {
  authReturnPath?: string
  children: ReactNode
  path?: string
  preview?: boolean
  accountName?: string
  sessionPending?: boolean
  management?: { href: string; label: string }
}) {
  const authLink = (route: string) => authReturnPath && authReturnPath !== '/' ? `${route}?returnTo=${encodeURIComponent(authReturnPath)}` : route
  return <div className="student-layout">
    <a className="skip-link" href="#main-content">Đến nội dung chính</a>
    <header className="site-header">
      <div className="page-container brand-row">
        <a href="/" className="brand" aria-label="Hòa Lạc Food — Trang chủ"><span className="brand-mark"><Icon name="bowl" /></span><span>Hòa Lạc <span className="text-brand">Food</span></span></a>
        <nav className="header-actions" aria-label="Tài khoản và quản lý">
          {sessionPending ? <span className="session-pending" role="status">Đang kiểm tra tài khoản…</span> : accountName ? <>
            {management && <a className="header-link" href={management.href}>{management.label}</a>}
            <a className="button button--neutral account-link" href="/account"><Icon name="user" /><span>{accountName}</span></a>
          </> : <>
            <a className="header-link" href={authLink('/login')}>Đăng nhập</a>
            <a className="button button--primary" href={authLink('/register')}>Đăng ký</a>
          </>}
        </nav>
      </div>
    </header>
    <main id="main-content" className="page-container main-content" tabIndex={-1}>
      {children}
      <footer className="page-footer"><p>Hòa Lạc Food · VJU</p></footer>
    </main>
    <nav className="student-nav" aria-label="Điều hướng chính">
      <div className="page-container nav-items">
        <a href={preview ? '/preview' : '/'} aria-current={path === '/' || path === '/preview' ? 'page' : undefined}><Icon name="home" /><span>Trang chủ</span></a>
        {unavailableNavigation.map(item => <button key={item.label} type="button" disabled aria-describedby="nav-unavailable"><Icon name={item.icon} /><span>{item.label}</span><span className="nav-soon">Sắp có</span></button>)}
        <a href={accountName ? '/account' : authLink('/login')} aria-current={path === '/account' ? 'page' : undefined}><Icon name="user" /><span>{accountName ? 'Tài khoản' : 'Đăng nhập'}</span></a>
      </div>
      <p id="nav-unavailable" className="nav-explanation">Giỏ hàng và đơn hàng chưa khả dụng.</p>
    </nav>
  </div>
}
