import {request} from '../../shared/api/request'
export type Page<T>={data:T[];page:{has_more:boolean;next_cursor:string|null}}
export type ManagedUser={id:string;display_name:string;is_active:boolean;version:number;managed_restaurant_id:string|null;is_sole_admin?:boolean;credentials_blocked?:boolean;erasure_requested?:boolean;erasure?:{version:number;verified_at:string|null;erased_at:string|null;created_at:string}|null;email?:string|null;phone?:string|null}
export type Ticket={id:string;order_id:string;category:string;priority:string;status:string;version:number;outcome:string|null;is_requester?:boolean;first_response_due_at:string;next_update_due_at:string;overdue:boolean;escalated_at:string|null;escalation_requested_at:string|null;messages?:{id:string;role:string;body:string|null;created_at:string}[];message_page?:{has_more:boolean;next_cursor:string|null}}
export type AuditRow={id:string;actor_id:string;action:string;target_type:string;target_id:string;created_at:string;request_id:string|null;changes:Record<string,string|boolean|number|null>;redacted:boolean}
export type Hold={id:string;version:number;created_at:string;review_due_at:string;released_at:string|null}
export type Erasure={created_at:string;acknowledge_due_at:string;acknowledged_at:string|null;verified_at:string|null;eligible_at:string|null;erasure_due_at:string|null;erased_at:string|null;version:number}
export const adminApi={read:<T>(actor:string,path:string,signal:AbortSignal)=>request<T>(path,'GET',undefined,undefined,signal,actor)}
