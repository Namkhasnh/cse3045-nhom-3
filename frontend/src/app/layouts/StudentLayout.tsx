import type { ReactNode } from 'react'
import { Icon, type IconName } from '../../shared/ui/Icon'

const unavailableNavigation: { label: string; icon: IconName }[] = [
  { label: 'Giỏ hàng', icon: 'bag' },
  { label: 'Đơn hàng', icon: 'orders' },
  { label: 'Tài khoản', icon: 'user' },
]

export function StudentLayout({ children }: { children: ReactNode }) {
  return <>
    <a className="skip-link" href="#main-content">Đến nội dung chính</a>
    <header className="site-header">
      <div className="page-container brand-row">
        <a href="/" className="brand" aria-label="Hòa Lạc Food — Trang chủ"><span className="brand-mark"><Icon name="bowl" /></span><span>Hòa Lạc <span className="text-brand">Food</span></span></a>
        <span className="student-label">Bữa ngon quanh VJU</span>
      </div>
    </header>
    <main id="main-content" className="page-container main-content" tabIndex={-1}>
      <aside className="fixture-banner" aria-label="Thông báo dữ liệu mẫu"><Icon name="info" /><p>Dữ liệu mẫu — chưa kết nối hệ thống đặt món.</p></aside>
      {children}
      <footer className="page-footer"><Icon name="bowl" /><p>Một bữa ngon, thêm năng lượng cho ngày học.<br /><span>Bản xem trước giao diện · Thực đơn chưa khả dụng.</span></p></footer>
    </main>
    <nav className="student-nav" aria-label="Điều hướng chính">
      <div className="page-container nav-items">
        <a href="/" aria-current="page"><Icon name="home" /><span>Trang chủ</span></a>
        {unavailableNavigation.map(item => <button key={item.label} type="button" disabled aria-describedby="nav-unavailable"><Icon name={item.icon} /><span>{item.label}</span><span className="nav-soon">Sắp có</span></button>)}
      </div>
      <p id="nav-unavailable" className="nav-explanation">Giỏ hàng, đơn hàng và tài khoản chưa khả dụng trong bản mẫu.</p>
    </nav>
  </>
}
