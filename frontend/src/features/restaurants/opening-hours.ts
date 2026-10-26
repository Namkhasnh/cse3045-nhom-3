import type {Hours} from './api/settings.api'
export const weekdays=['Thứ hai','Thứ ba','Thứ tư','Thứ năm','Thứ sáu','Thứ bảy','Chủ nhật']
export function hoursErrors(hours:Hours[]):Record<number,string>{
 const errors:Record<number,string>={};if(hours.length>56)errors[-1]='Tối đa 56 khoảng giờ mỗi tuần.'
 const spans:{start:number;end:number;i:number}[]=[]
 const seconds=(v:string)=>/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(v)?v.split(':').reduce((a,n)=>a*60+Number(n),0):NaN
 hours.forEach((h,i)=>{const start=seconds(h.opens_at),end=seconds(h.closes_at)+(h.closes_next_day?86400:0);if(!Number.isInteger(h.weekday)||h.weekday<1||h.weekday>7||!Number.isFinite(start)||!Number.isFinite(end)||end<=start||end-start>86400){errors[i]='Nhập giờ 24 giờ hợp lệ; khoảng phải lớn hơn 0 và không quá 24 giờ.';return}const a=(h.weekday-1)*86400+start;spans.push({start:a,end:a+end-start,i},{start:a-604800,end:a+end-start-604800,i})})
 spans.sort((a,b)=>a.start-b.start);for(let i=1;i<spans.length;i++)if(spans[i].start<spans[i-1].end){errors[spans[i].i]='Khoảng giờ chồng lấn với lịch trong tuần.';errors[spans[i-1].i]='Khoảng giờ chồng lấn với lịch trong tuần.'}
 return errors
}
