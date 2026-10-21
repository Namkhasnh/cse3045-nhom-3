import { Injectable, NotFoundException } from '@nestjs/common';
import { CatalogRepository, type RestaurantRow, type DishRow } from './catalog.repository.js';
import { cursor, id, parseQuery, type CatalogQuery } from './catalog-query.js';
const dishDto = (row: DishRow) => ({ id: row.id.toString(), restaurant_id: row.restaurant_id.toString(), restaurant_name: row.restaurant_name, category_id: row.category_id.toString(),
  name: row.name, description: row.description, price_vnd: row.price_vnd.toString(), image_reference: row.image_reference,
  is_visible: Boolean(row.is_visible), is_available: Boolean(row.is_available), version: Number(row.version), updated_at: row.updated_at.toISOString() });
function page<T extends { id: bigint; name: string; price_vnd?: bigint }, R>(rows: T[], q: CatalogQuery, convert: (v: T) => R) {
  const more = rows.length > q.limit; const values = rows.slice(0, q.limit);
  return { data: values.map(convert), page: { has_more: more, next_cursor: more ? cursor(q, values[values.length - 1]) : null } };
}
@Injectable()
export class CatalogService {
  constructor(private readonly repository: CatalogRepository) {}
  private async restaurantDtos(rows: RestaurantRow[]) {
    const hours = rows.length ? await this.repository.hours(rows.map(r => r.id)) : [];
    return rows.map(r => ({ id: r.id.toString(), name: r.name, address: r.address,
      latitude: r.latitude?.toFixed(6) ?? null, longitude: r.longitude?.toFixed(6) ?? null, contact_phone: r.contact_phone,
      is_active: Boolean(r.is_active), is_accepting_orders: Boolean(r.is_accepting_orders), is_open: Boolean(r.is_open),
      hours: hours.filter(h => h.restaurant_id === r.id).map(({ weekday, opens_at, closes_at, closes_next_day }) => ({ weekday, opens_at, closes_at, closes_next_day })),
      min_price_vnd: r.min_price_vnd?.toString() ?? null, max_price_vnd: r.max_price_vnd?.toString() ?? null,
      version: Number(r.version), updated_at: r.updated_at.toISOString() }));
  }
  async restaurants(raw: Record<string, unknown>) {
    const q = parseQuery(raw, 'restaurants'), rows = await this.repository.restaurants(q);
    const dtos = await this.restaurantDtos(rows.slice(0, q.limit));
    return page(rows, q, r => dtos.find(d => d.id === r.id.toString())!);
  }
  async restaurant(value: string) {
    const rows = await this.repository.restaurants(parseQuery({}, 'restaurants'), id(value));
    if (!rows.length) throw new NotFoundException();
    return (await this.restaurantDtos(rows))[0];
  }
  async dishes(raw: Record<string, unknown>) {
    const q = parseQuery(raw, 'dishes');
    if (q.restaurant_id) await this.restaurant(q.restaurant_id);
    return page(await this.repository.dishes(q), q, dishDto);
  }
  async dish(value: string) {
    const rows = await this.repository.dishes(parseQuery({}, 'dishes'), id(value));
    if (!rows.length) throw new NotFoundException(); return dishDto(rows[0]);
  }
  async categories(raw: Record<string, unknown>) {
    const q = parseQuery(raw, 'categories'); return page(await this.repository.categories(q), q, r => ({ id: r.id.toString(), name: r.name }));
  }
}
