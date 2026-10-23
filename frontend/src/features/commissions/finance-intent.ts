export type FinanceIntent={actor:string;restaurant:string;path:string;body:object;key:string|null}
export function financeIntent(value:unknown,actor:string,restaurant:string):FinanceIntent{
 if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Invalid intent');const p=value as FinanceIntent
 if(Object.keys(p).sort().join(',')!=='actor,body,key,path,restaurant'||p.actor!==actor||p.restaurant!==restaurant||!p.body||typeof p.body!=='object'||Array.isArray(p.body)||typeof p.path!=='string'||!(p.key===null||typeof p.key==='string'&&/^[!-~]{1,128}$/.test(p.key)))throw new Error('Invalid intent')
 if(p.path==='/settlements'){const b=p.body as Record<string,unknown>;if(p.key!==null||b.restaurant_id!==restaurant||!Array.isArray(b.entry_ids)||!b.entry_ids.length||b.entry_ids.some(v=>typeof v!=='string'||!/^[1-9][0-9]*$/.test(v))||typeof b.period_start_at!=='string'||typeof b.period_end_at!=='string')throw new Error('Invalid create intent')}
 else if(p.key===null||!(/^\/settlements\/[1-9][0-9]*\/receipts(?:\/[1-9][0-9]*\/reversals)?$/.test(p.path)||p.path==='/commission-adjustments'))throw new Error('Invalid financial scope')
 return p
}
