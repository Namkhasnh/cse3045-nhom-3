import type {Payment} from '../../shared/api/payment'
import {request} from '../../shared/api/request'
export type QrProposal={id:string;qr_version:number|null;bank_code:string;bank_name:string;account_number:string;account_name:string;qr_image_id:string;status:'pending'|'approved'|'rejected'|'suspended';version:number;reason:string|null}
export type QrSettings={restaurant_id:string;version:number;active:QrProposal|null;proposals:QrProposal[]}
export type Instructions={order_id:string;qr_version:number;bank_code:string;bank_name:string;account_number:string;account_name:string;qr_image_id:string;amount_vnd:string;reference:string;transfer_allowed:boolean;blocked_reason:string|null}
export type Receipt={id:string;amount_vnd:string;received_at:string;confirmed_at:string;classification:string;instruction_version:number;transaction_reference?:string;evidence_id?:string}
export type Refund={id:string;receipt_id:string;amount_vnd:string;status:'pending'|'refunded';reason:string;due_at:string;overdue:boolean;refunded_at:string|null;transaction_reference?:string|null;evidence_id?:string|null}
export type Dispute={id:string;order_id:string;receipt_id:string|null;refund_id:string|null;reason:string;status:'open'|'resolved';version:number;resolution_note:string|null;created_at:string;resolved_at:string|null}
export const paymentLabel=(status:string|undefined)=>({not_tracked:'Thanh toán ngoài hệ thống',not_required:'Không cần thanh toán',unpaid:'Chưa thu tiền',paid:'Đã thu tiền',refund_pending:'Cần hoàn tiền',refunded:'Đã hoàn tiền'}[status??'']??'Chưa có bản ghi thu tiền')
export const paymentsApi={
 payment:(actor:string,id:string,signal?:AbortSignal)=>request<Payment>('/orders/'+id+'/payment','GET',undefined,undefined,signal,actor),
 settings:(actor:string,id:string,admin=false,signal?:AbortSignal)=>request<QrSettings>((admin?'/admin':'/owner')+'/restaurants/'+id+'/qr-settings','GET',undefined,undefined,signal,actor),
 options:(id:string,signal?:AbortSignal)=>request<{cod:true;cash:false;qr:null}>('/restaurants/'+id+'/payment-options','GET',undefined,undefined,signal),
 instructions:(actor:string,id:string,signal?:AbortSignal)=>request<Instructions>('/orders/'+id+'/payment-instructions','GET',undefined,undefined,signal,actor),
 image:(actor:string,restaurant:string,id:string,signal?:AbortSignal)=>request<{mime_type:string;content_base64:string}>('/restaurants/'+restaurant+'/payment-evidence/'+id,'GET',undefined,undefined,signal,actor),
 disputes:(actor:string,id:string,signal?:AbortSignal)=>request<Dispute[]>('/orders/'+id+'/payment/disputes','GET',undefined,undefined,signal,actor)
}
export async function imageBody(file:File,kind:'qr'|'receipt'|'refund'){if(!['image/png','image/jpeg'].includes(file.type)||file.size<=0||file.size>5242880)throw new Error('Chọn ảnh JPEG/PNG không quá 5 MiB.');const content_base64=await new Promise<string>((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result).split(',')[1]);r.onerror=reject;r.readAsDataURL(file)});return {kind,mime_type:file.type,content_base64}}
