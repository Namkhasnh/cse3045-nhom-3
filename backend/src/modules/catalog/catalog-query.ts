import { UnprocessableEntityException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';
export const invalid = (): never => { throw new UnprocessableEntityException({ code: 'VALIDATION_ERROR', message: 'Invalid catalog query.' }); };
export function id(value: unknown): string {
  if (typeof value !== 'string' || !/^[1-9][0-9]*$/.test(value) || value.length > 19 || BigInt(value) > 9223372036854775807n) return invalid();
  return value;
}
export type CatalogQuery = { limit: number; sort: string; q?: string; category_id?: string; restaurant_id?: string; public_only?: boolean;
  min_price_vnd?: string; max_price_vnd?: string; is_available?: boolean; is_open?: boolean;
  after?: { id: string; value: string }; binding: string };
const sign = (value: string) => {
  const key = process.env.CSRF_HMAC_KEY; if (!key || !/^[a-f0-9]{64}$/i.test(key)) throw new Error('Cursor key unavailable');
  return createHmac('sha256', Buffer.from(key, 'hex')).update(`catalog:${value}`).digest('base64url');
};
export function parseQuery(raw: Record<string, unknown>, kind: 'restaurants' | 'dishes' | 'categories'): CatalogQuery {
  const common = ['limit', 'cursor', 'sort'];
  const allowed = kind === 'categories' ? [...common, 'public_only'] : [...common, 'q', 'category_id', 'min_price_vnd', 'max_price_vnd',
    ...(kind === 'dishes' ? ['restaurant_id', 'is_available'] : ['is_open'])];
  if (Object.keys(raw).some(k => !allowed.includes(k)) || Object.values(raw).some(v => typeof v !== 'string')) invalid();
  const limit = raw.limit === undefined ? 20 : typeof raw.limit === 'string' && /^[1-9][0-9]{0,2}$/.test(raw.limit) ? Number(raw.limit) : invalid();
  if (limit > 100) invalid();
  const sort = raw.sort as string ?? 'name';
  if (!(kind === 'categories' ? ['name'] : kind === 'dishes' ? ['name', '-name', 'price_vnd', '-price_vnd'] : ['name', '-name']).includes(sort)) invalid();
  const result: CatalogQuery = { limit, sort, binding: '' };
  if (raw.public_only !== undefined) {
    if (!['true', 'false'].includes(raw.public_only as string)) invalid();
    result.public_only = raw.public_only === 'true';
  }
  if (raw.q !== undefined) { const q = (raw.q as string).trim(); if (!q || [...q].length > 200) invalid(); result.q = q; }
  for (const key of ['category_id', 'restaurant_id'] as const) if (raw[key] !== undefined) result[key] = id(raw[key]);
  for (const key of ['min_price_vnd', 'max_price_vnd'] as const) if (raw[key] !== undefined) {
    const value = raw[key] as string;
    if (!/^(0|[1-9][0-9]{0,9})$/.test(value) || BigInt(value) > 1000000000n) invalid(); result[key] = value;
  }
  if (result.min_price_vnd !== undefined && result.max_price_vnd !== undefined && BigInt(result.min_price_vnd) > BigInt(result.max_price_vnd)) invalid();
  for (const key of ['is_open', 'is_available'] as const) if (raw[key] !== undefined) {
    if (!['true', 'false'].includes(raw[key] as string)) invalid(); result[key] = raw[key] === 'true';
  }
  result.binding = JSON.stringify({ kind, ...result, binding: undefined });
  if (raw.cursor !== undefined) {
    try {
      if ((raw.cursor as string).length > 4096) invalid();
      const [body, sig, extra] = (raw.cursor as string).split('.'); const expected = sign(body);
      if (extra || !sig || sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) invalid();
      const value = JSON.parse(Buffer.from(body, 'base64url').toString()) as { binding: string; id: string; value: string };
      if (value.binding !== result.binding || typeof value.value !== 'string' || value.value.length > 200) invalid();
      if (sort.includes('price_vnd') && (!/^(0|[1-9][0-9]{0,9})$/.test(value.value) || BigInt(value.value) > 1000000000n)) invalid();
      result.after = { id: id(value.id), value: value.value };
    } catch { invalid(); }
  }
  return result;
}
export function cursor(query: CatalogQuery, row: { id: bigint; name: string; price_vnd?: bigint }) {
  const value = query.sort.includes('price_vnd') ? row.price_vnd!.toString() : row.name;
  const body = Buffer.from(JSON.stringify({ binding: query.binding, id: row.id.toString(), value })).toString('base64url');
  return `${body}.${sign(body)}`;
}
