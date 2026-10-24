export function SiteBrand({ light = false }: { light?: boolean }) {
  return <a className={`design-logo${light ? ' design-logo--light' : ''}`} href="/" aria-label="Hòa Lạc Food — Trang chủ">
    <span className="design-logo-mark" aria-hidden="true"><span className="design-logo-steam" /><span className="design-logo-bowl" /></span>
    <span>Hoa Lac <strong>Food</strong></span>
  </a>
}
