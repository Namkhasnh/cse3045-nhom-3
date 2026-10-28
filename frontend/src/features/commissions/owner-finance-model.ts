import type {Report, Row, Entry} from './finance-api.ts'

export async function collectFinanceReport(load:(cursor:string)=>Promise<Report>,signal:AbortSignal):Promise<Report>{
 let cursor='',first:Report|null=null
 const rows:Row[]=[],seen=new Set<string>(),months=new Set<string>()
 do {
  signal.throwIfAborted()
  const page=await load(cursor)
  signal.throwIfAborted()
  if(first&&page.page.as_of!==first.page.as_of)throw new Error('Report snapshot changed')
  first??=page
  for(const row of page.data){
   if(row.as_of!==first.page.as_of||months.has(row.period_start_at))throw new Error('Invalid report snapshot')
   months.add(row.period_start_at);rows.push(row)
  }
  if(!page.page.has_more)break
  cursor=page.page.next_cursor??''
  if(!cursor||seen.has(cursor))throw new Error('Invalid report cursor')
  seen.add(cursor)
 }while(cursor)
 return {...first!,data:rows,page:{...first!.page,has_more:false,next_cursor:null}}
}
export const reportRevenue=(rows:Row[])=>rows.reduce((total,row)=>total+BigInt(row.dish_revenue_vnd),0n).toString()
export const entryKind=(entry:Entry)=>entry.kind==='base'?'Hoa hồng cơ bản':entry.kind==='adjustment'?'Điều chỉnh':'Bù voucher nền tảng'
export function periodStatus(row:Row){
 const at=Date.parse(row.as_of),end=Date.parse(row.period_end_at)
 if(!row.settlement_id){
  if(at<end)return {label:'Tháng đang mở',tone:'neutral'}
  if(row.entry_count>0&&at>=end+3*86400000)return {label:'Quá hạn lập bảng',tone:'warning'}
  return {label:'Chưa chốt',tone:'neutral'}
 }
 if(BigInt(row.outstanding_vnd)<0n)return {label:'Dư có bù trừ',tone:'credit'}
 if(BigInt(row.outstanding_vnd)===0n)return {label:'Đã đối soát',tone:'credit'}
 if(BigInt(row.collectible_vnd)>0n&&at>=end+7*86400000)return {label:'Quá hạn thanh toán',tone:'warning'}
 return {label:'Đã chốt · còn dư',tone:'warning'}
}
