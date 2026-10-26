import {test} from 'node:test';
import assert from 'node:assert/strict';
import {analyticsPeriod,revenueSeries} from './analytics-policy.js';
test('DASH-01 owner analytics uses Vietnam midnight across month/year/leap boundaries',()=>{
 const p=analyticsPeriod({},new Date('2026-12-31T17:00:00Z'));
 assert.equal(p.dates.at(-1),'2027-01-01');assert.equal(p.dates[0],'2026-12-26');assert.equal(p.from.toISOString(),'2026-12-25T17:00:00.000Z');assert.equal(p.to.toISOString(),'2027-01-01T17:00:00.000Z');
 assert.equal(analyticsPeriod({days:'30'},new Date('2024-03-01T00:00:00Z')).dates.length,30);
 assert.ok(analyticsPeriod({days:'30'},new Date('2024-03-01T00:00:00Z')).dates.includes('2024-02-29'));
 assert.equal(analyticsPeriod({},new Date('2026-10-23T16:59:59Z')).dates.at(-1),'2026-10-23');
 for(const q of [{days:'31'},{days:7},{days:['7','30']},{from:'2026-10-01'},{days:'07'}])assert.throws(()=>analyticsPeriod(q));
});
test('DASH-01 zero-filled daily series preserves exact integer VND and counts above safe Number',()=>{
 const r=revenueSeries(['2026-10-23','2026-10-24'],[{date:'2026-10-24',dish_revenue_vnd:'9007199254740993',completed_order_count:'2'}]);
 assert.equal(r.daily[0].dish_revenue_vnd,'0');assert.equal(r.totals.dish_revenue_vnd,'9007199254740993');assert.equal(r.today.completed_order_count,'2');
 assert.equal(revenueSeries(['2026-10-24'],[]).today.dish_revenue_vnd,'0');
});
