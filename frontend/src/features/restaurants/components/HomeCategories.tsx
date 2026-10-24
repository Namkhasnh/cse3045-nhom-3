import type { Category } from '../api/catalog.api'
import { Photo } from '../../../shared/ui/Photo'
import { homePhotos, categoryPhoto } from './home-assets'
export function HomeCategories({ categories, selected, onSelect, loading, error, onRetry }: { categories: Category[]; selected: string; onSelect: (id: string) => void; loading: boolean; error: boolean; onRetry: () => void }) {
  return <section className="category-section design-container section" aria-labelledby="category-title">
    <div className="section-heading section-heading--inline"><div><span className="kicker">Chọn theo sở thích</span><h2 id="category-title">Bạn đang thèm gì?</h2></div><p>Lướt nhanh qua các nhóm món quen thuộc.</p></div>
    {loading && <p role="status">Đang tải danh mục…</p>}
    {error && <p role="alert">Chưa tải được danh mục. <button className="design-button design-button--small" onClick={onRetry}>Thử lại danh mục</button></p>}
    <div className="category-scroll" aria-label="Danh mục món ăn">
      {[{ id: 'all', name: 'Tất cả' }, ...categories].map(category => <button key={category.id} className={`category${selected === category.id ? ' is-active' : ''}`} aria-pressed={selected === category.id} onClick={() => onSelect(category.id)}><span className="category-image"><Photo src={category.id === 'all' ? homePhotos.feast : categoryPhoto(category.name)} alt="" /></span><span>{category.name}</span></button>)}
    </div>
  </section>
}
