import {test} from 'node:test';import assert from 'node:assert/strict';
import {financeIntent} from '../src/features/commissions/finance-intent.ts';
import {formatVnd} from '../src/shared/lib/format.ts';
test('FIN-03 unknown finance intent is bound to actor/restaurant/operation and stable key',()=>{const p={actor:'1',restaurant:'2',path:'/settlements/3/receipts',key:'stable',body:{amount_vnd:'9007199254740993'}};assert.deepEqual(financeIntent(p,'1','2'),p);for(const changed of [{actor:'9'},{restaurant:'9'},{path:'/orders/1/payment/confirm'},{key:null},{body:null}])assert.throws(()=>financeIntent({...p,...changed},'1','2'));const create={...p,path:'/settlements',key:null,body:{restaurant_id:'2',entry_ids:['8'],period_start_at:'2026-08-31T17:00:00.000Z',period_end_at:'2026-09-30T17:00:00.000Z'}};assert.deepEqual(financeIntent(create,'1','2'),create);assert.throws(()=>financeIntent({...create,key:'invented-create-key'},'1','2'));});
test('FIN-05 exact signed VND formatter preserves credit and unsafe-Number integers',()=>{assert.equal(formatVnd('-1000'),'-1.000đ');assert.equal(formatVnd('9007199254740993'),'9.007.199.254.740.993đ');});

import {monthBoundary,monthLabel,localMonth} from '../src/features/commissions/finance-time.ts';
test('FIN-04 monthly report controls use Vietnam boundaries and stable Vietnamese month labels',()=>{assert.equal(monthBoundary('2026-03'),'2026-02-28T17:00:00.000Z');assert.equal(monthBoundary('2026-03',true),'2026-03-31T17:00:00.000Z');assert.equal(monthLabel('2026-08-31T17:00:00.000Z'),'09/2026');assert.equal(localMonth(new Date('2026-09-30T17:00:00.000Z')),'2026-10');assert.throws(()=>monthBoundary('2026-13'));});

import {collectFinanceReport,reportRevenue,periodStatus} from '../src/features/commissions/owner-finance-model.ts';
test('FIN-05 owner revenue traverses the snapshot and preserves integers beyond Number precision',async()=>{
 const at='2026-10-27T00:00:00.000Z';const row=(month,amount)=>({period_start_at:month,as_of:at,dish_revenue_vnd:amount});
 const first={data:[row('2026-09','9007199254740993')],summary:{account_outstanding_vnd:'-1'},page:{as_of:at,has_more:true,next_cursor:'next'}};
 const second={...first,data:[row('2026-10','8')],page:{as_of:at,has_more:false,next_cursor:null}};
 const calls=[];const result=await collectFinanceReport(async cursor=>{calls.push(cursor);return cursor?second:first},new AbortController().signal);
 assert.deepEqual(calls,['','next']);assert.equal(reportRevenue(result.data),'9007199254741001');assert.equal(result.summary.account_outstanding_vnd,'-1');
 for(const changed of [{...second,page:{...second.page,as_of:'other'}},{...second,data:first.data},{...second,page:first.page}])await assert.rejects(()=>collectFinanceReport(async cursor=>cursor?changed:first,new AbortController().signal));
 const controller=new AbortController();controller.abort();await assert.rejects(()=>collectFinanceReport(async()=>first,controller.signal));
});
test('FIN-04 owner labels distinguish open/late/net-zero facts, signed credit and collectible deadlines',()=>{
 const row={as_of:'2026-11-01T00:00:00Z',period_end_at:'2026-10-31T17:00:00Z',settlement_id:null,entry_count:2,outstanding_vnd:'0',collectible_vnd:'0'};
 assert.equal(periodStatus(row).label,'Chưa chốt');assert.equal(periodStatus({...row,as_of:'2026-10-27T00:00:00Z'}).label,'Tháng đang mở');
 assert.equal(periodStatus({...row,as_of:'2026-11-04T17:00:00Z'}).label,'Quá hạn lập bảng');
 assert.equal(periodStatus({...row,entry_count:0,as_of:'2026-11-04T17:00:00Z'}).label,'Chưa chốt');
 assert.equal(periodStatus({...row,settlement_id:'1',outstanding_vnd:'-100'}).label,'Dư có bù trừ');
 assert.equal(periodStatus({...row,settlement_id:'1'}).label,'Đã đối soát');
 const debt={...row,settlement_id:'1',as_of:'2026-11-08T17:00:00Z',outstanding_vnd:'100'};
 assert.equal(periodStatus(debt).label,'Đã chốt · còn dư');assert.equal(periodStatus({...debt,collectible_vnd:'100'}).label,'Quá hạn thanh toán');
});
