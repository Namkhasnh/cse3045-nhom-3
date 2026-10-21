export type PaymentIntent={actor:string;path:string;method:string;body:object;key:string}
export function paymentIntent(value:unknown,actor:string,scope:string):PaymentIntent{
 if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Corrupt payment intent');const p=value as PaymentIntent
 if(Object.keys(p).sort().join(',')!=='actor,body,key,method,path'||p.actor!==actor||typeof p.key!=='string'||!/^[!-~]{1,128}$/.test(p.key)||!p.body||typeof p.body!=='object'||Array.isArray(p.body)||!['POST','PUT'].includes(p.method)||typeof p.path!=='string')throw new Error('Corrupt payment intent')
 let allowed=false
 if(/^order-[1-9][0-9]*$/.test(scope)){const id=scope.slice(6);allowed=new RegExp('^/orders/'+id+'/payment/(confirm|confirm-refund|claims|disputes)$').test(p.path)||new RegExp('^/admin/orders/'+id+'/payment/disputes/[1-9][0-9]*/resolve$').test(p.path);allowed=allowed&&p.method==='POST'}
 else if(/^qr-image-[1-9][0-9]*$/.test(scope))allowed=p.path==='/owner/restaurants/'+scope.slice(9)+'/payment-evidence'&&p.method==='POST'
 else if(/^qr-[1-9][0-9]*$/.test(scope)){const id=scope.slice(3);allowed=(p.method==='PUT'&&p.path==='/owner/restaurants/'+id+'/qr-settings')||(p.method==='POST'&&new RegExp('^/(owner|admin)/restaurants/'+id+'/qr-settings/(review|suspend)$').test(p.path))}
 else if(/^proof-[1-9][0-9]*$/.test(scope))allowed=p.method==='POST'&&/^\/owner\/restaurants\/[1-9][0-9]*\/payment-evidence$/.test(p.path)
 if(!allowed)throw new Error('Payment intent scope mismatch');return p
}
