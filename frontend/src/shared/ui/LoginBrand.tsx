import { Icon } from './Icon'

export function LoginBrand({ compact = false }: { compact?: boolean }) {
  return <a className={`login-brand${compact ? ' login-brand--compact' : ''}`} href="/" aria-label="Hòa Lạc Food — Trang chủ">
    <span className="login-brand__mark"><Icon name="utensils" /></span>
    <strong>Hoa Lac <b>Food</b></strong>
  </a>
}
