import type { ReactNode } from 'react'
import type { User } from '../../features/auth'

export function RoleLayout({ user, children, title, path }: { user: User; children: ReactNode; title: string; path: string }) {
  const home = user.capabilities.includes('admin') ? '/admin' : '/owner'
  return <div className={`role-layout role-layout--${user.capabilities.includes('admin') ? 'admin' : 'restaurant_owner'}`}>
    <a className="skip-link" href="#main-content">Đến nội dung chính</a>
    <aside className="role-sidebar" aria-label="Điều hướng">
      <a href={home} className="brand">Hòa Lạc <span>Food</span></a>
      <p className="role-label">{title}</p>
      <nav aria-label="Điều hướng chính">
        {!user.is_active?<><a href="/">Khám phá quán</a><a href="/orders">Đơn mua của tôi</a>{user.managed_restaurant_id&&<><a href={'/owner/restaurants/'+user.managed_restaurant_id+'/orders'}>Đơn của quán</a><a href="/owner/finance">Công nợ và báo cáo</a></>}<a href="/support">Hỗ trợ theo đơn</a><a href="/privacy">Ẩn thông tin cá nhân</a><a href="/account">Tài khoản</a></>:<>
        <a href="/">Khám phá quán</a>
        <a href="/cart">Giỏ hàng</a>
        {!user.capabilities.includes('admin')&&<a href="/orders">Đơn mua của tôi</a>}
        {user.managed_restaurant_id&&<a href={'/owner/restaurants/'+user.managed_restaurant_id+'/orders'}>Đơn của quán</a>}
        <a href={home} aria-current={path === home ? 'page' : undefined}>Tổng quan</a>
        {user.capabilities.includes('admin') ? <a href="/admin/applications">Hồ sơ mở quán</a> : <a href="/open-restaurant">Hồ sơ mở quán</a>}
        {user.capabilities.includes('admin') && <a href="/admin/restaurants">Quản lý quán</a>}
        <a href={home==='/admin'?'/admin/categories':'/owner/menu'}>{home==='/admin'?'Danh mục món':'Thực đơn'}</a>
        <a href={home+'/payments'}>QR và hoàn tiền</a>
        <a href={home+'/delivery'}>Giao hàng VJU</a>
        <a href={home==='/admin'?'/admin/commissions':'/owner/commission'}>Thỏa thuận hoa hồng</a>
        <a href={home==='/admin'?'/admin/settlements':'/owner/finance'}>Công nợ và báo cáo</a>
        <a href={user.capabilities.includes('admin')?'/admin/support':'/support'}>Hỗ trợ theo đơn</a>
        {user.capabilities.includes('admin')&&<><a href="/admin/users">Quản trị tài khoản</a><a href="/admin/audit">Tra cứu audit</a></>}
        <a href="/account" aria-current={path === '/account' ? 'page' : undefined}>Tài khoản</a>

        </>}
      </nav>
    </aside>
    <main id="main-content" className="role-main" tabIndex={-1}>{!user.is_active&&<p role="alert">Tài khoản đã đình chỉ. Chỉ xử lý đơn cũ, hoàn tiền, công nợ và hỗ trợ.</p>}{children}</main>
  </div>
}
