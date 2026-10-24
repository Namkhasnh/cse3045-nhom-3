import { Icon } from '../../../shared/ui/Icon'
import { Photo } from '../../../shared/ui/Photo'
import { Reveal } from '../../../shared/ui/Reveal'
import { homePhotos } from './home-assets'
export function HomeHero({ query, onQuery }: { query: string; onQuery: (value: string) => void }) {
  return <section className="hero design-container" aria-labelledby="page-title">
    <Reveal><div className="hero-copy">
      <div className="eyebrow"><span className="eyebrow-dot" />Dành cho cộng đồng VJU · Hòa Lạc</div>
      <h1 id="page-title">Hôm nay,<br /><em>ăn gì</em> ở VJU?</h1>
      <p>Khám phá món ngon quanh Hòa Lạc, chọn quán hợp gu và đặt bữa ăn thật dễ dàng.</p>
      <div className="hero-buttons"><a className="design-button" href="#dishes">Khám phá món ăn <Icon name="arrow" /></a><a className="text-button" href="#restaurants">Xem quán ăn <span aria-hidden="true">↘</span></a></div>
      <form className="hero-search" role="search" onSubmit={event => { event.preventDefault(); document.getElementById('dishes')?.scrollIntoView({ block: 'start' }) }}>
        <Icon name="search" /><label className="sr-only" htmlFor="hero-search">Tìm món ăn hoặc quán</label>
        <input id="hero-search" type="search" value={query} maxLength={200} onChange={event => onQuery(event.target.value)} placeholder="Tìm món ăn hoặc quán..." aria-describedby="home-search-help" />
        <button className="search-hint" type="submit">Tìm kiếm</button>
      </form>
      <p className="demo-note" id="home-search-help"><Icon name="info" />Tìm từ đầu tên món hoặc quán. Khám phá ngay, không cần đăng nhập.</p>
    </div></Reveal>
    <Reveal delay><div className="hero-visual">
      <div className="hero-photo"><Photo src={homePhotos.feast} alt="Bàn ăn Việt Nam với nhiều món ngon và rau xanh" eager /><div className="photo-overlay" /><div className="hero-photo-caption"><span>Cảm hứng bữa ăn</span><strong>Một bữa ngon,<br />đúng gu của bạn.</strong></div></div>
      <div className="mini-dish"><Photo src={homePhotos.pho} alt="" eager /><span><small>Ảnh minh họa</small><strong>Phở nóng</strong></span></div>
      <div className="fresh-stamp" aria-hidden="true"><span>NGON MỖI NGÀY</span><b>VJU</b></div>
      <svg className="hero-scribble" viewBox="0 0 80 60" aria-hidden="true"><path d="M5 48c20-4 26-30 45-25 13 3 12 21-2 22-11 1-9-15 6-23 8-4 15-4 21-2" /></svg>
    </div></Reveal>
  </section>
}
