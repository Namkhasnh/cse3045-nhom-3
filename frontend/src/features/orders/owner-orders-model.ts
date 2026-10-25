export const ownerColumns=[{status:'pending',label:'Đơn mới',icon:'inbox'},{status:'accepted',label:'Đang chuẩn bị',icon:'bowl'},{status:'delivering',label:'Đang giao',icon:'delivery'},{status:'completed',label:'Hoàn thành',icon:'check'}] as const
export function validOwnerDate(value:string){if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const d=new Date(value+'T00:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===value}
export function ownerFilters(code:string,method:string,from:string,until:string){
 const q=new URLSearchParams();if(code.trim())q.set('code',code.trim().toUpperCase());if(method)q.set('payment_method',method)
 if(validOwnerDate(from))q.set('created_from',new Date(from+'T00:00:00+07:00').toISOString())
 if(validOwnerDate(until))q.set('created_until',new Date(new Date(until+'T00:00:00+07:00').getTime()+86400000).toISOString())
 return q.toString()
}
export function ownerAction(o:{status:string;food_ready?:unknown}){return o.status==='pending'?{label:'Nhận đơn',action:'transitions',body:{status:'accepted'}}:o.status==='accepted'?!o.food_ready?{label:'Đã xong món – chờ giao',action:'food-ready',body:{}}:{label:'Bắt đầu giao món',action:'transitions',body:{status:'delivering'}}:o.status==='delivering'?{label:'Hoàn thành đơn',action:'transitions',body:{status:'completed'}}:null}
