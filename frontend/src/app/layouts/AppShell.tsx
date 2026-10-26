import type { ReactNode } from 'react'
import type { User } from '../../features/auth'
import { SiteHeader } from './SiteHeader'
import { SiteFooter } from './SiteFooter'
import './figma-home.css'
import './site-shell.css'
import './login-shell.css'
const currentYear = new Date().getFullYear()
export function AppShell({ children, user, pending, cartCount, path, onOpenCart, onLogout }: { children: ReactNode; user: User | null; pending: boolean; cartCount: number; path: string; onOpenCart?: () => void; onLogout: () => Promise<void> }) {
  const workspace = /^\/(?:owner|admin)(?:\/|$)/.test(path) || ['/account', '/notifications', '/support', '/privacy', '/orders'].includes(path) || /^\/orders\/[1-9][0-9]*$/.test(path)
  return <div className={`app-shell${path === '/login' ? ' app-shell--login' : ''}${workspace ? ' app-shell--workspace' : ''}`}><a className="skip-link" href="#main-content">Đến nội dung chính</a><SiteHeader key={user?.id ?? 'guest'} user={user} pending={pending} cartCount={cartCount} path={path} onOpenCart={onOpenCart} onLogout={onLogout} /><div className="app-body">{children}</div>{workspace ? <footer className="workspace-footer">© {currentYear} Hoa Lac Food · VJU, Hòa Lạc</footer> : <SiteFooter user={user} login={path === '/login'} compact={!/^\/(owner|admin)(\/|$)/.test(path) && !(['/account','/notifications','/support','/privacy'].includes(path) && Boolean(user?.capabilities.includes('admin')))} />}</div>
}
