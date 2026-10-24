import type { User } from '../../features/auth'
import { Icon } from '../../shared/ui/Icon'
import { SiteBrand } from './SiteBrand'
const currentYear = new Date().getFullYear()
export function SiteFooter({ user, compact = false }: { user: User | null; compact?: boolean }) {
  const management = user?.capabilities.includes('admin') ? { href: '/admin', label: 'Quản trị' }
    : user?.managed_restaurant_id ? { href: '/owner', label: 'Quán của tôi' }
    : { href: '/open-restaurant', label: 'Hợp tác mở quán' }
  if (compact) return <footer className="footer footer--compact"><div className="design-container compact-footer-main"><div><SiteBrand light /><p>Món ngon gần bạn, ngày học vui hơn.</p></div><nav aria-label="Liên kết cuối trang"><a href="/">Trang chủ</a><a href="/#dishes">Khám phá món</a><a href="/#restaurants">Quán ăn</a><a href="/support">Trợ giúp</a></nav></div><div className="design-container compact-footer-bottom"><span>VJU · Hòa Lạc</span><span>© {currentYear} Hoa Lac Food</span><span>Dành cho cộng đồng sinh viên VJU</span></div></footer>
  return <footer className="footer">
    <div className="design-container footer-grid">
      <div className="footer-brand"><SiteBrand light /><p>Giúp sinh viên VJU tìm thấy một bữa ăn ngon quanh Hòa Lạc — nhanh, rõ ràng và hợp gu.</p><span>Quán tự giao hàng. Thanh toán trực tiếp cho quán.</span></div>
      <nav className="footer-links" aria-label="Khám phá"><strong>Khám phá</strong><a href="/#dishes">Món ăn hôm nay</a><a href="/#restaurants">Quán quanh VJU</a><a href="/recommendations">AI gợi ý món</a></nav>
      <nav className="footer-links" aria-label="Cộng đồng"><strong>Cộng đồng</strong><a href="/support">Trợ giúp & liên hệ</a>{(!user || user.is_active) && <a href={management.href}>{management.label}</a>}<a href="/privacy">Quyền riêng tư</a></nav>
      <div className="footer-community"><Icon name="pin" /><p><strong>VJU · Hòa Lạc</strong><br />Thiết kế cho nhịp sống đại học.</p></div>
    </div>
    <div className="design-container footer-bottom"><span>© {currentYear} Hoa Lac Food</span><span>Món ngon gần hơn, ngày học vui hơn.</span></div>
  </footer>
}
