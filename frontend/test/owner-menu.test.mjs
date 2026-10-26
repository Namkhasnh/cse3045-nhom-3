import {test} from 'node:test'
import assert from 'node:assert/strict'
import {dishStatus,menuCounts,selectMenu,initialFilters,draftErrors,dishDraft} from '../src/features/dishes/menu-model.ts'
const dish=(id,name,price_vnd='45000',extra={})=>({id,name,price_vnd,category_id:'1',is_visible:true,is_available:true,...extra})
test('hidden dishes never inflate selling/sold-out counts',()=>{
 const rows=[dish('1','Cơm'),dish('2','Bún','1',{is_available:false}),dish('3','Phở','1',{is_visible:false}),dish('4','Mì','1',{is_visible:false,is_available:false})]
 assert.deepEqual(menuCounts(rows),{total:4,selling:1,soldout:1,hidden:2});assert.equal(dishStatus(rows[3]),'hidden');assert.equal(selectMenu(rows,{...initialFilters,status:'soldout'}).length,1)
})
test('search handles Vietnamese accents and combines category/status without mutating data',()=>{
 const rows=[dish('1','Bánh mì trứng'),dish('2','Bánh mì đặc biệt','10',{category_id:'2'}),dish('3','Bánh mì hết','1',{is_available:false})]
 assert.deepEqual(selectMenu(rows,{...initialFilters,query:'  banh mi ',category:'1',status:'selling'}).map(d=>d.id),['1']);assert.equal(selectMenu(rows,{...initialFilters,query:'dac biet'})[0].id,'2');assert.deepEqual(rows.map(d=>d.id),['1','2','3'])
})
test('price sort preserves exact strings above Number safe integer, numeric ID breaks name ties',()=>{
 const rows=[dish('10','Món','9007199254740993'),dish('2','Món','9007199254740992'),dish('3','Khác','0')]
 assert.deepEqual(selectMenu(rows,{...initialFilters,sort:'price-asc'}).map(d=>d.id),['3','2','10']);assert.deepEqual(selectMenu(rows,{...initialFilters,sort:'price-desc'}).map(d=>d.id),['10','2','3']);assert.equal(rows[0].price_vnd,'9007199254740993');assert.deepEqual(selectMenu([dish('10','Cơm'),dish('2','Cơm')],initialFilters).map(d=>d.id),['2','10'])
})
test('validation matches exact price and codepoint limits, independent visibility/availability',()=>{
 const draft={...dishDraft(),name:'Cơm',category_id:'1',price_vnd:'0'};assert.deepEqual(draftErrors(draft),{});for(const price_vnd of ['01','-1','1.5','1e3','1000000001',''])assert(draftErrors({...draft,price_vnd}).price_vnd);assert.deepEqual(draftErrors({...draft,price_vnd:'1000000000'}),{});assert(draftErrors({...draft,name:'  '}).name);assert(draftErrors({...draft,description:'😀'.repeat(2001)}).description);assert.equal(dishDraft(dish('1','Cơm','1',{is_visible:false,is_available:true})).is_available,true)
})
