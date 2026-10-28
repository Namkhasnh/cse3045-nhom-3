import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { CatalogQuery } from './catalog-query.js';

const published = Prisma.sql`r.is_active=TRUE AND r.readiness='ready'`;
// Convert the UTC instant explicitly; never depend on server session time zone or MySQL tz tables.
function localTime(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', weekday: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(now);
  const p = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return { day: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].indexOf(p.weekday) + 1, time: `${p.hour}:${p.minute}:${p.second}` };
}
export function openSql(now?: Date) {
  const { day, time } = localTime(now); const previous = day === 1 ? 7 : day - 1;
  return Prisma.sql`EXISTS(SELECT 1 FROM restaurant_hours h WHERE h.restaurant_id=r.id AND (
    (h.weekday=${day} AND ((h.closes_next_day=FALSE AND h.opens_at<=${time} AND h.closes_at>${time}) OR
      (h.closes_next_day=TRUE AND h.opens_at<=${time}))) OR
    (h.weekday=${previous} AND h.closes_next_day=TRUE AND h.closes_at>${time})))`;
}
export type RestaurantRow = { description: string | null; cover_media_asset_id: bigint | null; avatar_media_asset_id: bigint | null; id: bigint; name: string; address: string; latitude: Prisma.Decimal | null; longitude: Prisma.Decimal | null;
  contact_phone: string; is_active: number; is_accepting_orders: number; is_open: number; version: number; updated_at: Date;
  min_price_vnd: bigint | null; max_price_vnd: bigint | null };
export type DishRow = { id: bigint; restaurant_id: bigint; restaurant_name: string; restaurant_is_open: number; restaurant_is_accepting_orders: number; category_id: bigint; name: string; description: string; price_vnd: bigint;
  image_reference: string | null; is_visible: number; is_available: number; version: number; updated_at: Date };
const escapedPrefix = (q: string) => q.replace(/[!%_]/g, c => `!${c}`) + '%';
function dishConditions(q: CatalogQuery) {
  const conditions = [Prisma.sql`d.is_visible=TRUE`];
  if (q.category_id) conditions.push(Prisma.sql`d.category_id=${BigInt(q.category_id)}`);
  if (q.min_price_vnd !== undefined) conditions.push(Prisma.sql`d.price_vnd>=${BigInt(q.min_price_vnd)}`);
  if (q.max_price_vnd !== undefined) conditions.push(Prisma.sql`d.price_vnd<=${BigInt(q.max_price_vnd)}`);
  return conditions;
}
function boundary(q: CatalogQuery, column: Prisma.Sql, idColumn: Prisma.Sql) {
  if (!q.after) return Prisma.sql`TRUE`;
  const value = q.sort.includes('price_vnd') ? BigInt(q.after.value) : q.after.value;
  const compare = q.sort.startsWith('-') ? Prisma.sql`<` : Prisma.sql`>`;
  return Prisma.sql`(${column} ${compare} ${value} OR (${column}=${value} AND ${idColumn}>${BigInt(q.after.id)}))`;
}
@Injectable()
export class CatalogRepository {
  constructor(private readonly prisma: PrismaService) {}
  recommendationCategories(c:import('../../common/transactions/transaction-runner.js').TransactionContext,ids:bigint[]) {return c.db.dish_categories.findMany({where:{id:{in:ids}},select:{id:true}});}
  async recommendationRows(c:import('../../common/transactions/transaction-runner.js').TransactionContext,after:bigint,only:bigint[]=[]){const rows=await c.db.$queryRaw<Array<{id:bigint;restaurant_id:bigint;name:string;restaurant_name:string;category_id:bigint;category_name:string;price_vnd:bigint;image_reference:string|null;owner_id:bigint;address:string;latitude:Prisma.Decimal|null;longitude:Prisma.Decimal|null;location_version:number}>>(Prisma.sql`SELECT d.id,d.restaurant_id,d.name,r.name AS restaurant_name,d.category_id,cat.name AS category_name,d.price_vnd,d.image_reference,r.owner_id,r.address,r.latitude,r.longitude,r.location_version FROM dishes d JOIN restaurants r ON r.id=d.restaurant_id JOIN dish_categories cat ON cat.id=d.category_id WHERE ${published} AND r.is_accepting_orders=TRUE AND ${openSql()} AND d.is_visible=TRUE AND d.is_available=TRUE AND d.id>${after} AND ${only.length?Prisma.sql`d.id IN (${Prisma.join(only)})`:Prisma.sql`TRUE`} ORDER BY d.id LIMIT 200`);return rows.map(r=>({...r,location_version:Number(r.location_version)}));}

  restaurants(q: CatalogQuery, onlyId?: string) {
    const conditions = [published];
    if (onlyId) conditions.push(Prisma.sql`r.id=${BigInt(onlyId)}`);
    if (q.q) conditions.push(Prisma.sql`r.name COLLATE utf8mb4_0900_ai_ci LIKE ${escapedPrefix(q.q)} ESCAPE '!'`);
    if (q.is_open !== undefined) conditions.push(Prisma.sql`${openSql()}=${q.is_open}`);
    if (q.category_id || q.min_price_vnd !== undefined || q.max_price_vnd !== undefined)
      conditions.push(Prisma.sql`EXISTS(SELECT 1 FROM dishes d WHERE d.restaurant_id=r.id AND ${Prisma.join(dishConditions(q), ' AND ')})`);
    conditions.push(boundary(q, Prisma.sql`r.name COLLATE utf8mb4_0900_ai_ci`, Prisma.sql`r.id`));
    return this.prisma.$queryRaw<RestaurantRow[]>(Prisma.sql`SELECT r.id,r.name,r.description,r.cover_media_asset_id,r.avatar_media_asset_id,r.address,r.latitude,r.longitude,r.contact_phone,
      r.is_active,r.is_accepting_orders,r.version,r.updated_at,${openSql()} AS is_open,
      (SELECT MIN(d.price_vnd) FROM dishes d WHERE d.restaurant_id=r.id AND d.is_visible=TRUE) AS min_price_vnd,
      (SELECT MAX(d.price_vnd) FROM dishes d WHERE d.restaurant_id=r.id AND d.is_visible=TRUE) AS max_price_vnd
      FROM restaurants r WHERE ${Prisma.join(conditions,' AND ')}
      ORDER BY r.name COLLATE utf8mb4_0900_ai_ci ${q.sort.startsWith('-') ? Prisma.sql`DESC` : Prisma.sql`ASC`},r.id ASC LIMIT ${q.limit + 1}`);
  }
  dishes(q: CatalogQuery, onlyId?: string) {
    const conditions = [published, ...dishConditions(q)];
    if (onlyId) conditions.push(Prisma.sql`d.id=${BigInt(onlyId)}`);
    if (q.restaurant_id) conditions.push(Prisma.sql`d.restaurant_id=${BigInt(q.restaurant_id)}`);
    if (q.q) conditions.push(Prisma.sql`d.name COLLATE utf8mb4_0900_ai_ci LIKE ${escapedPrefix(q.q)} ESCAPE '!'`);
    if (q.is_available !== undefined) conditions.push(Prisma.sql`d.is_available=${q.is_available}`);
    const column = q.sort.includes('price_vnd') ? Prisma.sql`d.price_vnd` : Prisma.sql`d.name COLLATE utf8mb4_0900_ai_ci`;
    conditions.push(boundary(q, column, Prisma.sql`d.id`));
    return this.prisma.$queryRaw<DishRow[]>(Prisma.sql`SELECT d.id,d.restaurant_id,r.name AS restaurant_name,${openSql()} AS restaurant_is_open,r.is_accepting_orders AS restaurant_is_accepting_orders,d.category_id,d.name,d.description,d.price_vnd,
      d.image_reference,d.is_visible,d.is_available,d.version,d.updated_at FROM dishes d JOIN restaurants r ON r.id=d.restaurant_id
      WHERE ${Prisma.join(conditions,' AND ')} ORDER BY ${column} ${q.sort.startsWith('-') ? Prisma.sql`DESC` : Prisma.sql`ASC`},d.id ASC LIMIT ${q.limit + 1}`);
  }
  hours(ids: bigint[]) {
    return this.prisma.restaurant_hours.findMany({ where: { restaurant_id: { in: ids } },
      orderBy: [{ weekday: 'asc' }, { opens_at: 'asc' }], select: { restaurant_id: true, weekday: true, opens_at: true, closes_at: true, closes_next_day: true } });
  }
  categories(q: CatalogQuery) {
    return this.prisma.$queryRaw<Array<{ id: bigint; name: string }>>(Prisma.sql`SELECT c.id,c.name FROM dish_categories c
      WHERE ${q.public_only ? Prisma.sql`EXISTS(SELECT 1 FROM dishes d JOIN restaurants r ON r.id=d.restaurant_id WHERE d.category_id=c.id AND d.is_visible=TRUE AND ${published})` : Prisma.sql`TRUE`}
      AND ${boundary(q, Prisma.sql`c.name COLLATE utf8mb4_0900_ai_ci`, Prisma.sql`c.id`)} ORDER BY c.name COLLATE utf8mb4_0900_ai_ci,c.id LIMIT ${q.limit + 1}`);
  }
}
