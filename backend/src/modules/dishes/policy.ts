import {bool,id,invalid,money,object,text,version} from '../../common/http/input.js';
export function dishInput(raw:unknown,patch=false){const fields=['name','description','price_vnd','category_id','image_reference','is_visible','is_available'];const b=object(raw,[...fields,...(patch?['expected_version']:[])],patch?['expected_version']:['name','description','price_vnd','category_id']);if(patch&&Object.keys(b).length<2)return invalid();
 const data:{name?:string;description?:string;price_vnd?:bigint;category_id?:bigint;is_visible?:boolean;is_available?:boolean}={};
 if('name'in b)data.name=text(b.name,200);if('description'in b){if(typeof b.description!=='string'||[...b.description].length>2000||Buffer.byteLength(b.description,'utf8')>8000)return invalid();data.description=b.description;}
 if('price_vnd'in b){data.price_vnd=money(b.price_vnd);if(data.price_vnd>1000000000n)return invalid();}if('category_id'in b)data.category_id=BigInt(id(b.category_id));
 for(const k of ['is_visible','is_available'] as const)if(k in b)data[k]=bool(b[k]);
 let image:string|null|undefined;if('image_reference'in b){if(b.image_reference===null)image=null;else if(typeof b.image_reference==='string'&&/^\/api\/v1\/dish-media\/[1-9][0-9]{0,18}$/.test(b.image_reference)){id(b.image_reference.split('/').at(-1));image=b.image_reference;}else return invalid();}
 return {expected:patch?version(b.expected_version):0,data,image};}
