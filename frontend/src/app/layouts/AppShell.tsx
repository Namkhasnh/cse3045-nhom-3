import type { ReactNode } from 'react'
import type { User } from '../../features/auth'
import { SiteHeader } from './SiteHeader'
import { SiteFooter } from './SiteFooter'
import './figma-home.css'
import './site-shell.css'
export function AppShell({ children, user, pending, cartCount, path, onOpenCart }: { children: ReactNode; user: User | null; pending: boolean; cartCount: number; path: string; onOpenCart?: () => void }) {
  return <div className="app-shell"><a className="skip-link" href="#main-content">Đến nội dung chính</a><SiteHeader key={user?.id ?? 'guest'} user={user} pending={pending} cartCount={cartCount} path={path} onOpenCart={onOpenCart} /><div className="app-body">{children}</div><SiteFooter user={user} compact={!/^\/(owner|admin)(\/|$)/.test(path) && !(['/account','/notifications','/support','/privacy'].includes(path) && Boolean(user?.managed_restaurant_id || user?.capabilities.includes('admin')))} /></div>
}
