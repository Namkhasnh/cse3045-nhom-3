import { ConflictException, UnprocessableEntityException } from '@nestjs/common';
import { createHash } from 'node:crypto';
export const invalid = (): never => { throw new UnprocessableEntityException({ code: 'VALIDATION_ERROR', message: 'Thông tin hồ sơ không hợp lệ.' }); };
export const conflict = (code: string): never => { throw new ConflictException({ code, message: 'Dữ liệu đã thay đổi. Hãy kiểm tra lại hồ sơ.' }); };
export function object(value: unknown, allowed: string[], required = allowed): Record<string, unknown> {
 if (!value || typeof value !== 'object' || Array.isArray(value)) return invalid();
 const body = value as Record<string, unknown>;
 if (Object.keys(body).some(k => !allowed.includes(k)) || required.some(k => !(k in body))) return invalid();
 return body;
}
export function id(value: unknown): string {
 if (typeof value !== 'string' || !/^[1-9][0-9]{0,18}$/.test(value) || BigInt(value) > 9223372036854775807n) return invalid();
 return value;
}
export function text(value: unknown, max: number): string {
 if (typeof value !== 'string' || !value.trim() || [...value].length > max || [...value].some(c => c.charCodeAt(0)<32 && ![9,10,13].includes(c.charCodeAt(0)))) return invalid();
 return value;
}
export function hash(value: unknown): string {
 if (typeof value !== 'string' || !/^[a-f0-9]{64}$/.test(value)) return invalid(); return value;
}
export function version(value: unknown): number {
 if (!Number.isInteger(value) || (value as number) < 1 || (value as number) >= 2147483647) return invalid(); return value as number;
}
export const digest = (value: Buffer | string) => createHash('sha256').update(value).digest('hex');
export const canonical = (body: Record<string, unknown>) => JSON.stringify(Object.fromEntries(Object.entries(body).sort(([a],[b]) => a<b?-1:a>b?1:0)));
export function requestKey(value: unknown): string {
 if (typeof value !== 'string' || !/^[!-~]{1,128}$/.test(value)) return invalid(); return value;
}
export type ApplicationInput = { restaurant_name: string; address: string; contact_name: string; contact_phone: string;
 front_image_id: string; business_document_id: string; terms_version: string; terms_hash: string };
export const applicationFields = ['restaurant_name','address','contact_name','contact_phone','front_image_id','business_document_id','terms_version','terms_hash'];
export function applicationInput(value: unknown, manual = false): ApplicationInput & { applicant_id?: string; consent?: true } {
 const b = object(value, [...applicationFields, manual ? 'applicant_id' : 'consent']);
 if (!manual && b.consent !== true) return invalid();
 const phone = text(b.contact_phone,16); if (!/^\+?[0-9]{9,15}$/.test(phone)) return invalid();
 return { restaurant_name:text(b.restaurant_name,200), address:text(b.address,1000), contact_name:text(b.contact_name,200), contact_phone:phone,
  front_image_id:id(b.front_image_id), business_document_id:id(b.business_document_id), terms_version:text(b.terms_version,64), terms_hash:hash(b.terms_hash),
  ...(manual ? {applicant_id:id(b.applicant_id)} : {consent:true}) };
}
export function pageInput(raw: Record<string, unknown>, admin = false) {
 const b = object(raw, admin ? ['limit','cursor','status'] : ['limit','cursor'], []);
 const limit = b.limit === undefined ? 20 : typeof b.limit === 'string' && /^[1-9][0-9]{0,2}$/.test(b.limit) ? Number(b.limit) : invalid();
 if (limit > 100) return invalid();
 const status = b.status === undefined ? undefined : text(b.status,32);
 if (status && !['awaiting_confirmation','submitted','approved','rejected'].includes(status)) return invalid();
 return { limit, cursor: b.cursor === undefined ? undefined : id(b.cursor), status };
}
export function evidenceInput(value: unknown) {
 const b = object(value,['kind','mime_type','content_base64','applicant_id'],['kind','mime_type','content_base64']);
 const kind = b.kind; if (kind !== 'front_image' && kind !== 'business_document') return invalid();
 if (typeof b.content_base64 !== 'string' || b.content_base64.length > 6990508 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(b.content_base64)) return invalid();
 const bytes = Buffer.from(b.content_base64,'base64');
 if (!bytes.length || bytes.length > 5242880 || bytes.toString('base64') !== b.content_base64) return invalid();
 // Container signatures + end markers prevent trusting MIME/filename alone. Images are never rendered as HTML/SVG.
 const mime = bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) && bytes.subarray(-8).equals(Buffer.from([73,69,78,68,174,66,96,130])) ? 'image/png'
  : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 && bytes.subarray(-2).equals(Buffer.from([255,217])) ? 'image/jpeg'
  : bytes.subarray(0,5).toString() === '%PDF-' && bytes.subarray(-1024).toString().trimEnd().endsWith('%%EOF') ? 'application/pdf' : invalid();
 if (b.mime_type !== mime || (kind === 'front_image' && mime === 'application/pdf')) return invalid();
 return { kind:kind as 'front_image'|'business_document', mime, bytes, applicantId: b.applicant_id === undefined ? undefined : id(b.applicant_id) };
}
