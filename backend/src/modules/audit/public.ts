import {Injectable} from '@nestjs/common';
import {AuditLookupRepository} from './lookup.repository.js';
export {AuditService,auditActions,auditTargets} from './audit.service.js';
const allowed=new Set(['from_is_active','from_credentials_blocked','credentials_blocked','is_active','version','from_status','to_status','status','method','rate','restaurant_id','order_id','receipt_id','refund_id','dispute_id','request_id','count','deleted','classification','is_active_changed','email_verified']);
// Legacy reasons/names/contacts are excluded even when formerly written by a permitted action.
export function redactAudit(changes:unknown){const safe:Record<string,string|number|boolean|null>={};let redacted=false;if(!changes||typeof changes!=='object'||Array.isArray(changes))return {changes:safe,redacted:true};for(const [key,value] of Object.entries(changes)){if(!allowed.has(key)||value!==null&&!['boolean','number','string'].includes(typeof value)||typeof value==='string'&&!/^(?:[0-9]+(?:\.[0-9]{8})?|pending|accepted|rejected|delivering|completed|cancelled|open|in_progress|waiting_requester|waiting_partner|resolved|closed|cash|qr|student|user|local_demo)$/.test(value)){redacted=true;continue;}safe[key]=value as string|number|boolean|null;}return {changes:safe,redacted};}
@Injectable() export class AuditLookup extends AuditLookupRepository {}
