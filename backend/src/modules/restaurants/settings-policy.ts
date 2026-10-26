import {bool,invalid,object,text,version} from '../../common/http/input.js';
export type Hours={weekday:number;opens_at:string;closes_at:string;closes_next_day:boolean};
const day=86400,week=7*day;
function seconds(v:unknown):number {if(typeof v!=='string'||!/^([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/.test(v))return invalid();const [h,m,s]=v.split(':').map(Number);return h*3600+m*60+s;}
export function hoursInput(value:unknown):Hours[] {
 if(!Array.isArray(value)||value.length>56)return invalid();
 const spans:Array<[number,number]>=[];
 const result=value.map(raw=>{const b=object(raw,['weekday','opens_at','closes_at','closes_next_day']);
 if(!Number.isInteger(b.weekday)||(b.weekday as number)<1||(b.weekday as number)>7)return invalid();
 const start=seconds(b.opens_at),end=seconds(b.closes_at)+(bool(b.closes_next_day)?day:0),length=end-start;
 if(length<=0||length>day)return invalid();const a=((b.weekday as number)-1)*day+start;spans.push([a,a+length]);
 return b as Hours;});
 const expanded=spans.flatMap(([a,b])=>[[a,b],[a-week,b-week]]).sort((a,b)=>a[0]-b[0]);
 if(expanded.some((span,i)=>i>0&&span[0]<expanded[i-1][1]))return invalid();return result;
}
export function openAt(hours:Hours[],instant=new Date()):boolean {
 const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Ho_Chi_Minh',weekday:'short',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(instant);
 const val=(k:string)=>parts.find(p=>p.type===k)!.value;
 const n=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].indexOf(val('weekday'))*day+Number(val('hour'))*3600+Number(val('minute'))*60+Number(val('second'));
 return hours.some(h=>{const a=(h.weekday-1)*day+seconds(h.opens_at),b=(h.weekday-1)*day+seconds(h.closes_at)+(h.closes_next_day?day:0);return [n,n+week].some(x=>x>=a&&x<b);});
}
export function settingsInput(raw:unknown,admin=false) {
 const b=object(raw,['expected_version','name','address','contact_phone','latitude','longitude',...(admin?['is_active']:['hours','is_accepting_orders','description','cover_image_reference','avatar_image_reference'])],['expected_version']);
 if('description' in b&&b.description!==null){if(typeof b.description!=='string'||[...b.description].length>2000||Buffer.byteLength(b.description,'utf8')>8000)return invalid();if(b.description.trim())text(b.description,2000);}
 for(const key of ['cover_image_reference','avatar_image_reference'])if(key in b&&b[key]!==null&&(typeof b[key]!=='string'||!/^\/api\/v1\/restaurant-cover-media\/[1-9][0-9]{0,18}$/.test(b[key])))return invalid();
 const expected=version(b.expected_version);if(Object.keys(b).length<2)return invalid();
 const data:Record<string,string|boolean|null>={};
 for(const [key,max] of [['name',200],['address',1000],['contact_phone',32]] as const)if(key in b)data[key]=text(b[key],max);
 if('contact_phone' in data&&!/^\+?[0-9]{9,15}$/.test(data.contact_phone as string))return invalid();
 if(('latitude' in b)!==('longitude' in b))return invalid();
 for(const key of ['latitude','longitude'])if(key in b){const v=b[key];if(v!==null&&(typeof v!=='string'||! /^-?(0|[1-9][0-9]{0,2})\.[0-9]{6}$/.test(v)||Math.abs(Number(v))>(key==='latitude'?90:180)))return invalid();data[key]=v as string|null;}
 if('latitude' in b&&(b.latitude===null)!==(b.longitude===null))return invalid();
 for(const key of ['is_active','is_accepting_orders'])if(key in b)data[key]=bool(b[key]);
 if('description' in b)data.description=typeof b.description==='string'?b.description.trim()||null:null;
 return {expected,data,avatar:'avatar_image_reference' in b?b.avatar_image_reference===null?null:(b.avatar_image_reference as string):undefined,cover:'cover_image_reference' in b?b.cover_image_reference===null?null:(b.cover_image_reference as string):undefined,hours:'hours' in b?hoursInput(b.hours):undefined};
}
export type Checklist={profile:boolean;hours:boolean;menu:boolean;delivery:boolean;commission:boolean};
export const ready=(c:Checklist)=>Object.values(c).every(Boolean);
