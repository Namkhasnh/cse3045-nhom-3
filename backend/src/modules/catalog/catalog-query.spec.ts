import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cursor, parseQuery } from './catalog-query.js';
process.env.CSRF_HMAC_KEY = '22'.repeat(32);
test('CAT-01 public queries bind cursor to filters/kind/sort and preserve exact IDs/money', () => {
  const q = parseQuery({ q: ' Cơm ', min_price_vnd: '0', max_price_vnd: '50000', limit: '1' }, 'restaurants');
  const next = cursor(q, { id: 9007199254740993n, name: 'Cơm' });
  assert.equal(parseQuery({ q: 'Cơm', min_price_vnd: '0', max_price_vnd: '50000', limit: '1', cursor: next }, 'restaurants').after?.id, '9007199254740993');
  for (const raw of [{ q: 'Khác', cursor: next }, { cursor: `${next}a` }, { limit: '101' }, { min_price_vnd: '02' }, { min_price_vnd: '50001', max_price_vnd: '50000' }, { is_active: 'true' }])
    assert.throws(() => parseQuery(raw, 'restaurants'));
  assert.throws(() => parseQuery({ cursor: next }, 'dishes'));
});
