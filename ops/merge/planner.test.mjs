import test from 'node:test';
import assert from 'node:assert/strict';
import {makePlan} from './planner.mjs';
import {insertionOrder} from './apply.mjs';
const column=(name,auto=false)=>({name,type:'bigint',nullable:false,generated:false,auto});
const table=(rows,extra={})=>({pk:['id'],columns:[column('id',true)],unique:[['id']],fks:[],schema_hash:'synthetic',rows,...extra});
function fixture(){
 const tables={_prisma_migrations:table([]),accounts:table([{id:'7',login_identifier:'operator',created_at:'unchanged'},{id:'8',login_identifier:'owner',created_at:'unchanged'},{id:'13',login_identifier:'other',created_at:'unchanged'}]),restaurants:table([],{columns:[column('id',true),column('owner_id')],unique:[['id'],['owner_id']],fks:[{target:'accounts',columns:['owner_id'],references:['id']}]}),orders:table([],{columns:[column('id',true),column('restaurant_id')],fks:[{target:'restaurants',columns:['restaurant_id'],references:['id']}]}),dishes:table([]),pickup_points:table([]),order_requests:table([])};
 const base={format:'hlf-merge-snapshot-v1',tables},source=structuredClone(base),target=structuredClone(base);
 source.tables.restaurants.rows.push({id:'4',owner_id:'8',name:'Local'});target.tables.restaurants.rows.push({id:'4',owner_id:'13',name:'SSH'});
 source.tables.orders.rows.push({id:'2',restaurant_id:'4',total_vnd:'9007199254740993',delivery_quote_snapshot:'{"restaurant_id":"4"}'});target.tables.orders.rows.push({id:'2',restaurant_id:'4',total_vnd:'1'});
 source.tables.orders.columns.push({name:'delivery_quote_snapshot',type:'json',nullable:false,generated:false,auto:false});target.tables.orders.columns=structuredClone(source.tables.orders.columns);
 return {base,source,target};
}
test('Independent colliding IDs retain both branches, exact money and accepted source snapshots',()=>{
 const {base,source,target}=fixture(),plan=makePlan(base,source,target);assert.deepEqual(plan.conflicts,[]);
 assert.equal(plan.maps.restaurants['4'],'5');assert.equal(plan.maps.orders['2'],'3');
 const order=plan.inserts.find(x=>x.table==='orders').row;assert.equal(order.restaurant_id,'5');assert.equal(order.total_vnd,'9007199254740993');assert.equal(order.delivery_quote_snapshot,'{"restaurant_id":"4"}');
 assert.deepEqual(insertionOrder(plan,target).map(x=>x.table),['restaurants','orders']);assert.equal(target.tables.restaurants.rows[0].name,'SSH');
});
test('Owner capacity and shared account identity conflicts prevent application',()=>{
 const {base,source,target}=fixture();target.tables.restaurants.rows[0].owner_id='8';target.tables.accounts.rows[0].login_identifier='different';
 const plan=makePlan(base,source,target);assert.ok(plan.conflicts.some(x=>x.code==='OWNER_ALREADY_HAS_RESTAURANT'));assert.ok(plan.conflicts.some(x=>x.code==='SHARED_ACCOUNT_IDENTITY_CHANGED'));
});
test('Dangling relationships cannot be inserted by disabling foreign keys',()=>{
 const {base,source,target}=fixture(),plan=makePlan(base,source,target);plan.inserts.find(x=>x.table==='orders').row.restaurant_id='999';
 assert.throws(()=>insertionOrder(plan,target),/UNRESOLVED_FOREIGN_KEYS/);
});
