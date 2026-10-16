import { Button } from '../../../shared/ui/Button'
import { FilterChip } from '../../../shared/ui/FilterChip'
import { Icon } from '../../../shared/ui/Icon'
import { Input } from '../../../shared/ui/Input'
import type { PriceRange, RestaurantFilterValues } from '../types'

const prices: { value: PriceRange; label: string }[] = [
  { value: 'all', label: 'Tất cả mức giá' },
  { value: 'under-30', label: 'Dưới 30.000đ' },
  { value: '30-to-50', label: '30.000 – 50.000đ' },
  { value: 'over-50', label: 'Trên 50.000đ' },
]

export function RestaurantFilters({ values, categories, onChange, onReset, hasFilters }: {
  values: RestaurantFilterValues
  categories: readonly string[]
  onChange: (values: RestaurantFilterValues) => void
  onReset: () => void
  hasFilters: boolean
}) {
  return <section className="restaurant-filters" aria-label="Tìm kiếm và lọc quán">
    <div className="search-row">
      <div className="search-field">
        <Icon name="search" />
        <Input
          id="restaurant-search"
          label="Tìm tên quán"
          type="search"
          placeholder="Bạn muốn ăn ở quán nào?"
          value={values.query}
          onChange={event => onChange({ ...values, query: event.target.value })}
          autoComplete="off"
          aria-describedby="search-help"
        />
      </div>
      <Button variant="neutral" onClick={onReset} disabled={!hasFilters}>
        <Icon name="reset" />Xóa bộ lọc
      </Button>
    </div>
    <p id="search-help" className="filter-help">Tìm từ đầu tên quán, có phân biệt dấu tiếng Việt.</p>
    <fieldset className="filter-group">
      <legend>Danh mục món</legend>
      <div className="chip-row">
        <FilterChip selected={values.category === 'all'} onClick={() => onChange({ ...values, category: 'all' })}>Tất cả</FilterChip>
        {categories.map(category => (
          <FilterChip key={category} selected={values.category === category} onClick={() => onChange({ ...values, category })}>
            {category}
          </FilterChip>
        ))}
      </div>
    </fieldset>
    <div className="price-filter">
      <label htmlFor="restaurant-price">Giá một món</label>
      <select id="restaurant-price" className="input" value={values.priceRange} onChange={event => onChange({ ...values, priceRange: event.target.value as PriceRange })}>
        {prices.map(price => (
          <option key={price.value} value={price.value}>{price.label}</option>
        ))}
      </select>
    </div>
  </section>
}
