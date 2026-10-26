import {test} from 'node:test'
import assert from 'node:assert/strict'
import {percentToRate,rateToPercent} from '../src/features/vouchers/model.ts'
import {loadCartReview,saveCartPoint} from '../src/features/delivery/cart-point.ts'
import {paymentStatusLabel} from '../src/features/orders/status.ts'
import {mutationFeedback} from '../src/shared/lib/feedback.ts'
test('VOUCHER-01 percentages preserve precision without floating point',()=>{assert.equal(percentToRate('12.345678'),'0.12345678');assert.equal(percentToRate('100'),'1.00000000');assert.equal(percentToRate('0.000001'),'0.00000001');assert.equal(rateToPercent('0.12500000'),'12,5');for(const value of ['0','101','1e2','10,5','1.1234567','-1','NaN'])assert.throws(()=>percentToRate(value))})
test('Checkout handoff is account/cart scoped and excludes private quote destination data',()=>{
 const values=new Map();globalThis.sessionStorage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)}
 const quote={quote_artifact:'a'.repeat(43),policy_version:1,pickup_point_version:1,survey_version:1,distance_m:1,delivery_fee_vnd:'0',expires_at:'2026-10-25T12:00:00.000Z',destination:{pickup_point_id:'2',pickup_point_name:'Test point',text:'Private extra',latitude:'21.0',longitude:'105.0'}}
 saveCartPoint('1','3','2',quote,'cart-A');assert.equal(loadCartReview('1','3','cart-A').quote.delivery_fee_vnd,'0');assert.equal(loadCartReview('2','3','cart-A'),null);assert.equal(loadCartReview('1','4','cart-A'),null);assert.equal(loadCartReview('1','3','cart-B'),null);assert.ok(!JSON.stringify([...values]).includes('Private extra'));assert.ok(!JSON.stringify([...values]).includes('latitude'));saveCartPoint('1','3','2');assert.equal(loadCartReview('1','3','cart-A'),null)
})
test('Zero-total status and background preview do not claim payment or mutation success',()=>{assert.equal(paymentStatusLabel('not_required'),'Không cần thanh toán');assert.equal(mutationFeedback('/orders/preview','POST',{total_vnd:'0'}),null)})
import {safeReturnPath} from '../src/features/auth/return-path.ts'
test('Voucher management login returns only to implemented internal routes',()=>{globalThis.window={location:{origin:'https://example.test'}};assert.equal(safeReturnPath('/admin/vouchers'),'/admin/vouchers');assert.equal(safeReturnPath('/owner/vouchers'),'/owner/vouchers');for(const value of ['//evil.test/vouchers','https://evil.test/admin/vouchers','/admin/vouchers\\evil'])assert.equal(safeReturnPath(value),null)})
