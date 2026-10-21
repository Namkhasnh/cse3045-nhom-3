import {invalid,conflict} from '../../common/http/input.js';
export const SUPPORT_STATES=['open','in_progress','waiting_requester','waiting_partner','resolved','closed'] as const;
export const CATEGORIES=['delivery','payment_refund','account_access','other'];
export const OUTCOMES=['answered','action_recorded','unable_to_resolve'];
const HOUR=3600000;
export function supportDeadlines(r:{priority:string;created_at:Date;first_response_at:Date|null;last_admin_update_at:Date|null;status:string},now=new Date()) {
 const urgent=r.priority==='urgent',first=new Date(r.created_at.getTime()+(urgent?2:24)*HOUR),next=new Date((r.last_admin_update_at??r.created_at).getTime()+(urgent?4:48)*HOUR),terminal=['resolved','closed'].includes(r.status);
 return {first_response_due_at:first.toISOString(),next_update_due_at:next.toISOString(),overdue:!terminal&&(!r.first_response_at&&now>first||now>next)};
}
export function transitionSupport(from:string,to:string){if(!SUPPORT_STATES.includes(to as typeof SUPPORT_STATES[number]))return invalid();if(from===to)return false;const edges:Record<string,string[]>={open:['in_progress'],in_progress:['waiting_requester','waiting_partner','resolved'],waiting_requester:['in_progress'],waiting_partner:['in_progress'],resolved:['closed'],closed:[]};if(!edges[from]?.includes(to))return conflict('SUPPORT_STATE_CONFLICT');return true;}
export function closedAfter(r:{status:string;resolved_at:Date|null},now=new Date()){return r.status==='resolved'&&r.resolved_at!==null&&now.getTime()>=r.resolved_at.getTime()+7*24*HOUR;}
export const addDays=(date:Date,n:number)=>new Date(date.getTime()+n*86400000);
export function addMonths(date:Date,n:number){const d=new Date(date.getTime()+7*3600000),day=d.getUTCDate();d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()+n);const last=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate();d.setUTCDate(Math.min(day,last));return new Date(d.getTime()-7*3600000);}
