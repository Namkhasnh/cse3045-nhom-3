import {createHash} from 'node:crypto';
// Credentials never enter object keys. Each disposable DB owns a separate namespace,
// even when many synthetic DBs share one local MinIO bucket and restaurant IDs.
export function paymentPrefix(databaseUrl:string,restaurant:string){let u:URL;try{u=new URL(databaseUrl);}catch{throw new Error('Payment storage target required');}if(u.protocol!=='mysql:'||!u.pathname.slice(1))throw new Error('Payment storage target required');const identity=u.hostname+':'+(u.port||'3306')+u.pathname;return 'payments/'+createHash('sha256').update(identity).digest('hex')+'/'+restaurant+'/';}
