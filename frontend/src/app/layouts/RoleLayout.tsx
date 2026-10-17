import type { ReactNode } from 'react'
import type { User } from '../../features/auth'

export function RoleLayout({ user, children, title, path }: { user: User; children: ReactNode; title: string; path: string }) {
  const home = user.role === 'admin' ? '/admin' : '/owner'
  return <div className={`role-layout role-layout--${user.role}`}>
    <a className="skip-link" href="#main-content">Đến nội dung chính</a>
    <aside className="role-sidebar" aria-label="Điều hướng">
      <a href={home} className="brand">Hòa Lạc <span>Food</span></a>
      <p className="role-label">{title}</p>
      <nav aria-label="Điều hướng chính">
        <a href={home} aria-current={path === home ? 'page' : undefined}>Tổng quan</a>
        <a href="/account" aria-current={path === '/account' ? 'page' : undefined}>Tài khoản</a>
        {user.role === 'admin' && <a href="/admin/role-requests" aria-current={path === '/admin/role-requests' ? 'page' : undefined}>Yêu cầu cấp quyền</a>}
      </nav>
    </aside>
    <main id="main-content" className="role-main" tabIndex={-1}>{children}</main>
  </div>
}
