import type {IconName} from '../../shared/ui/Icon'
export const orderSteps: {status:string; label:string; icon:IconName}[] = [
 {status:'pending',label:'Chờ quán nhận',icon:'clock'},
 {status:'accepted',label:'Đang chuẩn bị',icon:'bowl'},
 {status:'delivering',label:'Đang giao',icon:'delivery'},
 {status:'completed',label:'Hoàn thành',icon:'bag'},
]
// A completed order has no current/upcoming stage; stopped/unknown states imply no progress.
export function progressState(status:string, index:number): 'done'|'active'|'upcoming' {
 const current=orderSteps.findIndex(step=>step.status===status)
 if(current<0)return 'upcoming'
 if(index<current||status==='completed')return 'done'
 return index===current?'active':'upcoming'
}
