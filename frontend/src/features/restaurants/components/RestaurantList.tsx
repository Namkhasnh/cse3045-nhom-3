import { ListState } from '../../../shared/ui/ListState'
import type { RestaurantListStatus, RestaurantSummary } from '../types'
import { RestaurantCard } from './RestaurantCard'

export function RestaurantList({ status, restaurants, hasFilters, onReset, onRetry }: {
  status: RestaurantListStatus
  restaurants: readonly RestaurantSummary[]
  hasFilters: boolean
  onReset: () => void
  onRetry: () => void
}) {
  if (status === 'loading') {
    return <div role="status" aria-busy="true" aria-label="Đang tải danh sách quán mẫu">
      <p className="loading-label">Đang tải danh sách quán mẫu…</p>
      <div className="restaurant-grid" aria-hidden="true">
        {[0, 1, 2].map(item => (
          <div className="restaurant-card skeleton-card" key={item}>
            <div className="skeleton skeleton-cover" />
            <div className="skeleton-content">
              <div className="skeleton skeleton-title" />
              <div className="skeleton skeleton-line" />
              <div className="skeleton skeleton-line" />
            </div>
          </div>
        ))}
      </div>
    </div>
  }
  if (status === 'error') {
    return <ListState error title="Chưa tải được danh sách quán" icon="alert" action="Thử lại dữ liệu mẫu" onAction={onRetry}>
      Đây là lỗi mô phỏng. Thử lại để xem danh sách mẫu; các bộ lọc của bạn vẫn được giữ.
    </ListState>
  }
  if (restaurants.length === 0) {
    return hasFilters
      ? <ListState title="Chưa tìm thấy quán phù hợp" action="Xóa bộ lọc" onAction={onReset}>
          Thử tên quán khác hoặc bỏ bớt bộ lọc danh mục và giá nhé.
        </ListState>
      : <ListState title="Chưa có quán trong danh sách" icon="bowl">
          Danh sách mẫu hiện đang trống. Các quán sẽ xuất hiện ở đây khi có dữ liệu.
        </ListState>
  }
  return <div className="restaurant-grid">
    {restaurants.map(restaurant => <RestaurantCard key={restaurant.id} restaurant={restaurant} />)}
  </div>
}
