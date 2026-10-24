import type { ReactNode } from 'react'
import type { User } from '../../features/auth'
import { WorkspaceLayout } from './WorkspaceLayout'

export function RoleLayout({ user, children, title, path }: { user: User; children: ReactNode; title: string; path: string }) {
  if (!user.capabilities.includes('admin')) return <WorkspaceLayout user={user} path={path} owner={Boolean(user.managed_restaurant_id)}>{children}</WorkspaceLayout>
  const home = user.capabilities.includes('admin') ? '/admin' : '/owner'
  return <div className={`role-layout role-layout--${user.capabilities.includes('admin') ? 'admin' : 'restaurant_owner'}`}>
    <aside className="role-sidebar" aria-label="Điều hướng">
      <a href={home} className="brand">Hòa Lạc <span>Food</span></a>
      <p className="role-label">{title}</p>
      <nav aria-label="Điều hướng chính">
        {!user.is_active?<><RoleNavLink path={path} href="/">Khám phá quán</RoleNavLink><RoleNavLink path={path} href="/orders">Đơn mua của tôi</RoleNavLink>{user.managed_restaurant_id&&<><RoleNavLink path={path} href={'/owner/restaurants/'+user.managed_restaurant_id+'/orders'}>Đơn của quán</RoleNavLink><RoleNavLink path={path} href="/owner/finance">Công nợ và báo cáo</RoleNavLink></>}<RoleNavLink path={path} href="/support">Hỗ trợ theo đơn</RoleNavLink><RoleNavLink path={path} href="/privacy">Ẩn thông tin cá nhân</RoleNavLink><RoleNavLink path={path} href="/account">Tài khoản</RoleNavLink></>:<>
        <RoleNavLink path={path} href="/">Khám phá quán</RoleNavLink>
        <RoleNavLink path={path} href="/cart">Giỏ hàng</RoleNavLink>
        {!user.capabilities.includes('admin')&&<RoleNavLink path={path} href="/orders">Đơn mua của tôi</RoleNavLink>}
        {user.managed_restaurant_id&&<RoleNavLink path={path} href={'/owner/restaurants/'+user.managed_restaurant_id+'/orders'}>Đơn của quán</RoleNavLink>}
        <RoleNavLink path={path} href="/notifications">Hộp thư thông báo</RoleNavLink>
        <RoleNavLink path={path} href={home}>Tổng quan</RoleNavLink>
        {user.capabilities.includes('admin') ? <RoleNavLink path={path} href="/admin/applications">Hồ sơ mở quán</RoleNavLink> : <RoleNavLink path={path} href="/open-restaurant">Hồ sơ mở quán</RoleNavLink>}
        {user.capabilities.includes('admin') && <RoleNavLink path={path} href="/admin/restaurants">Quản lý quán</RoleNavLink>}
        <RoleNavLink path={path} href={home==='/admin'?'/admin/categories':'/owner/menu'}>{home==='/admin'?'Danh mục món':'Thực đơn'}</RoleNavLink>
        <RoleNavLink path={path} href={home+'/payments'}>QR và hoàn tiền</RoleNavLink>
        <RoleNavLink path={path} href={home+'/delivery'}>Giao hàng VJU</RoleNavLink>
        <RoleNavLink path={path} href={home==='/admin'?'/admin/commissions':'/owner/commission'}>Thỏa thuận hoa hồng</RoleNavLink>
        <RoleNavLink path={path} href={home==='/admin'?'/admin/settlements':'/owner/finance'}>Công nợ và báo cáo</RoleNavLink>
        <RoleNavLink path={path} href={user.capabilities.includes('admin')?'/admin/support':'/support'}>Hỗ trợ theo đơn</RoleNavLink>
        {user.capabilities.includes('admin')&&<><RoleNavLink path={path} href="/admin/users">Quản trị tài khoản</RoleNavLink><RoleNavLink path={path} href="/admin/audit">Tra cứu audit</RoleNavLink></>}
        <RoleNavLink path={path} href="/account">Tài khoản</RoleNavLink>

        </>}
      </nav>
    </aside>
    <main id="main-content" className="role-main" tabIndex={-1}>{!user.is_active&&<p role="alert">Tài khoản đã đình chỉ. Chỉ xử lý đơn cũ, hoàn tiền, công nợ và hỗ trợ.</p>}{children}</main>
  </div>
}

function RoleNavLink({href,path,children}:{href:string;path:string;children:ReactNode}) {
  const current=path===href || href==='/admin/settlements'&&path==='/admin/reports'
  return <a href={href} aria-current={current?'page':undefined}>{children}</a>
}
