import {mutationFeedback,showFeedback} from '../../../shared/lib/feedback'
export type Terms = {version:string;hash:string;content:string}
export type Fields = {restaurant_name:string;address:string;contact_name:string;contact_phone:string;front_image_id:string;business_document_id:string;terms_version:string;terms_hash:string}
export type Application = {id:string;applicant_id?:string;kind:string;status:string;version:number;payload:Fields;terms_version:string;terms_hash:string;consent_at:string|null;created_at:string;restaurant_id:string|null;review:{decision:string;reason:string|null;created_at:string}|null}
export type Page = {data:Application[];page:{has_more:boolean;next_cursor:string|null}}
export class OnboardingError extends Error {readonly status:number;readonly code:string;constructor(status:number,code:string){super(code);this.status=status;this.code=code}}
async function request<T>(path:string,method='GET',body?:object,key?:string,signal?:AbortSignal):Promise<T> {
 const csrf=document.cookie.split(';').map(v=>v.trim()).find(v=>v.startsWith('__Host-hlf_csrf='))?.slice('__Host-hlf_csrf='.length)
 const response=await fetch(`/api/v1${path}`,{method,signal,credentials:'same-origin',cache:'no-store',headers:{...(body?{'Content-Type':'application/json'}:{}),...(csrf&&method!=='GET'?{'X-CSRF-Token':csrf}:{}),...(key?{'Idempotency-Key':key}:{})},body:body?JSON.stringify(body):undefined})
 const payload=await response.json().catch(()=>null)
 if(!response.ok){const error=new OnboardingError(response.status,payload?.error?.code??'NETWORK_ERROR');if(mutationFeedback(path,method,null))showFeedback(errorMessage(error),'error');throw error}
 const feedback=mutationFeedback(path,method,payload?.data)
 if(feedback&&payload?.data!==undefined)showFeedback(feedback)
 return payload?.page?payload:payload.data
}
export const onboardingApi={
 detail:(id:string,admin=false,signal?:AbortSignal)=>request<Application>((admin?'/admin':'')+'/restaurant-applications/'+id,'GET',undefined,undefined,signal),
 users:(q:string)=>request<{id:string;display_name:string;login_identifier:string}[]>('/admin/onboarding-users?q='+encodeURIComponent(q)),
 propose:(body:Fields & {applicant_id:string},key:string)=>request<Application>('/admin/restaurant-invitations','POST',body,key),
 confirm:(id:string,body:{expected_version:number;terms_hash:string;consent:true},key:string)=>request<Application>(`/restaurant-applications/${id}/confirm`,'POST',body,key),
 create:(id:string,expected_version:number,key:string)=>request<{id:string;readiness:string}>('/admin/restaurants','POST',{application_id:id,expected_version},key),
 review:(id:string,body:{expected_version:number;decision:string;reason?:string},key:string)=>request<Application>(`/admin/restaurant-applications/${id}/review`,'POST',body,key),
 terms:(version?:string,signal?:AbortSignal)=>request<Terms>(`/partnership-terms/${version?encodeURIComponent(version):'current'}`,'GET',undefined,undefined,signal),
 list:(admin=false,cursor?:string,signal?:AbortSignal)=>request<Page>(`${admin?'/admin':''}/restaurant-applications${cursor?'?cursor='+encodeURIComponent(cursor):''}`,'GET',undefined,undefined,signal),
 submit:(body:Fields & {consent:true},key:string)=>request<Application>('/restaurant-applications','POST',body,key),
 evidence:(id:string,admin=false)=>request<{mime_type:string;content_base64:string}>(`${admin?'/admin':''}/onboarding-evidence/${id}`),
 upload:async(file:File,kind:'front_image'|'business_document',applicant_id?:string)=>{
  if(file.size>5242880||!file.size)throw new OnboardingError(422,'FILE_SIZE')
  const content_base64=await new Promise<string>((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result).split(',')[1]);r.onerror=reject;r.readAsDataURL(file)})
  return request<{id:string}>(`${applicant_id?'/admin':''}/onboarding-evidence`,'POST',{kind,mime_type:file.type,content_base64,...(applicant_id?{applicant_id}:{})})
 },
}
export function errorMessage(error:unknown) {
 if(error instanceof OnboardingError){
  if(error.status===503)return 'Dịch vụ hồ sơ tạm thời chưa sẵn sàng. Hãy thử tải lại sau.'
  if(error.status===401)return 'Phiên đăng nhập đã hết hạn. Đăng nhập lại bằng cùng tài khoản để tiếp tục.'
  const messages:Record<string,string>={APPLICATION_PENDING:'Bạn đã có hồ sơ đang chờ xác nhận hoặc duyệt.',RESTAURANT_LIMIT_REACHED:'Tài khoản đã quản lý một quán.',TERMS_VERSION_CONFLICT:'Điều khoản đã thay đổi. Tải điều khoản mới, đọc và đồng ý lại.',IDEMPOTENCY_KEY_REUSED:'Khóa gửi không khớp. Hãy kiểm tra lại nội dung.',VERSION_CONFLICT:'Hồ sơ đã thay đổi. Tải lại danh sách.',APPLICATION_STATE_CONFLICT:'Hồ sơ đã được xử lý. Tải lại danh sách.',VALIDATION_ERROR:'Kiểm tra thông tin, định dạng và dung lượng tài liệu (tối đa 5 MiB/file).',FILE_SIZE:'File phải có dữ liệu và không quá 5 MiB.'}
  return messages[error.code]??'Không thực hiện được yêu cầu. Hãy thử lại.'
 }
 return 'Chưa rõ kết quả gửi. Giữ nguyên nội dung và thử lại để khôi phục cùng yêu cầu.'
}
