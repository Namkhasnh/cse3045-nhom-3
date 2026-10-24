import { Icon } from '../../../shared/ui/Icon'
import { Photo } from '../../../shared/ui/Photo'
import { homePhotos } from './home-assets'
export function HomeRecommendation() {
  return <section className="ai-section section design-container" aria-labelledby="ai-title"><div className="ai-panel">
    <div className="ai-copy"><span className="ai-icon"><Icon name="sparkle" /></span><span className="kicker">Gợi ý theo sở thích</span><h2 id="ai-title">Không biết ăn gì?<br /><em>Để AI gợi ý!</em></h2><p>Chọn ngân sách, điểm nhận và nhóm món bạn thích. Khám phá gợi ý từ thực đơn hiện có, rồi tự chọn bữa ăn của bạn.</p><a className="design-button design-button--cream" href="/recommendations">Gợi ý món cho tôi <Icon name="sparkle" /></a></div>
    <div className="recommendation"><div className="recommendation-image"><Photo src={homePhotos.noodles} alt="Ảnh minh họa một bữa ăn với bún" /><span><Icon name="sparkle" />Cảm hứng bữa ăn</span></div><div className="recommendation-content"><span className="status">Theo ngân sách của bạn</span><div><h3>Một bữa ăn hợp gu</h3></div><p>Đăng nhập để nhận gợi ý từ món đang có. Bạn luôn có thể tự khám phá và chọn món.</p><a href="/recommendations">Khám phá gợi ý <Icon name="arrow" /></a></div></div>
    <span className="ai-orbit ai-orbit--one" aria-hidden="true" /><span className="ai-orbit ai-orbit--two" aria-hidden="true" />
  </div></section>
}
